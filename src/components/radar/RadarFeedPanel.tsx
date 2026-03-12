import React, { useEffect, useState } from 'react';
import { dealRadarService, RadarEvent, RadarSignalType } from '../../services/dealRadarService';
import { Activity, Zap, TrendingUp, CheckCircle, Target, DollarSign, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SignalIcon = ({ type }: { type: RadarSignalType }) => {
    switch (type) {
        case 'VERIFIED_CLOSED': return <CheckCircle size={16} className="text-emerald-400" />;
        case 'PRIORITY_DEAL_BLAST': return <Zap size={16} className="text-warning text-[var(--warning-color)]" />;
        case 'INVESTOR_MATCH': return <Target size={16} className="text-blue-400" />;
        case 'INVESTOR_ACTIVITY_SPIKE': return <TrendingUp size={16} className="text-amber-400" />;
        case 'DEAL_RESERVED': return <Clock size={16} className="text-purple-400" />;
        case 'ESCROW_CONFIRMED': return <DollarSign size={16} className="text-emerald-300" />;
        case 'DEAL_POSTED':
        default: return <Activity size={16} className="text-gray-400" />;
    }
};

const formatSignalText = (ev: RadarEvent) => {
    const city = ev.event_data?.city || 'Unknown';
    switch (ev.event_type) {
        case 'VERIFIED_CLOSED': return `Verified Closing — ${city}`;
        case 'PRIORITY_DEAL_BLAST': return `Priority Blast — ${city}`;
        case 'INVESTOR_MATCH': return `New Investor Match — ${city}`;
        case 'INVESTOR_ACTIVITY_SPIKE': return `Demand Spike — ${city}`;
        case 'DEAL_RESERVED': return `Deal Reserved — ${city}`;
        case 'ESCROW_CONFIRMED': return `Escrow Funded — ${city}`;
        case 'DEAL_POSTED': return `New Deal Posted — ${city}`;
        default: return `System Event — ${city}`;
    }
};

export const RadarFeedPanel = () => {
    const [events, setEvents] = useState<RadarEvent[]>([]);

    useEffect(() => {
        const sub = dealRadarService.subscribeToRadar((newEvents) => {
            setEvents(newEvents);
        });
        return () => sub.unsubscribe();
    }, []);

    return (
        <div className="glass-panel border-blue-900/40 bg-[var(--bg-secondary)] h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-blue-900/30 flex items-center justify-between shadow-md">
                <h3 className="font-bold font-mono tracking-widest text-sm flex items-center gap-2">
                    <Activity size={16} className="text-blue-500 animate-pulse" /> Live Terminal Feed
                </h3>
                <span className="text-[10px] bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 font-mono">
                    {events.length} SIGNALS
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
                {events.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500 font-mono tracking-widest">
                        Awaiting Signals...
                    </div>
                ) : (
                    events.map((ev, index) => (
                        <div
                            key={ev.id || index}
                            className="bg-[var(--bg-tertiary)] border border-blue-900/30 p-3 rounded-lg flex gap-3 text-sm animate-fade-in hover:border-blue-500/40 transition-colors shadow-sm"
                        >
                            <div className="mt-0.5"><SignalIcon type={ev.event_type} /></div>
                            <div className="flex-1 min-w-0">
                                <div className="text-white font-bold tracking-wide truncate">
                                    {formatSignalText(ev)}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono mt-1 flex items-center justify-between">
                                    <span>{ev.created_at ? formatDistanceToNow(new Date(ev.created_at), { addSuffix: true }) : 'Just now'}</span>
                                    {ev.event_data?.assignment_fee && (
                                        <span className="text-emerald-400 font-bold bg-emerald-900/20 px-1.5 rounded">
                                            ${ev.event_data.assignment_fee.toLocaleString()} Fee
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Terminal gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent pointer-events-none" />
        </div>
    );
};
