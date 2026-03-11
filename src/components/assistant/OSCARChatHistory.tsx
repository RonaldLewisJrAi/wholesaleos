import React, { useRef, useEffect } from 'react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    isTyping?: boolean;
}

interface OSCARChatHistoryProps {
    history: ChatMessage[];
    isAudioPlaying: boolean;
}

export const OSCARChatHistory: React.FC<OSCARChatHistoryProps> = ({ history, isAudioPlaying }) => {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isAudioPlaying]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm scroll-smooth">
            {history.map((msg, idx) => (
                <div key={msg.id} className={`flex items-start gap-2 ${msg.role === 'user' ? 'text-blue-400' : 'text-gray-300'}`}>
                    <span className={`font-bold mt-0.5 ${msg.role === 'user' ? 'text-blue-500' : 'text-blue-500'}`}>
                        {msg.role === 'user' ? '>' : '$'}
                    </span>
                    <div className="flex-1 leading-relaxed">
                        {msg.isTyping ? (
                            <span className="inline-block w-2 h-4 bg-white animate-pulse" />
                        ) : (
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}

                        {/* Audio Speaking Indicator on last assistant message */}
                        {isAudioPlaying && msg.role === 'assistant' && idx === history.length - 1 && !msg.isTyping && (
                            <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse" />
                        )}
                    </div>
                </div>
            ))}
            <div ref={endRef} />
        </div>
    );
};
