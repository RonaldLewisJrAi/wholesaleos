import React, { useState, useEffect, useRef } from 'react';
import { Bot, Terminal as TerminalIcon, Sparkles } from 'lucide-react';

export const OSCARHeader: React.FC<{ isExpanded: boolean; onToggleExpand: () => void }> = ({
    isExpanded,
    onToggleExpand
}) => {
    return (
        <div
            className={`flex items-center justify-between p-3 border-b border-blue-900/30 bg-[var(--bg-tertiary)] rounded-t-[16px] cursor-pointer transition-colors ${!isExpanded ? 'h-full flex-col justify-start py-6' : ''}`}
            onClick={onToggleExpand}
        >
            <div className={`flex items-center gap-3 ${!isExpanded ? 'flex-col' : ''}`}>
                <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-emerald-900/20 border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(25,169,116,0.3)] flex items-center justify-center text-emerald-400 relative z-10">
                        <Bot size={18} />
                    </div>
                    {/* Background Pulse Ring */}
                    <div className="absolute inset-0 rounded-full border border-emerald-400/30 animate-ping opacity-50"></div>
                    {/* Activity dot */}
                    <div className="absolute -bottom-1 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#050816] shadow-[0_0_8px_rgba(25,169,116,0.8)] z-20"></div>
                </div>

                {isExpanded && (
                    <div>
                        <h3 className="text-white font-medium text-sm flex items-center gap-1">
                            OSCAR <Sparkles size={12} className="text-blue-400" />
                        </h3>
                        <p className="text-blue-500/70 text-[10px] uppercase tracking-wider font-mono">Service Terminal</p>
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className="flex gap-2">
                    <button className="text-gray-500 hover:text-white transition" title="OSCAR Interface Active">
                        <TerminalIcon size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};
