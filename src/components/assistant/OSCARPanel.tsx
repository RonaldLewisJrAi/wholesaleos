import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OSCARHeader } from './OSCARHeader';
import { OSCARChatHistory, ChatMessage } from './OSCARChatHistory';
import { OSCARInput } from './OSCARInput';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { routeOSCARCommand } from '../../services/oscarCommandRouter';
import { oscarVoiceService } from '../../services/oscarVoiceService';
import { useGuidance } from '../../contexts/GuidanceContext';

export const OSCARPanel: React.FC = () => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(oscarVoiceService.getVoiceEnabled());
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // @ts-ignore
    const { contextMsg, setContextMsg } = useGuidance();

    const [history, setHistory] = useState<ChatMessage[]>([
        {
            id: 'init-1',
            role: 'assistant',
            text: "OSCAR Service Desk ready. How can I assist you with WholesaleOS today?"
        }
    ]);

    useEffect(() => {
        if (contextMsg) {
            handleSubmit(contextMsg);
            setContextMsg(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextMsg]);

    useEffect(() => {
        // Sync visual audio playing state with the service
        oscarVoiceService.setPlayStateCallback(setIsAudioPlaying);

        // Initial greeting audio if enabled
        if (isVoiceEnabled) {
            // We delay slightly so TTS doesn't clip on pure mount
            setTimeout(() => {
                oscarVoiceService.speak("OSCAR Service Desk ready. How can I assist you?");
            }, 500);
        }
    }, [isVoiceEnabled]);

    const toggleVoice = () => {
        const newState = !isVoiceEnabled;
        setIsVoiceEnabled(newState);
        oscarVoiceService.setVoiceEnabled(newState);
    };

    const handleReplay = () => {
        oscarVoiceService.replayLast();
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
            // 3. Route through OSCAR Command Layer
            const response = await routeOSCARCommand(text);

            // 4. Update History and Speak
            setHistory(prev => prev.map(msg =>
                msg.id === tempId ? { ...msg, text: response.text, isTyping: false } : msg
            ));

            oscarVoiceService.speak(response.text);

            // 5. Execute UI Navigation or Data Dispatching if the Action Executor returned a Target
            if (response.isCommand && response.actionResult) {
                if (response.actionResult.data) {
                    window.dispatchEvent(new CustomEvent('oscar:data-ready', {
                        detail: response.actionResult.data
                    }));
                }

                if (response.actionResult.navigationTarget) {
                    // Short delay so the user can read/hear OSCAR before navigating
                    setTimeout(() => {
                        navigate(response.actionResult!.navigationTarget!);
                    }, 1500);
                }
            }

        } catch (error) {
            setHistory(prev => prev.map(msg =>
                msg.id === tempId ? { ...msg, text: "Error: Failed to process request.", isTyping: false } : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`fixed right-3 top-3 bottom-3 transition-all duration-300 z-50 glass-card flex flex-col ${isExpanded ? 'w-[360px]' : 'w-16'}`}>
            <OSCARHeader
                isExpanded={isExpanded}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <div className="flex flex-col flex-1 overflow-hidden h-full bg-black/80">

                    {/* Voice Controls Bar */}
                    <div className="bg-[#050816]/80 px-3 py-1.5 flex justify-between items-center border-b border-blue-900/40">
                        <button
                            onClick={handleReplay}
                            className="text-gray-400 hover:text-blue-400 transition flex items-center gap-1 text-[10px] font-mono tracking-wider"
                        >
                            <RotateCcw size={12} /> REPLAY
                        </button>

                        <button
                            onClick={toggleVoice}
                            className={`px-2 py-0.5 text-[10px] font-mono rounded flex items-center gap-1 transition ${isVoiceEnabled ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 border border-transparent hover:text-gray-300'}`}
                        >
                            {isVoiceEnabled ? <><Volume2 size={12} /> ON</> : <><VolumeX size={12} /> MUTED</>}
                        </button>
                    </div>

                    <OSCARChatHistory
                        history={history}
                        isAudioPlaying={isAudioPlaying}
                    />

                    <OSCARInput
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                    />
                </div>
            )}
        </div>
    );
};
