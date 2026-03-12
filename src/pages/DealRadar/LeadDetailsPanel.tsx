import React from 'react';
import { X, FileText, Zap, ChevronRight, Hash, Calendar, AlertOctagon } from 'lucide-react';

export const LeadDetailsPanel = ({ lead, onClose, onConvert }: { lead: any, onClose: any, onConvert: any }) => {
    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-[500px] h-full bg-[var(--bg-primary)] shadow-2xl border-l border-blue-900/50 flex flex-col slide-in-right transform">
                {/* Header */}
                <div className="p-6 border-b border-blue-900/30 flex justify-between items-start bg-[var(--bg-secondary)]">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-mono border border-red-500/20 flex items-center gap-2">
                                <AlertOctagon size={14} />
                                {lead.notice_type}
                            </span>
                            <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                Score: {lead.deal_score}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-white">{lead.address}</h2>
                        <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                            {lead.city}, {lead.county} County
                        </p>
                    </div>
                    <button title="Close" onClick={onClose} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 flex-1 overflow-y-auto space-y-6">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-gray-800/50">
                            <div className="text-gray-500 text-xs uppercase tracking-widest font-mono mb-1 flex items-center gap-1">
                                <Hash size={12} /> Parcel ID
                            </div>
                            <div className="text-white font-mono text-sm">{lead.parcel_id}</div>
                        </div>
                        <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-gray-800/50">
                            <div className="text-gray-500 text-xs uppercase tracking-widest font-mono mb-1 flex items-center gap-1">
                                <FileText size={12} /> Case Number
                            </div>
                            <div className="text-white font-mono text-sm">{lead.case_number || 'N/A'}</div>
                        </div>
                        <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-gray-800/50 col-span-2">
                            <div className="text-gray-500 text-xs uppercase tracking-widest font-mono mb-1 flex items-center gap-1">
                                <Calendar size={12} /> Auction / Sale Date
                            </div>
                            <div className="text-red-400 font-mono text-lg font-bold">
                                {new Date(lead.auction_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    <div className="border border-blue-900/30 rounded-xl overflow-hidden">
                        <div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-blue-900/30 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-300 font-mono">Source Document</h3>
                            <button className="text-blue-400 text-xs hover:text-blue-300 flex items-center gap-1">
                                Inspect Image <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="p-4 bg-[#0a0f1c]">
                            <p className="font-mono text-xs text-blue-500 mb-2">EXTRACTED OCR TEXT:</p>
                            <div className="text-gray-400 font-mono text-xs leading-relaxed max-h-48 overflow-y-auto w-full p-2 bg-black/50 rounded border border-gray-800">
                                {lead.source_doc || "No raw OCR text cached for this lead."}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-[var(--bg-secondary)] border-t border-blue-900/30">
                    <button
                        onClick={onConvert}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                    >
                        <Zap size={20} />
                        Convert to Deal File
                    </button>
                    <p className="text-center text-gray-500 text-xs mt-4">
                        This action will move the lead from the Foreclosure Radar into your primary active Deal Pipeline and run full comps.
                    </p>
                </div>
            </div>
        </div>
    );
};
