import React, { useState, useEffect } from 'react';
import { Target, Activity, Map, Zap, Users, Radar, History, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/useAuth';

const InvestorDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        // Fetch live platform events for Deal Radar
        const fetchEvents = async () => {
            if (supabase) {
                try {
                    const { data, error } = await supabase
                        .from('platform_events')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(8);

                    if (data && data.length > 0) {
                        setEvents(data);
                    } else {
                        setFallbackEvents();
                    }
                } catch (e) {
                    setFallbackEvents();
                }
            } else {
                setFallbackEvents();
            }
            setLoading(false);
        };

        const setFallbackEvents = () => {
            setEvents([
                { id: 1, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), description: "New Deal Posted — Atlanta", event_type: "DEAL_PUBLISHED" },
                { id: 2, created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(), description: "Liquidity Spike — Dallas", event_type: "MARKET_SIGNAL" },
                { id: 3, created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(), description: "Deal Under Contract — Miami", event_type: "ESCROW_STARTED" },
                { id: 4, created_at: new Date(Date.now() - 1000 * 60 * 47).toISOString(), description: "Buyer Offer Submitted — Tampa", event_type: "OFFER_MADE" }
            ]);
        };

        fetchEvents();

        // Optional: Subscription to real-time events if supported
        if (supabase) {
            const subscription = supabase
                .channel('platform_events_changes')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'platform_events' }, payload => {
                    setEvents(current => [payload.new, ...current].slice(0, 8));
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, []);

    const ModuleWrapper = ({ title, icon: Icon, children, className = "" }) => (
        <div className={`glass-card p-6 flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(78,123,255,0.2)] ${className}`}>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-blue-900/30 pb-3">
                <Icon size={16} className="text-blue-400" /> {title}
            </h3>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-fade-in pb-12">
            <div className="mb-8 border-b border-blue-900/40 pb-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                    <Target className="text-blue-500" size={32} />
                    Intelligence Terminal
                </h1>
                <p className="text-gray-400 font-mono tracking-widest uppercase text-xs mt-2">
                    Live Market Signals & Deal Flow Analytics
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">

                {/* Module 1: Market Liquidity Index */}
                <ModuleWrapper title="Market Liquidity Index" icon={Activity}>
                    <div className="flex flex-col gap-6">
                        <div>
                            <div className="flex justify-between items-end mb-2 font-mono">
                                <span className="text-xs text-gray-400 uppercase tracking-widest">Global Liquidity</span>
                                <span className="text-emerald-400 font-bold text-lg">82%</span>
                            </div>
                            {/* Terminal Progress Bar style */}
                            <div className="text-emerald-500 font-mono text-sm tracking-widest break-all leading-none opacity-80">
                                ████████████████████████████░░░░░░
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-blue-900/30 pt-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Active Inv</span>
                                <span className="text-blue-400 font-mono font-bold text-xl">147</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Platform Deals</span>
                                <span className="text-emerald-400 font-mono font-bold text-xl">23</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">In Escrow</span>
                                <span className="text-amber-400 font-mono font-bold text-xl">11</span>
                            </div>
                        </div>
                    </div>
                </ModuleWrapper>

                {/* Module 2: Deal Flow Heat Map */}
                <ModuleWrapper title="Deal Flow Heat Map" icon={Map}>
                    <div className="flex flex-col h-full justify-between">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-blue-900/10 border border-blue-500/20 p-2.5 rounded">
                                <span className="text-white font-mono text-sm">Dallas, TX</span>
                                <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-900/20 px-2 py-0.5 rounded flex items-center gap-1"><TrendingUp size={12} /> 12 Deals</span>
                            </div>
                            <div className="flex justify-between items-center bg-blue-900/10 border border-blue-500/20 p-2.5 rounded">
                                <span className="text-white font-mono text-sm">Atlanta, GA</span>
                                <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-900/20 px-2 py-0.5 rounded flex items-center gap-1"><TrendingUp size={12} /> 9 Deals</span>
                            </div>
                            <div className="flex justify-between items-center bg-blue-900/10 border border-blue-500/20 p-2.5 rounded">
                                <span className="text-white font-mono text-sm">Phoenix, AZ</span>
                                <span className="text-blue-400 font-mono font-bold text-sm bg-blue-900/20 px-2 py-0.5 rounded flex items-center gap-1"><TrendingUp size={12} /> 7 Deals</span>
                            </div>
                            <div className="flex justify-between items-center bg-blue-900/10 border border-blue-500/20 p-2.5 rounded">
                                <span className="text-white font-mono text-sm">Tampa, FL</span>
                                <span className="text-blue-400 font-mono font-bold text-sm bg-blue-900/20 px-2 py-0.5 rounded flex items-center gap-1"><TrendingUp size={12} /> 6 Deals</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-blue-900/30">
                            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Map Visualization Layer Offline</span>
                        </div>
                    </div>
                </ModuleWrapper>

                {/* Module 3: Top Deals Today */}
                <ModuleWrapper title="Top Deals Today" icon={Zap}>
                    <div className="flex flex-col gap-3">
                        <div className="bg-[#050816]/60 border border-blue-900/50 p-4 rounded-lg hover:border-blue-500/40 transition-colors cursor-pointer group/deal">
                            <div className="flex justify-between items-start mb-3 border-b border-blue-900/30 pb-2">
                                <span className="text-sm font-bold text-white tracking-wide">123 Oak St • Dallas</span>
                                <span className="text-[10px] font-mono font-bold bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-widest">Matched</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                                <div>
                                    <span className="text-[9px] text-gray-500 uppercase block mb-1">Score</span>
                                    <span className="text-blue-400 font-bold text-sm">92</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-500 uppercase block mb-1">Proj. Fee</span>
                                    <span className="text-emerald-400 font-bold text-sm">$24k</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-500 uppercase block mb-1">Liquidity</span>
                                    <span className="text-emerald-400 font-bold text-sm">HIGH</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#050816]/60 border border-blue-900/50 p-4 rounded-lg hover:border-blue-500/40 transition-colors cursor-pointer group/deal">
                            <div className="flex justify-between items-start mb-3 border-b border-blue-900/30 pb-2">
                                <span className="text-sm font-bold text-white tracking-wide">789 Pine Ln • Atlanta</span>
                                <span className="text-[10px] font-mono font-bold bg-amber-900/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded uppercase tracking-widest">Pending</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                                <div>
                                    <span className="text-[9px] text-gray-500 uppercase block mb-1">Score</span>
                                    <span className="text-blue-400 font-bold text-sm">88</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-500 uppercase block mb-1">Proj. Fee</span>
                                    <span className="text-emerald-400 font-bold text-sm">$18k</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-500 uppercase block mb-1">Liquidity</span>
                                    <span className="text-blue-400 font-bold text-sm">MED</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModuleWrapper>

                {/* Module 4: Investor Demand Signals */}
                <ModuleWrapper title="Investor Demand Signals" icon={Users}>
                    <div className="grid grid-rows-3 gap-0 h-full">
                        <div className="flex justify-between items-center border-b border-blue-900/30 py-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">Buyer Requests Today</span>
                                <span className="text-sm text-white font-mono mt-1">Total inquiries across active deals</span>
                            </div>
                            <span className="text-2xl font-mono font-bold text-blue-400 flex items-center gap-2">
                                31 <ArrowUpRight size={16} className="text-emerald-500" />
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-blue-900/30 py-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">VIP Investor Activity</span>
                                <span className="text-sm text-white font-mono mt-1">Engagement from top-tier buyers</span>
                            </div>
                            <span className="text-xl font-mono font-bold text-emerald-400 bg-emerald-900/20 px-3 py-1 border border-emerald-500/30 rounded">
                                HIGH
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">Average Close Speed</span>
                                <span className="text-sm text-white font-mono mt-1">Platform-wide assigned to cleared</span>
                            </div>
                            <span className="text-xl font-mono font-bold text-amber-400 flex items-center gap-2">
                                18 Days <ArrowDownRight size={16} className="text-emerald-500" />
                            </span>
                        </div>
                    </div>
                </ModuleWrapper>

                {/* Module 5: Deal Radar (Live Feed) */}
                <ModuleWrapper title="Deal Radar" icon={Radar}>
                    <div className="relative pl-6 flex flex-col gap-5 pt-2">
                        <div className="absolute top-2 bottom-2 left-[5px] w-[1px] bg-blue-900/40"></div>
                        {loading && events.length === 0 ? (
                            <div className="text-center text-blue-500 font-mono text-sm tracking-widest py-8">SCANNING FREQUENCIES...</div>
                        ) : (
                            events.slice(0, 5).map((ev, i) => (
                                <div key={ev.id || i} className="relative z-10 group/radar">
                                    <div className={`absolute -left-[25px] top-1.5 w-2 h-2 rounded-full border border-[#050816] ${i === 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'}`}></div>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <p className={`text-sm font-mono tracking-wide ${i === 0 ? 'text-white font-bold' : 'text-gray-300'}`}>{ev.description}</p>
                                        </div>
                                        <span className={`text-[10px] font-mono tracking-widest ${i === 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                                            {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ModuleWrapper>

                {/* Module 6: Closing Activity */}
                <ModuleWrapper title="Closing Activity" icon={History}>
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center bg-emerald-900/10 border border-emerald-500/20 p-3 rounded hover:bg-emerald-900/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <History size={16} className="text-emerald-400" />
                                <span className="text-white font-mono text-sm tracking-wide">Houston, TX</span>
                            </div>
                            <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">$18k Assignment</span>
                        </div>
                        <div className="flex justify-between items-center bg-emerald-900/10 border border-emerald-500/20 p-3 rounded hover:bg-emerald-900/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <History size={16} className="text-emerald-400" />
                                <span className="text-white font-mono text-sm tracking-wide">Phoenix, AZ</span>
                            </div>
                            <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">$22k Assignment</span>
                        </div>
                        <div className="flex justify-between items-center bg-emerald-900/10 border border-emerald-500/20 p-3 rounded hover:bg-emerald-900/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <History size={16} className="text-emerald-400" />
                                <span className="text-white font-mono text-sm tracking-wide">Atlanta, GA</span>
                            </div>
                            <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">$15k Assignment</span>
                        </div>
                        <div className="mt-2 text-center">
                            <button className="text-[10px] text-gray-500 font-mono uppercase tracking-widest hover:text-blue-400 transition-colors">View All Closing History</button>
                        </div>
                    </div>
                </ModuleWrapper>

            </div>
        </div>
    );
};

export default InvestorDashboard;
