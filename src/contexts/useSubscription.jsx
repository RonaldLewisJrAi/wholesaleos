import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    const { user } = useAuth();
    const [subscriptionTier, setSubscriptionTier] = useState('');
    const [primaryPersona, setPrimaryPersona] = useState('');
    const [allowedPersonas, setAllowedPersonas] = useState([]);
    const [currentViewPersona, setCurrentViewPersona] = useState('');
    const [subscriptionStatus, setSubscriptionStatus] = useState('');
    const [systemRole, setSystemRole] = useState('');
    const [loadingSub, setLoadingSub] = useState(true);

    useEffect(() => {
        const fetchSubscriptionData = async () => {
            if (!user) {
                setLoadingSub(false);
                return;
            }

            // --- GLOBAL SUPER ADMIN BYPASS ---
            if (user.id === 'super-admin-mock-id') {
                console.log("[useSubscription] Bypassing fetch -> Hydrating Super Admin Grants");
                setAllowedPersonas(['WHOLESALER', 'INVESTOR', 'REALTOR', 'VIRTUAL_ASSISTANT', 'ACQUISITION', 'DISPOSITION', 'COMPLIANCE', 'ANALYST', 'ADMIN', 'TITLE_COMPANY']);
                setSubscriptionTier('SUPER');
                setSubscriptionStatus('ACTIVE');
                setSystemRole('GLOBAL_SUPER_ADMIN');
                setPrimaryPersona('WHOLESALER');
                setCurrentViewPersona('WHOLESALER');
                setLoadingSub(false);
                return;
            }

            // --- DEFENSIVE SESSION GUARD ---

            try {
                // Phase 37: Clean Auth -> Profile -> Org -> Role pipeline

                // 1. Fetch Profile and Role Data (Reliance on useAuth Boot Loader for guarantees)
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('organization_id, primary_persona, allowed_personas, system_role')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError) {
                    setLoadingSub(false);
                    throw new Error("CRITICAL IDENTITY FAILURE: Failed to fetch subscription profile. " + profileError.message);
                }

                if (!profileData) {
                    console.warn("[useSubscription] Profile missing during subscription fetch. This indicates a desync with the Auth Boot Loader.");
                    setLoadingSub(false);
                    return;
                }

                let profileDataToUse = profileData;

                // 2. Global Super Admin Override (Absolute Bypass)
                if (profileDataToUse.system_role === 'GLOBAL_SUPER_ADMIN') {
                    setAllowedPersonas(['WHOLESALER', 'INVESTOR', 'REALTOR', 'VIRTUAL_ASSISTANT', 'ACQUISITION', 'DISPOSITION', 'COMPLIANCE', 'ANALYST', 'ADMIN', 'TITLE_COMPANY']);
                    setSubscriptionTier('SUPER');
                    setSubscriptionStatus('ACTIVE');
                    setSystemRole('GLOBAL_SUPER_ADMIN');
                    if (profileDataToUse.primary_persona) {
                        setPrimaryPersona(profileDataToUse.primary_persona);
                        setCurrentViewPersona(profileDataToUse.primary_persona);
                    }
                    setLoadingSub(false);
                    return; // Fast-path exit
                }

                // Normal User Flow
                let orgId = profileDataToUse.organization_id;

                // 3. Organization Bootstrap Guarantee (Polling for Trigger Sync)
                if (!orgId) {
                    console.warn("Bootstrap Protocol: No organization found for user. Awaiting underlying database trigger synchronization.");

                    let retries = 0;
                    const maxRetries = 5;
                    while (!orgId && retries < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
                        retries++;
                        console.log(`[Bootstrap Protocol] Polling profile for org_id... Attempt ${retries}`);

                        const { data: retryProfile } = await supabase
                            .from('profiles')
                            .select('organization_id')
                            .eq('id', user.id)
                            .single();

                        if (retryProfile?.organization_id) {
                            orgId = retryProfile.organization_id;
                            profileDataToUse.organization_id = orgId;
                            console.log("[Bootstrap Protocol] Trigger synchronization complete. Organization attached.");
                            break;
                        }
                    }

                    if (!orgId) {
                        console.error("[Bootstrap Protocol] FATAL: Database trigger failed to provision organization within timeout window.");
                    }
                }

                // Load User Personas
                if (profileDataToUse.primary_persona) {
                    setPrimaryPersona(profileDataToUse.primary_persona);
                    setCurrentViewPersona(profileDataToUse.primary_persona);
                }
                if (profileDataToUse.system_role) {
                    setSystemRole(profileDataToUse.system_role);
                }
                if (profileDataToUse.allowed_personas) {
                    setAllowedPersonas(profileDataToUse.allowed_personas);
                }

                // 4. Fetch real subscription tier and status from organizations table
                if (orgId) {
                    const { data: orgData, error: subError } = await supabase
                        .from('organizations')
                        .select('subscription_tier, subscription_status')
                        .eq('id', orgId)
                        .single();

                    if (!subError && orgData) {
                        setSubscriptionTier(orgData.subscription_tier || 'BASIC');
                        setSubscriptionStatus(orgData.subscription_status || 'ACTIVE');
                    }
                } else {
                    // Failsafe for deeply unlinked users
                    setSubscriptionTier('BASIC');
                    setSubscriptionStatus('ACTIVE');
                }

            } catch (err) {
                console.error("Failed to fetch dynamic subscription data:", err);
            } finally {
                setLoadingSub(false);
            }
        };

        fetchSubscriptionData();
    }, [user]);

    return (
        <SubscriptionContext.Provider value={{
            subscriptionTier, setSubscriptionTier,
            primaryPersona, allowedPersonas,
            currentViewPersona, setCurrentViewPersona,
            subscriptionStatus, setSubscriptionStatus,
            systemRole,
            loadingSub
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSubscription = () => {
    return useContext(SubscriptionContext);
};
