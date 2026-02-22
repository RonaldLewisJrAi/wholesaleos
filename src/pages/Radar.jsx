import React, { useState } from 'react';
import { Search, MapPin, AlertTriangle, TrendingDown, Clock, ChevronRight, Filter } from 'lucide-react';
import axios from 'axios';

const Radar = () => {
    const [county, setCounty] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

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

    const handleSearch = (e) => {
        e.preventDefault();
        if (!county) return;
        setLoading(true);
        setHasSearched(true);
        fetchRealData(county);
    };

    return (
        <div className="radar-container animate-fade-in" style={{ padding: '24px' }}>
            <div className="page-header flex-between mb-6">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <AlertTriangle className="text-warning" size={28} /> Opportunity Radar
                    </h1>
                    <p className="page-description">Track preforeclosures, auctions, and distressed properties in your target markets.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary"><Filter size={16} /> Advanced Filters</button>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/properties'}>Back to Properties</button>
                </div>
            </div>

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
                <div className="text-center py-12 text-muted glass-panel">
                    <AlertTriangle size={48} className="mx-auto mb-4 opacity-50 text-warning" />
                    <h3 className="text-lg">Radar Inactive</h3>
                    <p className="text-sm">Enter a target county and scan the market to locate distressed properties.</p>
                </div>
            )}
        </div>
    );
};

export default Radar;
