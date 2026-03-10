import React, { useEffect, useState, useRef } from 'react';
import { voiceAssistant } from '../../services/voiceAssistantService';

interface Message {
    role: 'user' | 'assistant';
    text: string;
}

export const AssistantFeed: React.FC = () => {
    const [history, setHistory] = useState<Message[]>([
        { role: 'assistant', text: "Wholesale OS Terminal Ready. Type 'help' for commands." }
    ]);
    const [input, setInput] = useState("");
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        voiceAssistant.setPlayStateCallback((state) => setIsPlaying(state));
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isPlaying]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input.trim();
        const newHistory: Message[] = [...history, { role: 'user', text: userText }];
        setInput("");

        // Simple Command Parser Workaround
        let response = "";
        const lowerInput = userText.toLowerCase();

        if (lowerInput.includes('help')) {
            response = "Available commands: analyze [address], comps, status, nav [page].";
        } else if (lowerInput.includes('analyze')) {
            response = "Analyzing property data... This property shows a 15% estimated ROI based on recent market comps. Strong indicator for wholesale assignment.";
        } else if (lowerInput.includes('comps')) {
            response = "Pulling comps... 3 recent cash sales found within a 1 mile radius averaging $250,000. DOM is 14 days.";
        } else if (lowerInput.includes('nav') || lowerInput.includes('go to')) {
            response = "Navigation routing is currently disabled in this terminal session. Please use the visual sidebar.";
        } else if (lowerInput.includes('status')) {
            response = "All systems operational. Database connected. Deal pipelines active.";
        } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
            response = "Hello. I am the Wholesale OS Intelligence Terminal. How can I assist your workflow today?";
        } else {
            response = `Command unrecognized: "${userText}". I am an early beta release. Type 'help' for available commands.`;
        }

        newHistory.push({ role: 'assistant', text: response });
        setHistory(newHistory);
        voiceAssistant.speak(response);
    };

    return (
        <div className="p-2 h-full font-mono flex flex-col justify-between relative overflow-hidden text-sm">
            <div className="flex-1 overflow-y-auto pb-4 space-y-3 pr-2 scroll-smooth">
                {history.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'text-green-400' : 'text-gray-300'}`}>
                        <span className={`font-bold mt-0.5 ${msg.role === 'user' ? 'text-green-500' : 'text-blue-500'}`}>
                            {msg.role === 'user' ? '>' : '$'}
                        </span>
                        <p className={`tracking-wide leading-relaxed ${isPlaying && i === history.length - 1 ? 'text-white' : ''}`}>
                            {msg.text}
                            {isPlaying && i === history.length - 1 && msg.role === 'assistant' && (
                                <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse" />
                            )}
                        </p>
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-gray-800 mt-2">
                <span className="text-blue-500 font-bold">{'>'}</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter command..."
                    className="bg-transparent flex-1 outline-none tracking-wide text-white placeholder-gray-700"
                    autoComplete="off"
                />
            </form>
        </div>
    );
};
