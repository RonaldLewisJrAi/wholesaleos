import React from 'react';
import { Terminal, X, Minimize2, Maximize2 } from 'lucide-react';

interface Props {
    isExpanded: boolean;
    onToggleExpand: () => void;
    onClose: () => void;
}

export const AssistantHeader: React.FC<Props> = ({ isExpanded, onToggleExpand, onClose }) => {
    return (
        <div className="flex items-center justify-between p-2 lg:p-3 border-b border-gray-800 bg-[#0d1117] cursor-pointer" onClick={onToggleExpand}>
            <div className="flex items-center gap-2">
                <Terminal size={16} className="text-blue-500" />
                <span className="font-mono text-xs font-bold tracking-widest text-gray-300 uppercase">
                    WholesaleOS Terminal
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                >
                    {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
            </div>
        </div>
    );
};
