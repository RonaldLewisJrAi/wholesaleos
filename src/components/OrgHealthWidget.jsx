import React, { useState } from 'react';
import { Activity, Shield, Webhook, Zap, ChevronUp } from 'lucide-react';

const OrgHealthWidget = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Mock data for Phase 31
    const healthData = {
        tier: 'SUPER',
        activeIntegrations: 3,
        failedWebhooks: 0,
        apiUsage: '4%',
        activeScrapers: 2,
        mrr: '$42,500',
        seatsUsed: 8,
        seatsTotal: 10
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div
                className={`glass-panel border-primary/30 shadow-[0_4px_20px_rgba(99,102,241,0.2)] transition-all duration-300 ${isExpanded ? 'w-80' : 'w-auto'}`}
            >
                {/* Header / Minimized View */}
                <div
                    className="p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="relative">
                        <Activity size={20} className="text-primary animate-pulse" />
                        {healthData.failedWebhooks > 0 && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-danger rounded-full animate-ping"></div>
                        )}
                    </div>

                    {!isExpanded ? (
                        <div className="text-xs font-bold tracking-widest text-primary flex items-center gap-2">
                            ORG HEALTH <ChevronUp size={14} className="opacity-50" />
                        </div>
                    ) : (
                        <div className="flex-1 flex justify-between items-center">
                            <span className="text-xs font-bold tracking-widest text-primary">ORG HEALTH</span>
                            <span className="badge tier-super text-[9px] px-1 py-0">{healthData.tier}</span>
                        </div>
                    )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="p-4 border-t border-[var(--border-light)] bg-[var(--bg-tertiary)] animate-fade-in">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-[var(--surface-dark)] p-2 rounded border border-[var(--border-light)]">
                                <div className="text-[10px] text-muted flex items-center gap-1"><Zap size={10} className="text-warning" /> Integrations</div>
                                <div className="text-lg font-bold">{healthData.activeIntegrations} <span className="text-xs text-muted font-normal">Active</span></div>
                            </div>
                            <div className="bg-[var(--surface-dark)] p-2 rounded border border-[var(--border-light)]">
                                <div className="text-[10px] text-muted flex items-center gap-1"><Webhook size={10} className={healthData.failedWebhooks > 0 ? 'text-danger' : 'text-success'} /> Webhooks</div>
                                <div className="text-lg font-bold">{healthData.failedWebhooks} <span className="text-xs text-muted font-normal">Errors</span></div>
                            </div>
                            <div className="bg-[var(--surface-dark)] p-2 rounded border border-[var(--border-light)]">
                                <div className="text-[10px] text-muted flex items-center gap-1"><Shield size={10} className="text-primary" /> API Usage</div>
                                <div className="text-lg font-bold">{healthData.apiUsage} <span className="text-xs text-muted font-normal">Quota</span></div>
                            </div>
                            <div className="bg-[var(--surface-dark)] p-2 rounded border border-[var(--border-light)]">
                                <div className="text-[10px] text-muted">Team Seats</div>
                                <div className="text-lg font-bold">{healthData.seatsUsed}/{healthData.seatsTotal}</div>
                            </div>
                        </div>

                        <div className="w-full bg-[var(--surface-dark)] rounded h-1.5 overflow-hidden border border-[var(--border-light)] mb-1">
                            <div className="bg-primary h-full" style={{ width: `${(healthData.seatsUsed / healthData.seatsTotal) * 100}%` }}></div>
                        </div>
                        <div className="text-[9px] text-right text-muted mb-4">Seat Utilization ({healthData.seatsUsed}/{healthData.seatsTotal})</div>

                        <button className="btn btn-secondary w-full text-xs py-1.5">Manage Constraints</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrgHealthWidget;
