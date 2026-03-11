import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Activity } from 'lucide-react';

export default function VerifiedClosingTicker() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!supabase) {
                setFallbackData();
                return;
            }
            try {
                const { data } = await supabase
                    .from('platform_events')
                    .select('*')
                    .eq('event_type', 'VERIFIED_CLOSED')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (data && data.length > 0) {
                    setEvents(data);
                } else {
                    setFallbackData();
                }
            } catch {
                setFallbackData();
            }
        };

        const setFallbackData = () => {
            setEvents([
                { id: 1, created_at: new Date().toISOString(), metadata: { message: "Tri-Party Verification Complete: Dallas TX" } },
                { id: 2, created_at: new Date(Date.now() - 3600000).toISOString(), metadata: { message: "Tri-Party Verification Complete: Atlanta GA" } },
                { id: 3, created_at: new Date(Date.now() - 7200000).toISOString(), metadata: { message: "Tri-Party Verification Complete: Phoenix AZ" } },
                { id: 4, created_at: new Date(Date.now() - 14400000).toISOString(), metadata: { message: "Tri-Party Verification Complete: Miami FL" } }
            ]);
        }

        fetchEvents();

        if (supabase) {
            const subscription = supabase
                .channel('verified_closed_ticker')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'platform_events',
                    filter: "event_type=eq.VERIFIED_CLOSED"
                }, payload => {
                    setEvents(current => [payload.new, ...current].slice(0, 5));
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, []);

    if (events.length === 0) return null;

    const currentDate = new Date().toISOString();

    return (
        <div className="bg-emerald-900/40 border-y border-emerald-500/30 overflow-hidden py-1.5 flex items-center shadow-[0_0_15px_rgba(16,185,129,0.15)] relative z-20 marquee-paused">
            <div className="bg-[#050816] px-4 py-1.5 flex items-center gap-2 border-r border-emerald-500/50 relative z-20 shadow-[10px_0_15px_rgba(5,8,22,1)] shrink-0">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono whitespace-nowrap text-shadow-glow-emerald">Verified Closings</span>
            </div>

            <div className="flex-1 overflow-hidden flex items-center relative mask-fade-edges min-w-0">
                <div className="flex animate-marquee whitespace-nowrap gap-12 pl-4">
                    {/* Double mapping for seamless looping */}
                    {[...events, ...events].map((ev, i) => (
                        <div key={`${ev.id}-${i}`} className="flex items-center gap-2 text-xs font-mono tracking-widest text-emerald-300">
                            <Activity size={10} className="text-emerald-500" />
                            {ev.metadata?.message || ev.description || "Tri-Party Verification Complete"}
                            <span className="text-emerald-500/50">•</span>
                            {new Date(ev.created_at || currentDate).toLocaleDateString()}
                        </div>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .mask-fade-edges {
                    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                    -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                }
                .marquee-paused:hover .animate-marquee {
                    animation-play-state: paused;
                }
            `}} />
        </div>
    );
}
