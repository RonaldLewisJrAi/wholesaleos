import React, { createContext, useContext, useState } from 'react';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    // Default tier is 'free', other options could be 'premium', 'live-mode'
    const [subscriptionTier, setSubscriptionTier] = useState('free');

    return (
        <SubscriptionContext.Provider value={{ subscriptionTier, setSubscriptionTier }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    return useContext(SubscriptionContext);
};
