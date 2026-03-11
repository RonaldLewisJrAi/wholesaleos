import React, { createContext, useContext, useState, useEffect } from 'react';

const GuidanceContext = createContext();

export const GuidanceProvider = ({ children }) => {
    // Mode can be: 'off', 'insight'
    const [guidanceMode, setGuidanceMode] = useState(() => {
        const savedMode = localStorage.getItem('wholesale_os_guidance_mode');
        return savedMode || 'off';
    });

    const [isBeginnerModeActive, setIsBeginnerModeActive] = useState(() => {
        const savedMode = localStorage.getItem('wholesale_os_beginner_mode');
        return savedMode === 'true';
    });

    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [contextMsg, setContextMsg] = useState(null);

    useEffect(() => {
        localStorage.setItem('wholesale_os_guidance_mode', guidanceMode);
    }, [guidanceMode]);

    useEffect(() => {
        localStorage.setItem('wholesale_os_beginner_mode', isBeginnerModeActive);
    }, [isBeginnerModeActive]);

    const toggleInsightMode = () => {
        setGuidanceMode(prev => prev === 'insight' ? 'off' : 'insight');
    };

    const toggleBeginnerMode = () => {
        setIsBeginnerModeActive(prev => !prev);
    };

    const toggleAssistant = () => {
        setIsAssistantOpen(prev => !prev);
    };

    const addContext = (msg) => {
        setContextMsg(msg);
        if (!isAssistantOpen) setIsAssistantOpen(true);
    };

    return (
        <GuidanceContext.Provider value={{
            guidanceMode,
            setGuidanceMode,
            toggleInsightMode,
            isAssistantOpen,
            toggleAssistant,
            isBeginnerModeActive,
            toggleBeginnerMode,
            contextMsg,
            setContextMsg,
            addContext
        }}>
            {children}
        </GuidanceContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGuidance = () => {
    return useContext(GuidanceContext);
};
