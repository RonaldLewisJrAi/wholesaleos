import React, { useState, useEffect } from 'react';
import { Target, Search, FolderHeart, Briefcase, Bell, Clock, Bookmark, History } from 'lucide-react';
import RiskMatrix from './Shared/RiskMatrix';
import LiquidityIndex from './Shared/LiquidityIndex';
import { databaseService } from '../../services/databaseService';
import { useAuth } from '../../contexts/useAuth';
import DealCard from '@/components/ui/DealCard';

const InvestorDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('alerts');
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);



    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const allDeals = await databaseService.getDeals();
            const sortedDeals = (allDeals || []).sort((a, b) => {
                // 1. Priority deals
                if (a.priority && !b.priority) return -1;
                if (!a.priority && b.priority) return 1;
                // 2. Deal score (descending)
                const scoreA = a.score || 0;
                const scoreB = b.score || 0;
                if (scoreA !== scoreB) return scoreB - scoreA;
                // 3. Newest deals
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            });

            // Note: In MVP these are simple local filters. 
            // In Production, these would be discrete Supabase RPCs matching the platform_events tables.
            let filtered = [];
            switch (activeTab) {
                case 'alerts': {
                    // Active Deals matching Buy Box explicitly
                    const prefs = user?.id ? await databaseService.getInvestorPreferences(user.id) : null;

                    filtered = sortedDeals.filter(d => {
                        if (d.status !== 'ACTIVE') return false;
                        if (!prefs) return true; // If no prefs set, fall back to open discovery

                        // Location Match
                        const stateMatch = !prefs.states || prefs.states.length === 0 || prefs.states.includes(d.state);
                        const cityMatch = !prefs.cities || prefs.cities.length === 0 || prefs.cities.includes(d.city);
                        if (!stateMatch || !cityMatch) return false;

                        // ARV Overlap
                        const minArvMatch = !prefs.min_arv || d.arv >= prefs.min_arv;
                        const maxArvMatch = !prefs.max_arv || d.arv <= prefs.max_arv;
                        if (!minArvMatch || !maxArvMatch) return false;

                        // Rehab Overlap
                        const maxRehabMatch = !prefs.max_rehab || d.estimated_repair_cost <= prefs.max_rehab;
                        if (!maxRehabMatch) return false;

                        // Strategy Match (assuming strategy strings overlap)
                        const strategyMatch = !prefs.strategy || prefs.strategy.length === 0 || prefs.strategy.includes(d.strategy_type);
                        if (!strategyMatch) return false;

                        return true;
                    });
                    break;
                }
                case 'reserved':
                    // Deals currently held in Escrow by this investor
                    filtered = sortedDeals.filter(d => d.status === 'RESERVED');
                    break;
                case 'history':
                    // Deals the investor closed or canceled
                    filtered = sortedDeals.filter(d => d.status === 'Closed' || d.status === 'Dead');
                    break;
                case 'watchlist': {
                    // Saved/Hearted deals
                    const savedIds = await databaseService.getWatchlist();
                    filtered = sortedDeals.filter(d => savedIds.includes(d.id));
                    break;
                }
                default:
                    filtered = [];
            }
            setDeals(filtered);
        } catch (e) {
            console.error("Dashboard Load Error:", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);



    return (
        <div className="animate-fade-in pb-12">
            <div className="page-header mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Target className="text-primary" size={32} />
                    Investor Workstation
                </h1>
                <p className="text-muted mt-2">Manage your active buy box, review immediate deal matches, and track active escrows.</p>
            </div>

            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div onClick={() => setActiveTab('alerts')} className={`card glass-panel p-5 border-l-4 cursor-pointer hover:brightness-110 transition-all ${activeTab === 'alerts' ? 'border-primary bg-primary/5' : 'border-gray-700'}`}>
                    <div className="flex-between mb-2">
                        <h3 className="font-bold flex items-center gap-2"><Bell border-gray-700 size={16} /> Deal Alerts</h3>
                    </div>
                    <p className="text-xs text-muted">Properties matching criteria</p>
                </div>
                <div onClick={() => setActiveTab('reserved')} className={`card glass-panel p-5 border-l-4 cursor-pointer hover:brightness-110 transition-all ${activeTab === 'reserved' ? 'border-warning bg-warning/5' : 'border-gray-700'}`}>
                    <div className="flex-between mb-2">
                        <h3 className="font-bold flex items-center gap-2"><Clock size={16} /> Reserved Deals</h3>
                    </div>
                    <p className="text-xs text-muted">Awaiting your EMD deposit</p>
                </div>
                <div onClick={() => setActiveTab('history')} className={`card glass-panel p-5 border-l-4 cursor-pointer hover:brightness-110 transition-all ${activeTab === 'history' ? 'border-success bg-success/5' : 'border-gray-700'}`}>
                    <div className="flex-between mb-2">
                        <h3 className="font-bold flex items-center gap-2"><History size={16} /> Closed / History</h3>
                    </div>
                    <p className="text-xs text-muted">Completed transaction ledger</p>
                </div>
                <div onClick={() => setActiveTab('watchlist')} className={`card glass-panel p-5 border-l-4 cursor-pointer hover:brightness-110 transition-all ${activeTab === 'watchlist' ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700'}`}>
                    <div className="flex-between mb-2">
                        <h3 className="font-bold flex items-center gap-2"><Bookmark size={16} /> Saved Watchlist</h3>
                    </div>
                    <p className="text-xs text-muted">Deals marked for underwriting</p>
                </div>
            </div>

            {/* Dynamic Dashboard Feed */}
            <div className="card glass-panel min-h-[400px]">
                <div className="p-4 border-b border-[var(--border-light)] flex justify-between items-center">
                    <h3 className="font-bold text-lg uppercase tracking-wider text-gray-300">
                        {activeTab === 'alerts' && 'Active Deal Distribution Matches'}
                        {activeTab === 'reserved' && 'Your Active Escrows'}
                        {activeTab === 'history' && 'Historical Transactions'}
                        {activeTab === 'watchlist' && 'Underwriting Pipeline'}
                    </h3>
                    <button className="btn btn-secondary btn-sm text-xs">Edit Buy Box Criteria</button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <Search className="animate-spin mb-4" size={32} />
                            <p>Loading market data...</p>
                        </div>
                    ) : deals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-muted border border-dashed border-gray-700 rounded-xl my-8">
                            <FolderHeart className="mx-auto mb-4 opacity-50" size={48} />
                            <p className="text-lg mb-2">No matching deals found for this view.</p>
                            <p className="text-sm">As Wholesalers post properties meeting your parameters, they will automatically map here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {deals.map(deal => (
                                <div key={deal.id} className={`relative rounded-[8px] transition-all ${deal.priority ? 'priority-gold transform hover:-translate-y-1' : ''}`}>
                                    <DealCard deal={deal} />
                                    {/* Strict Enforcement Badges generated on top of DealCard components per UI architecture rules */}
                                    <div className="absolute top-2 right-2 flex gap-1 z-10 pointer-events-none">
                                        {deal.priority && <span className="badge bg-yellow-500 text-bg-darker font-bold text-[10px] tracking-wider shadow-lg">🔥 PRIORITY</span>}
                                        {deal.poc_verified_doc_id && <span className="badge bg-success text-bg-darker font-bold text-[10px] tracking-wider shadow-lg">PoC Verified</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <RiskMatrix persona="INVESTOR" />
                <LiquidityIndex persona="INVESTOR" velocityScore={68} />
            </div>
        </div>
    );
};

export default InvestorDashboard;
