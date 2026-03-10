import { useState, useEffect } from 'react';

const STORAGE_KEY = "wholesaleos_audio_guidance";

export function useAudioGuidance() {
    // If not set, we default to false (silent) to avoid startling users on first load
    const [enabled, setEnabled] = useState(() => {
        return localStorage.getItem(STORAGE_KEY) === "true";
    });

    const toggle = () => {
        const newState = !enabled;
        setEnabled(newState);
        localStorage.setItem(STORAGE_KEY, newState.toString());
    };

    return { enabled, toggle };
}
