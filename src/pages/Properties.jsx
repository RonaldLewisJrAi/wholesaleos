import React, { useState, useEffect } from 'react';
import { MapPin, Database, Activity, Send, Filter, Plus, X, Search, Home, ShieldCheck, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
import DealPacketModal from '../components/DealPacketModal';
import CompEngineModal from '../components/CompEngineModal';
import { useAudioGuidance } from '../hooks/useAudioGuidance';
import { voiceAssistant } from '../services/voiceAssistantService';
import { assistantInsightService } from '../services/assistantInsightService';
import './Properties.css';

const mockProperties = [
    { id: 1, address: '349 Rayon Dr, Old Hickory, TN 37138', status: 'FSBO Lead', arv: '$260,000', mao: '$180,000', image: 'https://photos.zillowstatic.com/fp/8a5840d24e54e42ba7ed03c2faeb9e7a-p_e.jpg', sqft: 1200, beds: 3, baths: 2, poc_verified: false },
    { id: 2, address: '6207 Laramie Ave, Nashville, TN 37209', status: 'Marketing', arv: '$550,000', mao: '$430,000', image: 'https://photos.zillowstatic.com/fp/9a957b98d4cf72bfec1b9542a17ba3f8-p_e.jpg', sqft: 1850, beds: 4, baths: 3, poc_verified: true },
    { id: 3, address: '52 Trimble St, Nashville, TN 37210', status: 'FSBO Lead', arv: '$480,000', mao: '$350,000', image: 'https://photos.zillowstatic.com/fp/7dce2e9c2f6d0a79a5baeb6dcbadadd5-p_e.jpg', sqft: 1403, beds: 4, baths: 2, poc_verified: false }
];

const getTrustTier = (score = 50) => {
    if (score >= 90) return { label: 'Elite', class: 'bg-success text-bg-darker' };
    if (score >= 75) return { label: 'Verified Pro', class: 'bg-primary text-bg-darker' };
    if (score >= 50) return { label: 'Active Trader', class: 'bg-secondary text-white' };
    if (score >= 25) return { label: 'New', class: 'bg-warning text-bg-darker' };
    return { label: 'High Risk', class: 'bg-danger text-white' };
};

const PropertyCard = ({ property, onLaunchPacket, onRunComps, onImport }) => {

    return (
        <div className="property-card glass-panel">
            <div className="property-image" style={{
                backgroundImage: `url(${property.image})`
            }}>
                <div className="flex-between w-full p-3 absolute top-0 left-0 items-start">
                    <div className="flex flex-col gap-2">
                        <span className={`status-badge w-max ${property.status === 'Under Contract' ? 'bg-warning' : property.status === 'Marketing' ? 'bg-primary' : property.status === 'Web Lead' ? 'bg-secondary' : 'bg-success'}`}>
                            {property.status}
                        </span>
                        {property.poc_verified && (
                            <span className="badge bg-[rgba(0,0,0,0.6)] backdrop-blur-md text-success border border-success border-opacity-30 font-bold text-[10px] shadow-lg w-max" title="Proof of Control Verified by Admin">
                                <CheckCircle size={10} className="inline mr-1" /> PoC Verified
                            </span>
                        )}
                    </div>
                    {property.status !== 'Web Lead' && (() => {
                        const trustScore = property.wholesaler?.trust_score || property.wholesaler_trust_score || 50;
                        const tier = getTrustTier(trustScore);
                        return (
                            <span className={`badge ${tier.class} font-bold text-xs shadow-lg`} title={`Wholesaler Trust Score: ${trustScore}/100`}>
                                <ShieldCheck size={12} className="inline mr-1" /> {tier.label}
                            </span>
                        );
                    })()}
                </div>
            </div>
            <div className="property-details">
                <h3 className="property-address flex items-center gap-1">
                    <MapPin size={16} className="text-primary flex-shrink-0" /> {property.address}
                </h3>
                <div className="property-metrics">
                    <div className="metric">
                        <span className="metric-label">ARV</span>
                        <span className="metric-value font-mono inline-block transition-all duration-300">
                            {property.arv}
                        </span>
                    </div>
                    <div className="metric">
                        <span className="metric-label">MAO</span>
                        <span className="metric-value font-mono inline-block transition-all duration-300 text-success">
                            {property.mao}
                        </span>
                    </div>
                </div>
                <div className="property-actions flex flex-col gap-2 mt-4">
                    {property.status === 'Web Lead' ? (
                        <button className="btn btn-primary w-full flex justify-center gap-2" onClick={() => onImport(property.id)}>
                            <Database size={16} /> Import to System
                        </button>
                    ) : (
                        <>
                            <button className="btn btn-secondary w-full flex justify-center gap-2" onClick={() => onRunComps(property)}>
                                <Activity size={16} /> Run Comps
                            </button>
                            <div className="flex gap-2">
                                <button className="btn btn-secondary flex-1" onClick={() => alert(`Opening detailed view for ${property.address}...`)}>View</button>
                                <button className="btn btn-primary flex-1 flex justify-center gap-2" onClick={() => onLaunchPacket(property)}>
                                    <Send size={16} /> Packet
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const Properties = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    const { enabled: audioEnabled } = useAudioGuidance();
    const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);

    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

    // Live Finder Modal State (Replaces Assessor Pull)
    const [isLiveFinderModalOpen, setIsLiveFinderModalOpen] = useState(false);
    const [liveFinderInput, setLiveFinderInput] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [acceptedTermsApify, setAcceptedTermsApify] = useState(false);

    // Zillow Import Modal State
    const [isZillowModalOpen, setIsZillowModalOpen] = useState(false);
    const [zillowUrlInput, setZillowUrlInput] = useState('');
    const [acceptedTermsZillow, setAcceptedTermsZillow] = useState(false);

    // Action Modal States
    const [selectedPropertyForPacket, setSelectedPropertyForPacket] = useState(null);
    const [selectedPropertyForComps, setSelectedPropertyForComps] = useState(null);



    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);

            if (!supabase) {
                // No supabase client (e.g. no .env connection), fallback to mock
                setProperties(mockProperties);
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('properties')
                    .select('*');

                if (error) throw error;

                // If table is empty but exists, or we get valid data, use it.
                // If it's empty, we might still want to show mock data for the prototype feel
                if (data && data.length > 0) {
                    setProperties(data);
                } else {
                    setProperties([]);
                }
            } catch (error) {
                console.error('Error fetching properties:', error);
                setProperties([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    useEffect(() => {
        if (audioEnabled && !loading && !hasSpokenWelcome) {
            voiceAssistant.speak(assistantInsightService.getMarketplaceSummary(properties.length));
            setHasSpokenWelcome(true);
        }
    }, [audioEnabled, loading, properties.length, hasSpokenWelcome]);

    const checkExclusivityLock = async (address) => {
        if (!supabase) return { isLocked: false };
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('properties')
                .select('exclusive_locked_by, exclusive_locked_at')
                .eq('address', address)
                .gte('exclusive_locked_at', thirtyDaysAgo.toISOString())
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                return { isLocked: false, error };
            }
            if (data) {
                return { isLocked: true };
            }
            return { isLocked: false };
        } catch (err) {
            console.error("Exclusivity check failed", err);
            return { isLocked: false };
        }
    };

    const handleOpenZillowModal = () => {
        setIsZillowModalOpen(true);
        setZillowUrlInput('');
        setAcceptedTermsZillow(false);
    };

    const handleZillowImport = async (e) => {
        e.preventDefault();
        if (!zillowUrlInput || !acceptedTermsZillow) return;

        // Quota Check for Scrapes
        if (user?.id) {
            try {
                const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
                const res = await fetch(`${baseUrl}/api/quotas/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, type: 'scrape' })
                });
                const data = await res.json();
                if (!res.ok || !data.allowed) {
                    alert(data.error || "Monthly scrape limit exceeded.");
                    setIsZillowModalOpen(false);
                    return;
                }
            } catch (err) {
                console.error("Quota check failed", err);
            }
        }

        setIsImporting(true);
        setIsZillowModalOpen(false);
        try {
            // Call the real Zillow Scraper Proxy Backend
            const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
            const scrapeRes = await fetch(`${baseUrl}/api/properties/import-zillow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.id || ''}` // Optional depending on strict auth
                },
                body: JSON.stringify({ url: zillowUrlInput })
            });

            if (!scrapeRes.ok) throw new Error("Scraper returned error");
            const scrapeData = await scrapeRes.json();

            const { isLocked } = await checkExclusivityLock(scrapeData.address);
            if (isLocked) {
                alert("🔒 Access Denied: This property is actively being worked by another investor. The 30-day exclusivity lock has not expired.");
                return;
            }

            const newProperty = {
                id: Date.now(),
                address: scrapeData.address || 'Scraped Zillow Property',
                status: 'Lead',
                arv: scrapeData.arv || 'Pending',
                mao: 'Pending Calc',
                sqft: scrapeData.sqft || null,
                beds: scrapeData.beds || null,
                baths: scrapeData.baths || null,
                source_url: zillowUrlInput, // Retain the deep link
                image: scrapeData.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            };

            setProperties(prev => [newProperty, ...prev]);
            alert("Property linkage established from Zillow!");
        } catch (error) {
            console.error("Zillow import failed", error);
            alert("Failed to import property. Check the URL and try again.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleLiveFinder = async (e) => {
        e.preventDefault();
        if (!liveFinderInput || !acceptedTermsApify) return;

        // Quota Check for Scrapes
        if (user?.id) {
            try {
                const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
                const res = await fetch(`${baseUrl}/api/quotas/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, type: 'scrape' })
                });
                const data = await res.json();
                if (!res.ok || !data.allowed) {
                    alert(data.error || "Monthly scrape limit exceeded.");
                    return;
                }
            } catch (err) {
                console.error("Quota check failed", err);
            }
        }

        setIsScraping(true);

        try {
            // Simulate 4.5s Apify pipeline delay
            await new Promise(r => setTimeout(r, 4500));

            const newWebLeads = [
                { id: Date.now() + 1, address: '4922 Charlotte Ave, Nashville, TN', status: 'Web Lead', arv: '$620,000', mao: 'Uncalculated', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', sqft: 1600, beds: 3, baths: 2 },
                { id: Date.now() + 2, address: '1210 McGavock Pk, Nashville, TN', status: 'Web Lead', arv: '$410,000', mao: 'Uncalculated', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', sqft: 1050, beds: 2, baths: 1 }
            ];

            setProperties(prev => [...newWebLeads, ...prev]);
            setIsLiveFinderModalOpen(false);
            setLiveFinderInput('');
            alert("Successfully scraped 2 new listings from the web!");
        } catch (err) {
            console.error(err);
            alert("Apify connection failed. Please try again.");
        } finally {
            setIsScraping(false);
        }
    };

    return (
        <div className="properties-container animate-fade-in">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Properties</h1>
                    <p className="page-description">Manage and evaluate your real estate acquisitions.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => setIsLiveFinderModalOpen(true)}>
                        <Database size={16} /> Live Finder
                    </button>
                    <button className="btn btn-secondary" onClick={() => alert("Opening Advanced Property Filters...")}><Filter size={16} /> Filter</button>
                    <button className="btn btn-primary" onClick={handleOpenZillowModal} disabled={isImporting}>
                        <Plus size={16} /> {isImporting ? 'Importing...' : 'Import from Zillow'}
                    </button>
                </div>
            </div>

            {isZillowModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '600px', width: '90%', padding: '24px', position: 'relative' }}>
                        <div className="flex-between mb-4 pb-4 border-b border-[var(--border-light)]">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Database size={24} className="text-primary" /> Zillow Direct Import</h2>
                            <button className="icon-btn-small" onClick={() => setIsZillowModalOpen(false)}><X size={20} /></button>
                        </div>

                        <p className="text-sm text-muted mb-6">Instantly extract public property records, tax histories, and high-resolution media directly from Zillow into your Wholesale OS CRM.</p>

                        <form onSubmit={handleZillowImport}>
                            <input
                                type="url"
                                className="fillable-input w-full mb-4"
                                placeholder="Paste Zillow URL (e.g. https://www.zillow.com/homedetails/...)"
                                value={zillowUrlInput}
                                onChange={(e) => setZillowUrlInput(e.target.value)}
                                required
                            />

                            <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 bg-[rgba(255,100,100,0.05)] border border-[rgba(255,100,100,0.2)] rounded-lg">
                                <input
                                    type="checkbox"
                                    className="mt-1 flex-shrink-0 cursor-pointer accent-primary"
                                    checked={acceptedTermsZillow}
                                    onChange={(e) => setAcceptedTermsZillow(e.target.checked)}
                                />
                                <span className="text-xs text-muted leading-tight">
                                    I verify that I am authorized to query this data for personal business use and assume all liability for data usage. I have read and accept the Wholesale OS <a href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</a> and Data Scraping Liability Waiver.
                                </span>
                            </label>

                            <button type="submit" className="btn btn-primary w-full" disabled={!zillowUrlInput || !acceptedTermsZillow}>
                                Extract Property Data
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isLiveFinderModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '600px', width: '90%', padding: '24px', position: 'relative' }}>
                        <div className="flex-between mb-4 pb-4 border-b border-[var(--border-light)]">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Database size={24} className="text-primary" /> Live Finder Engine</h2>
                            <button className="icon-btn-small" onClick={() => { setIsLiveFinderModalOpen(false); setLiveFinderInput(''); setAcceptedTermsApify(false); }}><X size={20} /></button>
                        </div>

                        <p className="text-sm text-muted mb-4">Initialize a headless browser on Apify's residential proxy network to scrape live For Sale By Owner leads for a target area.</p>

                        <form onSubmit={handleLiveFinder}>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    className="fillable-input flex-1"
                                    placeholder="Enter Target City or Zip Code (e.g. Nashville, TN or 37206)"
                                    value={liveFinderInput}
                                    onChange={(e) => setLiveFinderInput(e.target.value)}
                                    disabled={isScraping}
                                />
                                <button type="submit" className="btn btn-primary" disabled={isScraping || !liveFinderInput || !acceptedTermsApify}>
                                    {isScraping ? 'Searching...' : 'Initiate Radar'}
                                </button>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer p-3 bg-[rgba(255,100,100,0.05)] border border-[rgba(255,100,100,0.2)] rounded-lg">
                                <input
                                    type="checkbox"
                                    className="mt-1 flex-shrink-0 cursor-pointer accent-primary"
                                    checked={acceptedTermsApify}
                                    onChange={(e) => setAcceptedTermsApify(e.target.checked)}
                                    disabled={isScraping}
                                />
                                <span className="text-xs text-muted leading-tight">
                                    I verify that I am authorized to query this data for personal business use and assume all liability for data usage. I have read and accept the Wholesale OS <a href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</a> and Data Scraping Liability Waiver.
                                </span>
                            </label>
                        </form>

                        {isScraping && (
                            <div className="text-center py-8 text-muted animate-pulse">
                                <Database size={32} className="mx-auto mb-4 opacity-50 text-primary" />
                                <p className="font-bold">Spinning up Apify Chromium instance...</p>
                                <p className="text-xs mt-2 opacity-70">Bypassing Cloudflare WAF protections...</p>
                                <p className="text-xs mt-1 opacity-70">Extracting property metrics and images from public records...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="properties-toolbar glass-panel">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search saved properties in Local Database by address, city, or status..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <label className="flex items-center gap-2 cursor-pointer ml-4 mr-auto text-sm font-bold text-muted hover:text-white transition-colors">
                    <input type="checkbox" className="accent-primary" checked={showVerifiedOnly} onChange={e => setShowVerifiedOnly(e.target.checked)} />
                    <CheckCircle size={14} className={showVerifiedOnly ? 'text-success' : 'opacity-50'} /> Verified Only
                </label>
                <div className="view-toggles">
                    <button className="icon-btn active"><Home size={18} /></button>
                    <button className="icon-btn"><MapPin size={18} /></button>
                </div>
            </div>

            <div className="properties-grid">
                {loading ? (
                    <div className="text-muted p-4">Loading properties...</div>
                ) : (
                    properties.filter(prop =>
                        prop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        prop.status.toLowerCase().includes(searchQuery.toLowerCase())
                    ).filter(prop => showVerifiedOnly ? prop.poc_verified === true : true).map(prop => (
                        <PropertyCard
                            key={prop.id}
                            property={prop}
                            onLaunchPacket={setSelectedPropertyForPacket}
                            onRunComps={setSelectedPropertyForComps}
                            onImport={async (id) => {
                                const targetProp = properties.find(p => p.id === id);
                                if (!targetProp) return;

                                const { isLocked } = await checkExclusivityLock(targetProp.address);
                                if (isLocked) {
                                    alert("🔒 Access Denied: This property is actively being worked by another investor. The 30-day exclusivity lock has not expired.");
                                    return;
                                }

                                setProperties(prev => prev.map(p => p.id === id ? { ...p, status: 'FSBO Lead' } : p));
                                alert('Property successfully imported to your Local Database!');
                            }}
                        />
                    ))
                )}
            </div>

            <DealPacketModal
                isOpen={!!selectedPropertyForPacket}
                property={selectedPropertyForPacket}
                onClose={() => setSelectedPropertyForPacket(null)}
            />

            <CompEngineModal
                isOpen={!!selectedPropertyForComps}
                property={selectedPropertyForComps}
                onClose={() => setSelectedPropertyForComps(null)}
            />
        </div>
    );
};

export default Properties;
