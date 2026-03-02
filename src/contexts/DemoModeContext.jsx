/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext } from 'react';
import { useAuth } from './useAuth';

const DemoModeContext = createContext();

export const useDemoMode = () => useContext(DemoModeContext);

export const DemoModeProvider = ({ children }) => {
    const { user } = useAuth();

    // Internal toggle state (only relevant when unauthenticated)
    const [manualDemoState, setManualDemoState] = useState(true);

    // Derived State: Unconditionally block demo mode for authenticated users
    const isDemoMode = user ? false : manualDemoState;

    // Intercept manual toggles
    const handleSetDemoMode = (val) => {
        if (user) {
            console.warn("Demo mode toggle blocked: Authenticated users cannot enter Demo Mode.");
            return;
        }
        setManualDemoState(val);
    }

    return (
        <DemoModeContext.Provider value={{ isDemoMode, setIsDemoMode: handleSetDemoMode }}>
            {children}
        </DemoModeContext.Provider>
    );
};
