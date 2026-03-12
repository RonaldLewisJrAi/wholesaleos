import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

interface OSCARInputProps {
    onSubmit: (text: string) => void;
    isLoading: boolean;
}

export const OSCARInput: React.FC<OSCARInputProps> = ({ onSubmit, isLoading }) => {
    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Web Speech API if supported
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                setIsListening(false);
                // Optionally auto-submit voice commands:
                // onSubmit(transcript); 
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech Recognition Error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Voice recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setInputValue(''); // clear previous before listening
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error("Already started", err);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        onSubmit(inputValue.trim());
        setInputValue('');
    };

    return (
        <form onSubmit={handleSubmit} className="p-3 bg-[var(--bg-tertiary)] rounded-b-[16px] flex items-center gap-2 border-t border-blue-900/30">
            <span className="text-blue-500 font-mono font-bold">{'>'}</span>

            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type a command..."}
                className="flex-1 bg-transparent text-sm font-mono text-white placeholder-gray-600 outline-none"
                disabled={isLoading}
                autoComplete="off"
            />

            <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded transition ${isListening ? 'text-red-400 bg-red-400/10' : 'text-gray-500 hover:text-blue-400 hover:bg-blue-400/10'}`}
                title="Voice Input"
            >
                {isListening ? <Mic size={16} className="animate-pulse" /> : <MicOff size={16} />}
            </button>

            <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-1.5 rounded text-blue-500 hover:bg-blue-500/10 transition disabled:opacity-50 disabled:hover:bg-transparent"
                title="Send Message"
            >
                <Send size={16} />
            </button>
        </form>
    );
};
