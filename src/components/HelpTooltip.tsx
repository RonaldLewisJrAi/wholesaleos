import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
    topic: string;
    description: string;
    position?: 'top' | 'right' | 'bottom' | 'left';
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
    topic,
    description,
    position = 'top'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Close on outside click for mobile
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setIsVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const positionStyles = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div
            className="relative inline-flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            ref={tooltipRef}
        >
            <button
                className="text-slate-400 hover:text-indigo-400 transition-colors ml-1.5 focus:outline-none focus:text-indigo-400"
                onClick={() => setIsVisible(!isVisible)}
                aria-label={`Help about ${topic}`}
            >
                <HelpCircle size={14} />
            </button>

            {isVisible && (
                <div
                    className={`absolute z-50 w-64 p-3 bg-slate-800 border border-slate-700 shadow-xl rounded-lg text-sm transition-opacity duration-200 ${positionStyles[position]}`}
                >
                    <div className="font-bold text-white mb-1 tracking-tight">{topic}</div>
                    <div className="text-slate-300 leading-relaxed text-xs">
                        {description}
                    </div>
                    {/* Triangle pointer */}
                    <div className="absolute w-2 h-2 bg-slate-800 border-r border-b border-slate-700 transform rotate-45 hidden" />
                </div>
            )}
        </div>
    );
};
