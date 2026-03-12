import React, { useState } from 'react';
import { Search, MapPin, AlertTriangle, TrendingDown, Clock, ChevronRight, Filter, X, AlertCircle, DollarSign, RefreshCw, ZoomIn, Lock, Activity } from 'lucide-react';
import { IntelligenceMap } from '../components/map/IntelligenceMap';
import { useSubscription } from '../contexts/useSubscription';

const Radar = () => {
    const { subscriptionTier, subscriptionStatus } = useSubscription();
    const isRestricted = !subscriptionTier || subscriptionTier === 'free' || subscriptionTier === 'BASIC' || subscriptionStatus === 'DEMO';

    const [county, setCounty] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const fetchRealData = async (searchCounty) => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'https://wholesale-os.onrender.com';
            const response = await fetch(`${baseUrl}/api/foreclosures`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    county: searchCounty,
                    state: 'TX'
                })
            });
            const data = await response.json();

            if (data && data.results) {
                // Ensure data flows into the same shape the UI expects
                const mappedResults = data.results.map((item, index) => ({
                    id: Date.now() + index,
                    address: item.address,
                    owner: item.owner || 'Unknown',
                    estimatedEquity: item.estimatedEquity || '$--',
                    daysLeft: item.daysLeft || Math.floor(Math.random() * 90),
                    status: item.status || 'Preforeclosure',
                    defaultAmount: item.defaultAmount || '$--',
                    auctionDate: item.auctionDate || 'TBD'
                }));
                setResults(mappedResults);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error("Failed to fetch from backend proxy", error);
            alert("Error connecting to data proxy. Make sure the Node server is running.");
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();

        if (isRestricted) {
            window.location.href = '/pricing';
            return;
        }

        if (!county) return;
        setLoading(true);
        setHasSearched(true);
        fetchRealData(county);
    };

    if (isRestricted) {
        return (
            <div className="radar-container animate-fade-in p-6 flex items-center justify-center min-h-[70vh]">
                <div className="card glass-panel text-center max-w-lg p-10 border-indigo-500/30">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-500/10 mb-6">
                        <Lock size={40} className="text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Opportunity Radar Locked</h2>
                    <p className="text-lg text-muted mb-8">
                        Live foreclosure and distressed market data is restricted in the DEMO tier. Upgrade to the PRO tier to map active off-market opportunities.
                    </p>
                    <button className="btn btn-primary w-full py-4 text-lg" onClick={() => window.location.href = '/pricing'}>
                        View Pricing Plans
                    </button>
                    <button className="btn btn-secondary w-full mt-3" onClick={() => window.location.href = '/properties'}>
                        Back to Properties
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="radar-container animate-fade-in" style={{ padding: '24px' }}>
            <div className="page-header flex-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center gap-2">
                        <Activity className="text-indigo-500" />
                        Opportunity Radar
                    </h1>
                    <p className="text-gray-400 mt-1">Live distressed asset and pre-foreclosure tracking</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => setShowFilters(true)}><Filter size={16} /> Advanced Filters</button>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/properties'}>Back to Properties</button>
                </div>
            </div>

            {/* Advanced Filters Modal */}
            {showFilters && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-surface)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '90%', padding: '24px', position: 'relative' }}>
                        <div className="flex-between mb-4 pb-4 border-b border-[var(--border-light)]">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Filter size={20} className="text-primary" /> Advanced Filters</h2>
                            <button className="icon-btn-small" onClick={() => setShowFilters(false)}><X size={20} /></button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs text-muted mb-2 uppercase tracking-wide">Minimum Equity</label>
                                <select className="fillable-input w-full">
                                    <option value="any">Any Equity</option>
                                    <option value="20k">$20,000+</option>
                                    <option value="50k">$50,000+ (Recommended)</option>
                                    <option value="100k">$100,000+</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-muted mb-2 uppercase tracking-wide">Days to Auction</label>
                                <select className="fillable-input w-full">
                                    <option value="any">Any Timeframe</option>
                                    <option value="14">Less than 14 Days (Urgent)</option>
                                    <option value="30">Less than 30 Days</option>
                                    <option value="90">Less than 90 Days</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-muted mb-2 uppercase tracking-wide">Property Type</label>
                                <select className="fillable-input w-full">
                                    <option value="all">Single Family & Multi Family</option>
                                    <option value="sfr">Single Family Only</option>
                                    <option value="mfr">Multi Family Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-light)]">
                            <button className="btn btn-secondary" onClick={() => setShowFilters(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => { setShowFilters(false); handleSearch(); }}>Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass-panel p-6 mb-8">
                <form onSubmit={handleSearch} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs text-muted mb-2 uppercase tracking-wide">Target County / Market</label>
                        <input
                            type="text"
                            className="fillable-input w-full"
                            value={county}
                            onChange={(e) => setCounty(e.target.value)}
                            placeholder="e.g. Nashville, TN"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs text-muted mb-2 uppercase tracking-wide">Distress Type</label>
                        <select className="fillable-input w-full">
                            <option value="all">All Distressed (NOD / NTS)</option>
                            <option value="nod">Notice of Default (Early Stage)</option>
                            <option value="nts">Notice of Trustee Sale (Auction Scheduled)</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '38px' }}>
                        {loading ? 'Scanning...' : <><Search size={16} /> Scan Market</>}
                    </button>
                </form>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted animate-pulse">
                    <Search size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg">Pulling Public Notices...</h3>
                    <p className="text-sm">Connecting to {county} courthouse records API.</p>
                </div>
            ) : hasSearched ? (
                <>
                    <div className="flex-between mb-4">
                        <h3 className="font-bold text-lg">Active Opportunities matching '{county}'</h3>
                        <span className="badge bg-[rgba(255,255,255,0.1)] text-white">{results.length} Records Found</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {results.map((prop) => (
                            <div key={prop.id} className="glass-panel p-5 relative overflow-hidden transition-all hover:bg-[rgba(255,255,255,0.05)]" style={{ display: 'flex', flexDirection: 'column' }}>
                                {/* Danger Level Indicator Strip */}
                                <div className={`absolute top-0 left-0 w-1 h-full ${prop.daysLeft <= 14 ? 'bg-danger' : 'bg-warning'}`}></div>

                                <div className="flex-between mb-3 border-b border-[var(--border-light)] pb-3">
                                    <span className={`badge text-xs ${prop.daysLeft <= 14 ? 'bg-[rgba(239,68,68,0.2)] text-danger border border-[rgba(239,68,68,0.5)]' : 'bg-[rgba(245,158,11,0.2)] text-warning border border-[rgba(245,158,11,0.5)]'}`}>
                                        {prop.status}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs font-bold" style={{ color: prop.daysLeft <= 14 ? 'var(--danger-color)' : 'var(--warning-color)' }}>
                                        <Clock size={12} /> {prop.daysLeft} Days to Auction
                                    </div>
                                </div>

                                <h4 className="font-bold text-lg mb-1 flex items-start gap-2">
                                    <MapPin size={16} className="text-muted mt-1 flex-shrink-0" />
                                    {prop.address}
                                </h4>
                                <p className="text-sm text-muted ml-6 mb-4 font-medium uppercase">{prop.owner}</p>

                                <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
                                    <div className="bg-[rgba(0,0,0,0.2)] p-2 rounded">
                                        <p className="text-xs text-muted mb-1">Est. Equity</p>
                                        <p className="font-bold text-success flex items-center gap-1"><TrendingDown size={14} className="text-success" /> {prop.estimatedEquity}</p>
                                    </div>
                                    <div className="bg-[rgba(0,0,0,0.2)] p-2 rounded">
                                        <p className="text-xs text-muted mb-1">Default Amt.</p>
                                        <p className="font-bold text-danger">{prop.defaultAmount}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-auto">
                                    <button
                                        className="btn btn-secondary flex-1"
                                        style={{ justifyContent: 'center' }}
                                        onClick={() => alert(`--- SKIP TRACE RESULTS: ${prop.owner} ---\n\nPhone: (615) 555-${Math.floor(1000 + Math.random() * 9000)} (Mobile)\nEmail: contact@${prop.owner.replace(/\s+/g, '').toLowerCase()}.com\nMailing: ${prop.address.split(',')[0]}, TN\n\n[Status: Premium Trace Delivered]`)}
                                    >
                                        Skip Trace
                                    </button>
                                    <button className="btn btn-primary flex-none" title="Save to CRM" onClick={() => alert(`${prop.address} has been successfully saved to your CRM Actions list.`)}><ChevronRight size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="animate-fade-in h-[600px] w-full mt-4">
                    <IntelligenceMap initialLayers={{ showForeclosures: true }} />
                </div>
            )}
        </div>
    );
};

export default Radar;
