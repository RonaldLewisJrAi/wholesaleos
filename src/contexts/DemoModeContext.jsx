/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext } from 'react';

const DemoModeContext = createContext();

export const useDemoMode = () => useContext(DemoModeContext);

export const DemoModeProvider = ({ children }) => {
    // Default to true so users see the rich mock data first
    const [isDemoMode, setIsDemoMode] = useState(true);

    return (
        <DemoModeContext.Provider value={{ isDemoMode, setIsDemoMode }}>
            {children}
        </DemoModeContext.Provider>
    );
};
