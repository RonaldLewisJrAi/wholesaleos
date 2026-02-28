/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useSubscription } from './useSubscription';

const DemoModeContext = createContext();

export const useDemoMode = () => useContext(DemoModeContext);

export const DemoModeProvider = ({ children }) => {
    const { subscriptionStatus, allowedPersonas } = useSubscription();

    // Default to true so users see the rich mock data first
    const [isDemoMode, setIsDemoMode] = useState(true);

    // Watch for subscription changes
    useEffect(() => {
        // Maintain manual override capability if active or if Super Admin,
        // but lock out completely if actively restricted.
        if (allowedPersonas?.includes('ADMIN')) return;

        const restrictedStatuses = ['GRACE_PERIOD', 'PAST_DUE', 'PAUSED', 'CANCELED', 'TERMINATED'];
        if (restrictedStatuses.includes(subscriptionStatus)) {
            setIsDemoMode(prev => prev !== true ? true : prev);
        }
    }, [subscriptionStatus, allowedPersonas]);

    // Intercept manual toggles if past due
    const handleSetDemoMode = (val) => {
        if (!val) { // User is trying to disable Demo Mode
            if (allowedPersonas?.includes('ADMIN')) {
                setIsDemoMode(false);
                return;
            }
            const restrictedStatuses = ['GRACE_PERIOD', 'PAST_DUE', 'PAUSED', 'CANCELED', 'TERMINATED'];
            if (restrictedStatuses.includes(subscriptionStatus)) {
                alert("Your account is currently restricted (Grace Period or Past Due). Access to Live Pipeline data is locked. Please update your billing info.");
                return;
            }
        }
        setIsDemoMode(val);
    }

    return (
        <DemoModeContext.Provider value={{ isDemoMode, setIsDemoMode: handleSetDemoMode }}>
            {children}
        </DemoModeContext.Provider>
    );
};
