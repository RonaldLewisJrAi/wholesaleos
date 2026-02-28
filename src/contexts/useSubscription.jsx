import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    const { user } = useAuth();
    // Default tier is 'BASIC', 'PRO', 'SUPER'
    const [subscriptionTier, setSubscriptionTier] = useState('PRO'); // Default fallback
    const [activePersona, setActivePersona] = useState('WHOLESALER');
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
            activePersona, setActivePersona,
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
