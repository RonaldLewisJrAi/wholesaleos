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

            // --- DEFENSIVE SESSION GUARD ---
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                console.log("[WHOLESALEOS] Skipping org fetch — no authenticated session yet.");
                setLoadingSub(false);
                return;
            }
            // -------------------------------

            try {
                // Phase 37: Clean Auth -> Profile -> Org -> Role pipeline

                // 1. Fetch Profile and Role Data
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('organization_id, primary_persona, allowed_personas, system_role')
                    .eq('id', user.id)
                    .single();

                let profileDataToUse = profileData;

                if (profileError || !profileDataToUse) {
                    console.warn("Bootstrap Protocol: Profile missing. Attempting auto-creation...");
                    const { data: newProfile, error: createProfileErr } = await supabase
                        .from('profiles')
                        .insert({ id: user.id, system_role: 'ADMIN' })
                        .select('organization_id, primary_persona, allowed_personas, system_role')
                        .single();

                    if (createProfileErr || !newProfile) {
                        setLoadingSub(false);
                        throw new Error("CRITICAL IDENTITY FAILURE: Failed to bootstrap identity profile. Diagnostics: " + (createProfileErr?.message || "Database rejected profile insertion."));
                    }
                    profileDataToUse = newProfile;
                }

                // 2. Global Super Admin Override (Absolute Bypass)
                if (profileDataToUse.system_role === 'GLOBAL_SUPER_ADMIN') {
                    setAllowedPersonas(['WHOLESALER', 'INVESTOR', 'REALTOR', 'VIRTUAL_ASSISTANT', 'ACQUISITION', 'DISPOSITION', 'COMPLIANCE', 'ANALYST', 'ADMIN']);
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

                // 3. Organization Bootstrap Guarantee
                if (!orgId) {
                    console.warn("Bootstrap Protocol: No organization found for user. Awaiting underlying database trigger synchronization.");
                    // Defer to database trigger; we no longer manually insert to public.organizations here.
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
