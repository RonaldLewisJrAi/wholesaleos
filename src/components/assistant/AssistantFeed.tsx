import React, { useEffect, useState } from 'react';
import { voiceAssistant } from '../../services/voiceAssistantService';

export const AssistantFeed: React.FC = () => {
    const [transcript, setTranscript] = useState<string>("Awaiting input...");
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    useEffect(() => {
        // Load whatever the last message globally was
        const lastMsg = voiceAssistant.getLastMessage();
        if (lastMsg) setTranscript(lastMsg);

        // Bind callbacks to the singleton
        voiceAssistant.setTranscriptCallback((msg) => setTranscript(msg));
        voiceAssistant.setPlayStateCallback((state) => setIsPlaying(state));
    }, []);

    return (
        <div className="p-4 bg-black min-h-[80px] font-mono flex flex-col justify-center border-b border-gray-800 relative overflow-hidden">
            {/* Blinking cursor effect mimicking a terminal */}
            <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                <p className={`text-sm tracking-wide leading-relaxed ${isPlaying ? 'text-white' : 'text-gray-400'}`}>
                    {transcript}
                    {isPlaying && <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse" />}
                </p>
            </div>
        </div>
    );
};
