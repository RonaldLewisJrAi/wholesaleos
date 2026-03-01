import React from 'react';
import HolographicPanel from './HolographicPanel';

/**
 * InsightOverlay
 * A passive, non-blocking floating panel used in 'insight' guidance mode.
 * Absolutely positioned relative to its parent container.
 * 
 * @param {string} title - Short heading
 * @param {string} description - 1-2 sentence micro-explanation
 * @param {string} position - 'top-right', 'top-left', 'bottom-right', 'bottom-left' (default 'top-right')
 */
const InsightOverlay = ({ title, description, position = 'top-right' }) => {

    const getPositionClasses = () => {
        switch (position) {
            case 'top-left': return 'top-[-10px] left-[-10px]';
            case 'bottom-right': return 'bottom-[-10px] right-[-10px]';
            case 'bottom-left': return 'bottom-[-10px] left-[-10px]';
            case 'top-right':
            default: return 'top-[-10px] right-[-10px]';
        }
    };

    return (
        <div className={`absolute z-50 pointer-events-none max-w-xs ${getPositionClasses()}`}>
            <HolographicPanel className="text-sm border-l-4 border-l-primary shadow-2xl">
                <h4 className="font-bold uppercase tracking-wider text-xs mb-1 opacity-90 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                    {title}
                </h4>
                <p className="opacity-80 text-xs leading-relaxed">
                    {description}
                </p>
            </HolographicPanel>
        </div>
    );
};

export default InsightOverlay;
