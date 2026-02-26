import React, { createContext, useContext, useState } from 'react';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    // Default tier is 'BASIC', 'PRO', 'SUPER'
    const [subscriptionTier, setSubscriptionTier] = useState('PRO');
    const [activePersona, setActivePersona] = useState('WHOLESALER');
    // Phase 31.5 Status: 'ACTIVE', 'GRACE_PERIOD', 'PAST_DUE', 'PAUSED', 'CANCELED', 'TERMINATED'
    const [subscriptionStatus, setSubscriptionStatus] = useState('ACTIVE');

    return (
        <SubscriptionContext.Provider value={{
            subscriptionTier, setSubscriptionTier,
            activePersona, setActivePersona,
            subscriptionStatus, setSubscriptionStatus
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSubscription = () => {
    return useContext(SubscriptionContext);
};
