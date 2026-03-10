import React, { useState } from 'react';
import { AssistantHeader } from './AssistantHeader';
import { AssistantFeed } from './AssistantFeed';
import { AssistantControls } from './AssistantControls';

export const AssistantPanel: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    /* 
     * In a full Bloomberg terminal, the user might completely hide the panel,
     * but for the WholesaleOS implementation we want the audio controls always accessible
     * when the workstation is active, so we rely on minimize/maximize.
     */

    return (
        <div className="fixed bottom-6 right-6 w-80 lg:w-96 rounded-lg overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.8)] border border-gray-800 z-50 transition-all duration-300 transform bg-black flex flex-col">
            <AssistantHeader
                isExpanded={isExpanded}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
                onClose={() => { }}
            />

            {isExpanded && (
                <>
                    <AssistantFeed />
                    <AssistantControls />
                </>
            )}
        </div>
    );
};
