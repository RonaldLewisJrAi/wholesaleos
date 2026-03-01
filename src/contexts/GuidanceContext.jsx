import React, { createContext, useContext, useState, useEffect } from 'react';

const GuidanceContext = createContext();

export const GuidanceProvider = ({ children }) => {
    // Mode can be: 'off', 'insight', 'tour'
    const [guidanceMode, setGuidanceMode] = useState(() => {
        const savedMode = localStorage.getItem('wholesale_os_guidance_mode');
        return savedMode || 'off';
    });

    useEffect(() => {
        localStorage.setItem('wholesale_os_guidance_mode', guidanceMode);
    }, [guidanceMode]);

    const toggleInsightMode = () => {
        setGuidanceMode(prev => prev === 'insight' ? 'off' : 'insight');
    };

    const toggleTourMode = () => {
        setGuidanceMode(prev => prev === 'tour' ? 'off' : 'tour');
    };

    return (
        <GuidanceContext.Provider value={{
            guidanceMode,
            setGuidanceMode,
            toggleInsightMode,
            toggleTourMode
        }}>
            {children}
        </GuidanceContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGuidance = () => {
    return useContext(GuidanceContext);
};
