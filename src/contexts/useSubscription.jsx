import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    const { user } = useAuth();
    // Default tier is 'BASIC', 'PRO', 'SUPER'
    const [subscriptionTier, setSubscriptionTier] = useState('PRO'); // Default fallback
    const [primaryPersona, setPrimaryPersona] = useState('WHOLESALER');
    const [allowedPersonas, setAllowedPersonas] = useState(['WHOLESALER', 'INVESTOR', 'REALTOR', 'VIRTUAL_ASSISTANT']);
    const [currentViewPersona, setCurrentViewPersona] = useState('WHOLESALER'); // What the user is actively viewing as
    // Phase 31.5 Status: 'ACTIVE', 'GRACE_PERIOD', 'PAST_DUE', 'PAUSED', 'CANCELED', 'TERMINATED'
    const [subscriptionStatus, setSubscriptionStatus] = useState('ACTIVE');
    const [loadingSub, setLoadingSub] = useState(true);

    useEffect(() => {
        const fetchSubscriptionData = async () => {
            if (!user) {
                setLoadingSub(false);
                return;
            }

            try {
                // Get user's active organization
                const { data: userOrg, error: orgError } = await supabase
                    .from('user_organizations')
                    .select('organization_id')
                    .eq('user_id', user.id)
                    .single();

                if (orgError) throw orgError;
                const orgId = userOrg.organization_id;

                // Fetch real subscription tier and status from organizations table
                const { data: orgData, error: subError } = await supabase
                    .from('organizations')
                    .select('subscription_tier, subscription_status')
                    .eq('id', orgId)
                    .single();

                if (subError) throw subError;

                if (orgData) {
                    if (orgData.subscription_tier) setSubscriptionTier(orgData.subscription_tier);
                    if (orgData.subscription_status) setSubscriptionStatus(orgData.subscription_status);
                }

                // Phase 30 & 33.1: Fetch dynamic Personas and Server-Enforced Roles from Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('primary_persona, allowed_personas, system_role')
                    .eq('id', user.id)
                    .single();

                if (!profileError && profileData) {
                    if (profileData.primary_persona) {
                        setPrimaryPersona(profileData.primary_persona);
                        setCurrentViewPersona(profileData.primary_persona);
                    }
                    if (profileData.system_role === 'SUPER_ADMIN') {
                        // Backend-enforced absolute power
                        setAllowedPersonas(['WHOLESALER', 'INVESTOR', 'REALTOR', 'VIRTUAL_ASSISTANT', 'ADMIN']);
                        setSubscriptionTier('SUPER');
                        setSubscriptionStatus('ACTIVE');
                    } else if (profileData.allowed_personas) {
                        setAllowedPersonas(profileData.allowed_personas);
                    }
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
