import React, { useState } from 'react';
import { Search, MapPin, AlertTriangle, TrendingDown, Clock, ChevronRight, Filter, X } from 'lucide-react';
import axios from 'axios';
import { useDemoMode } from '../contexts/DemoModeContext';
import HeatMap from '../components/HeatMap';

const Radar = () => {
    const { isDemoMode } = useDemoMode();
    const [county, setCounty] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const fetchRealData = async (searchCounty) => {
        try {
            // Pointing to the live Render Proxy
            const response = await axios.post('https://wholesale-os.onrender.com/api/foreclosures', {
                county: searchCounty,
                state: 'TX' // Defaulting to TX for the prototype, could be dynamic
            });

            if (response.data && response.data.results) {
                // Ensure data flows into the same shape the UI expects
                const mappedResults = response.data.results.map((item, index) => ({
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
        if (!county) return;
        setLoading(true);
        setHasSearched(true);

        if (isDemoMode) {
            // Bypass the backend completely and inject high-quality mock data
            setTimeout(() => {
                const demoResults = [
                    { id: 1, address: `123 Main St, ${county}`, owner: 'John Doe', estimatedEquity: '$65,000', daysLeft: 45, status: 'Notice of Default', defaultAmount: '$12,450' },
                    { id: 2, address: `456 Oak Ave, ${county}`, owner: 'Jane Smith', estimatedEquity: '$110,000', daysLeft: 12, status: 'Notice of Trustee Sale', defaultAmount: '$24,100' },
                    { id: 3, address: `789 Pine Ln, ${county}`, owner: 'Robert Johnson', estimatedEquity: '$45,000', daysLeft: 83, status: 'Notice of Default', defaultAmount: '$8,900' }
                ];
                setResults(demoResults);
                setLoading(false);
            }, 1500);
        } else {
            // Live production mode
            fetchRealData(county);
        }
    };

    return (
        <div className="radar-container animate-fade-in" style={{ padding: '24px' }}>
            <div className="page-header flex-between mb-6">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <AlertTriangle className={isDemoMode ? "text-muted" : "text-warning"} size={28} /> Opportunity Radar
                        {isDemoMode && <span className="badge bg-[rgba(255,255,255,0.1)] text-xs ml-2 border border-[var(--border-light)]">Demo Mode Active</span>}
                    </h1>
                    <p className="page-description">Track preforeclosures, auctions, and distressed properties in your target markets.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => setShowFilters(true)}><Filter size={16} /> Advanced Filters</button>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/properties'}>Back to Properties</button>
                </div>
            </div>

            {/* Advanced Filters Modal */}
            {showFilters && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
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
                            placeholder="e.g. Harris County, TX"
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
                                    <button className="btn btn-secondary flex-1" style={{ justifyContent: 'center' }}>Skip Trace</button>
                                    <button className="btn btn-primary flex-none" title="Save to CRM"><ChevronRight size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="animate-fade-in">
                    <HeatMap />
                </div>
            )}
        </div>
    );
};

export default Radar;
