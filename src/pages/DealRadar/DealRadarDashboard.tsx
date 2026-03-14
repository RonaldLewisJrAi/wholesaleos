import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Radar, ShieldAlert, Navigation, Search, AlertOctagon, TrendingUp, Filter } from 'lucide-react';
import { LeadDetailsPanel } from './LeadDetailsPanel';
import { useAuth } from '../../contexts/useAuth';

export const DealRadarDashboard = () => {
    const { user } = useAuth();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [filterCounty, setFilterCounty] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLeads().finally(() => setInitialLoad(false));
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [filterCounty]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            let query = supabase!
                .from('radar_opportunities')
                .select('*')
                .order('radar_score', { ascending: false })
                .limit(100);

            if (filterCounty) {
                query = query.ilike('county', `%${filterCounty}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setLeads(data || []);
        } catch (error) {
            console.error("Error fetching radar opportunities:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConvertToDeal = async (lead: any) => {
        // Quota Check
        try {
            const res = await fetch('http://localhost:3001/api/quotas/track', { // Using absolute local proxy path for dev
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, type: 'foreclosure_conversion' })
            });
            const data = await res.json();

            if (!data.allowed) {
                alert(data.error || "Monthly Foreclosure Lead Limit Reached.");
                return;
            }
        } catch (e) {
            console.error("Quota ping failed", e);
        }

        console.log("Converting lead to deal:", lead);
        try {
            const { error } = await supabase!.from('properties').insert({
                address: lead.address,
                city: lead.city,
                state: 'TN', // Assuming TN based on demo
                zip: '',
                property_type: 'Single Family',
                status: 'Lead',
                organization_id: 'default' // Need real context hook here
            });

            if (error) throw error;

            // Optionally delete from radar_opportunities once converted
            await supabase!.from('radar_opportunities').delete().eq('id', lead.id);
            setSelectedLead(null);
            fetchLeads();

            alert("Lead transferred to your CRM Pipeline.");

        } catch (e) {
            console.error("Conversion failed:", e);
            alert("Failed to convert lead.");
        }
    };

    if (initialLoad) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Scanning Deal Radar Frequencies...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                        <Radar className="text-blue-500" size={32} />
                        Deal Radar
                    </h1>
                    <p className="text-gray-400 mt-2 font-mono text-sm tracking-wide">
                        Foreclosure Intelligence Engine
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by County..."
                            value={filterCounty}
                            onChange={(e) => setFilterCounty(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-blue-900/50 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono text-sm w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="glass-panel border-blue-900/30 overflow-hidden rounded-xl shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--bg-tertiary)]/50 text-xs font-mono uppercase tracking-widest text-blue-400 border-b border-blue-900/50">
                            <th className="p-4">Intelligence Score</th>
                            <th className="p-4">Property Address</th>
                            <th className="p-4">County / Jurisdiction</th>
                            <th className="p-4">Notice Type</th>
                            <th className="p-4">Auction Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((lead) => (
                            <tr
                                key={lead.id}
                                className="border-b border-blue-900/20 hover:bg-blue-900/10 cursor-pointer transition-colors"
                                onClick={() => setSelectedLead(lead)}
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs
                                             ${lead.radar_score >= 75 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                lead.radar_score >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                    'bg-gray-800 text-gray-400'}`}>
                                            {lead.radar_score}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 font-semibold text-white">{lead.address}</td>
                                <td className="p-4 text-gray-400 flex items-center gap-2">
                                    <Navigation size={14} className="text-blue-500" />
                                    {lead.county}
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-mono border border-red-500/20 flex items-center gap-1 w-fit">
                                        <ShieldAlert size={12} />
                                        {lead.distress_type}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400 font-mono text-sm">
                                    {new Date(lead.auction_date).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {loading && !initialLoad && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-500 font-mono animate-pulse">
                                    Fetching radar signals...
                                </td>
                            </tr>
                        )}
                        {leads.length === 0 && !loading && !initialLoad && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-500 font-mono">
                                    No active foreclosures detected on radar.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedLead && (
                <LeadDetailsPanel
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onConvert={() => handleConvertToDeal(selectedLead)}
                />
            )}
        </div>
    );
};
