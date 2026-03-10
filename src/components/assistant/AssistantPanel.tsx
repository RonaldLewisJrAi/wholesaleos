import React, { useState } from 'react';
import { AssistantHeader } from './AssistantHeader';
import { AssistantFeed } from './AssistantFeed';
import { AssistantControls } from './AssistantControls';

export const AssistantPanel: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className={`fixed right-3 top-3 bottom-3 transition-all duration-300 z-50 glass-panel flex flex-col ${isExpanded ? 'w-[340px]' : 'w-16'}`}>
            <AssistantHeader
                isExpanded={isExpanded}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
                onClose={() => { }}
            />

            {isExpanded && (
                <div className="flex flex-col flex-1 overflow-hidden h-full">
                    {/* Bloomberg Terminal Console Styling Wrapper */}
                    <div className="flex-1 bg-black/80 border-y border-vision-slate/30 overflow-hidden">
                        <AssistantFeed />
                    </div>
                    <div className="p-3 bg-black/60 rounded-b-[20px]">
                        <AssistantControls />
                    </div>
                </div>
            )}
        </div>
    );
};

