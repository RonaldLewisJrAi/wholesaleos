import React from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useAudioGuidance } from '../../hooks/useAudioGuidance';
import { voiceAssistant } from '../../services/voiceAssistantService';

export const AssistantControls: React.FC = () => {
    const { enabled, toggle } = useAudioGuidance();

    const handleReplay = () => {
        if (!enabled) {
            // Force temporary override if they explicitly click replay
            const text = voiceAssistant.getLastMessage();
            if (text) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 0.9;
                utterance.volume = 1.0;
                utterance.lang = "en-US";
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utterance);
            }
        } else {
            voiceAssistant.replayLast();
        }
    };

    return (
        <div className="bg-[#0d1117] p-2 flex justify-between items-center bg-opacity-90">
            <div className="flex gap-2">
                <button
                    onClick={handleReplay}
                    className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition flex items-center gap-1 text-[10px] font-mono tracking-wider"
                >
                    <RotateCcw size={12} /> REPLAY
                </button>
            </div>

            <div className="flex items-center gap-2 border border-gray-700 rounded p-1 bg-black">
                <button
                    onClick={() => { if (!enabled) toggle(); }}
                    className={`px-2 py-1 text-[10px] font-mono font-bold rounded flex items-center gap-1 transition ${enabled ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Volume2 size={12} /> ON
                </button>
                <button
                    onClick={() => { if (enabled) { toggle(); voiceAssistant.stop(); } }}
                    className={`px-2 py-1 text-[10px] font-mono font-bold rounded flex items-center gap-1 transition ${!enabled ? 'bg-red-600/80 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <VolumeX size={12} /> MUTED
                </button>
            </div>
        </div>
    );
};
