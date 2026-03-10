import React, { useState, useEffect, useRef } from 'react';
import { Bot, Terminal as TerminalIcon, Sparkles } from 'lucide-react';

export const OSARHeader: React.FC<{ isExpanded: boolean; onToggleExpand: () => void }> = ({
    isExpanded,
    onToggleExpand
}) => {
    return (
        <div
            className={`flex items-center justify-between p-3 border-b border-emerald-900/30 bg-black/80 rounded-t-[20px] cursor-pointer transition-colors ${!isExpanded ? 'h-full flex-col justify-start py-6' : ''}`}
            onClick={onToggleExpand}
        >
            <div className={`flex items-center gap-3 ${!isExpanded ? 'flex-col' : ''}`}>
                <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-emerald-900/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Bot size={18} />
                    </div>
                    {/* Activity dot */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-pulse"></div>
                </div>

                {isExpanded && (
                    <div>
                        <h3 className="text-white font-medium text-sm flex items-center gap-1">
                            OSAR <Sparkles size={12} className="text-emerald-400" />
                        </h3>
                        <p className="text-emerald-500/70 text-[10px] uppercase tracking-wider font-mono">Service Terminal</p>
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className="flex gap-2">
                    <button className="text-gray-500 hover:text-white transition" title="OSAR Interface Active">
                        <TerminalIcon size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};
