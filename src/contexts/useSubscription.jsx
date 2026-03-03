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

            try {
                // Phase 37: Clean Auth -> Profile -> Org -> Role pipeline

                // 1. Fetch Profile and Role Data
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('organization_id, primary_persona, allowed_personas, system_role')
                    .eq('id', user.id)
                    .single();

                if (profileError || !profileData) {
                    console.error("Profile not initialized. Authentication session exists but profile mapped failed.", profileError);
                    // Critical failure layer: Do not crash, grant minimal defaults
                    setSystemRole('USER');
                    setSubscriptionTier('BASIC');
                    setLoadingSub(false);
                    return;
                }

                // 2. Global Super Admin Override (Absolute Bypass)
                if (profileData.system_role === 'GLOBAL_SUPER_ADMIN') {
                    setAllowedPersonas(['WHOLESALER', 'INVESTOR', 'REALTOR', 'VIRTUAL_ASSISTANT', 'ACQUISITION', 'DISPOSITION', 'COMPLIANCE', 'ANALYST', 'ADMIN']);
                    setSubscriptionTier('SUPER');
                    setSubscriptionStatus('ACTIVE');
                    setSystemRole('GLOBAL_SUPER_ADMIN');
                    if (profileData.primary_persona) {
                        setPrimaryPersona(profileData.primary_persona);
                        setCurrentViewPersona(profileData.primary_persona);
                    }
                    setLoadingSub(false);
                    return; // Fast-path exit
                }

                // Normal User Flow
                let orgId = profileData.organization_id;

                // 3. Organization Bootstrap Guarantee
                if (!orgId) {
                    console.warn("Bootstrap Protocol: No organization found for user, initializing Personal Workspace...");
                    const { data: newOrg, error: insertError } = await supabase
                        .from('organizations')
                        .insert({ name: 'Personal Workspace', subscription_tier: 'BASIC', team_seat_limit: 1 })
                        .select('id')
                        .single();

                    if (!insertError && newOrg) {
                        orgId = newOrg.id;
                        await supabase.from('profiles').update({ organization_id: orgId }).eq('id', user.id);
                    }
                }

                // Load User Personas
                if (profileData.primary_persona) {
                    setPrimaryPersona(profileData.primary_persona);
                    setCurrentViewPersona(profileData.primary_persona);
                }
                if (profileData.system_role) {
                    setSystemRole(profileData.system_role);
                }
                if (profileData.allowed_personas) {
                    setAllowedPersonas(profileData.allowed_personas);
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
