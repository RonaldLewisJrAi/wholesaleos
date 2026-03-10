import React, { useState, useEffect } from 'react';
import { OSARHeader } from './OSARHeader';
import { OSARChatHistory, ChatMessage } from './OSARChatHistory';
import { OSARInput } from './OSARInput';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { askOSAR } from '../../services/osarAssistantService';
import { osarVoiceService } from '../../services/osarVoiceService';

export const OSARPanel: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(osarVoiceService.getVoiceEnabled());
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [history, setHistory] = useState<ChatMessage[]>([
        {
            id: 'init-1',
            role: 'assistant',
            text: "OSAR Service Desk ready. How can I assist you with WholesaleOS today?"
        }
    ]);

    useEffect(() => {
        // Sync visual audio playing state with the service
        osarVoiceService.setPlayStateCallback(setIsAudioPlaying);

        // Initial greeting audio if enabled
        if (isVoiceEnabled) {
            // We delay slightly so TTS doesn't clip on pure mount
            setTimeout(() => {
                osarVoiceService.speak("OSAR Service Desk ready. How can I assist you?");
            }, 500);
        }
    }, []);

    const toggleVoice = () => {
        const newState = !isVoiceEnabled;
        setIsVoiceEnabled(newState);
        osarVoiceService.setVoiceEnabled(newState);
    };

    const handleReplay = () => {
        osarVoiceService.replayLast();
    };

    const handleSubmit = async (text: string) => {
        // 1. Append User Message
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };

        // 2. Append Assistant "Typing" Message
        const tempId = (Date.now() + 1).toString();
        const typingMsg: ChatMessage = { id: tempId, role: 'assistant', text: '', isTyping: true };

        setHistory(prev => [...prev, userMsg, typingMsg]);
        setIsLoading(true);

        try {
            // 3. Fetch from Gemini
            const responseText = await askOSAR(text);

            // 4. Update History and Speak
            setHistory(prev => prev.map(msg =>
                msg.id === tempId ? { ...msg, text: responseText, isTyping: false } : msg
            ));

            osarVoiceService.speak(responseText);

        } catch (error) {
            setHistory(prev => prev.map(msg =>
                msg.id === tempId ? { ...msg, text: "Error: Failed to process request.", isTyping: false } : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`fixed right-3 top-3 bottom-3 transition-all duration-300 z-50 glass-panel flex flex-col border border-emerald-900/30 ${isExpanded ? 'w-[360px]' : 'w-16'}`}>
            <OSARHeader
                isExpanded={isExpanded}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <div className="flex flex-col flex-1 overflow-hidden h-full bg-black/80">

                    {/* Voice Controls Bar */}
                    <div className="bg-[#0B1F33]/80 px-3 py-1.5 flex justify-between items-center border-b border-emerald-900/40">
                        <button
                            onClick={handleReplay}
                            className="text-gray-400 hover:text-emerald-400 transition flex items-center gap-1 text-[10px] font-mono tracking-wider"
                        >
                            <RotateCcw size={12} /> REPLAY
                        </button>

                        <button
                            onClick={toggleVoice}
                            className={`px-2 py-0.5 text-[10px] font-mono rounded flex items-center gap-1 transition ${isVoiceEnabled ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 border border-transparent hover:text-gray-300'}`}
                        >
                            {isVoiceEnabled ? <><Volume2 size={12} /> ON</> : <><VolumeX size={12} /> MUTED</>}
                        </button>
                    </div>

                    <OSARChatHistory
                        history={history}
                        isAudioPlaying={isAudioPlaying}
                    />

                    <OSARInput
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                    />
                </div>
            )}
        </div>
    );
};
