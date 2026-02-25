import React, { useState, useEffect } from 'react';
import { MapPin, Database, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDemoMode } from '../contexts/DemoModeContext';
import DealPacketModal from '../components/DealPacketModal';
import CompEngineModal from '../components/CompEngineModal';
import './Properties.css';

const mockProperties = [
    { id: 1, address: '349 Rayon Dr, Old Hickory, TN 37138', status: 'FSBO Lead', arv: '$260,000', mao: '$180,000', image: 'https://photos.zillowstatic.com/fp/8a5840d24e54e42ba7ed03c2faeb9e7a-p_e.jpg', sqft: 1200, beds: 3, baths: 2 },
    { id: 2, address: '6207 Laramie Ave, Nashville, TN 37209', status: 'Marketing', arv: '$550,000', mao: '$430,000', image: 'https://photos.zillowstatic.com/fp/9a957b98d4cf72bfec1b9542a17ba3f8-p_e.jpg', sqft: 1850, beds: 4, baths: 3 },
    { id: 3, address: '52 Trimble St, Nashville, TN 37210', status: 'FSBO Lead', arv: '$480,000', mao: '$350,000', image: 'https://photos.zillowstatic.com/fp/7dce2e9c2f6d0a79a5baeb6dcbadadd5-p_e.jpg', sqft: 1403, beds: 4, baths: 2 }
];

const PropertyCard = ({ property, onLaunchPacket, onRunComps, onImport }) => {
    const { isDemoMode } = useDemoMode();

    return (
        <div className="property-card glass-panel">
            <div className="property-image" style={{
                backgroundImage: `url(${property.image})`
            }}>
                <span className={`status-badge ${property.status === 'Under Contract' ? 'bg-warning' : property.status === 'Marketing' ? 'bg-primary' : property.status === 'Web Lead' ? 'bg-secondary' : 'bg-success'}`}>
                    {property.status}
                </span>
            </div>
            <div className="property-details">
                <h3 className="property-address flex items-center gap-1" style={{
                    filter: isDemoMode ? 'blur(5px)' : 'none',
                    userSelect: isDemoMode ? 'none' : 'auto',
                    transition: 'filter 0.3s ease'
                }}>
                    <MapPin size={16} className="text-primary flex-shrink-0" /> {property.address}
                </h3>
                <div className="property-metrics">
                    <div className="metric">
                        <span className="metric-label">ARV</span>
                        <span className={`metric-value font-mono inline-block transition-all duration-300 ${isDemoMode ? 'blur-md select-none opacity-50 pointer-events-none' : ''}`}>
                            {property.arv}
                        </span>
                    </div>
                    <div className="metric">
                        <span className="metric-label">MAO</span>
                        <span className={`metric-value font-mono inline-block transition-all duration-300 ${isDemoMode ? 'blur-md select-none opacity-50 pointer-events-none' : 'text-success'}`}>
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
    const { isDemoMode } = useDemoMode();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Live Finder Modal State (Replaces Assessor Pull)
    const [isLiveFinderModalOpen, setIsLiveFinderModalOpen] = useState(false);
    const [liveFinderInput, setLiveFinderInput] = useState('');
    const [isScraping, setIsScraping] = useState(false);

    // Action Modal States
    const [selectedPropertyForPacket, setSelectedPropertyForPacket] = useState(null);
    const [selectedPropertyForComps, setSelectedPropertyForComps] = useState(null);



    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);

            if (isDemoMode) {
                // Explicitly use mock data in demo mode to protect real client info
                setProperties(mockProperties);
                setLoading(false);
                return;
            }

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
    }, [isDemoMode]);

    const handleZillowImport = async () => {
        const url = window.prompt("Enter Zillow Property URL:");
        if (!url) return;

        setIsImporting(true);
        try {
            // Simulate scraping delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const newProperty = {
                id: Date.now(),
                address: 'Scraped Property: ' + Math.floor(Math.random() * 9999) + ' Zillow Ln',
                status: 'Lead',
                arv: '$' + (Math.floor(Math.random() * 50) + 30) + '0,000',
                mao: 'Pending Calc',
                image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            };

            setProperties(prev => [newProperty, ...prev]);
            alert("Property successfully imported from Zillow!");
        } catch (error) {
            console.error("Zillow import failed", error);
            alert("Failed to import property. Check the URL and try again.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleLiveFinder = async (e) => {
        e.preventDefault();
        if (!liveFinderInput) return;
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
                    <button className="btn btn-primary" onClick={handleZillowImport} disabled={isImporting}>
                        <Plus size={16} /> {isImporting ? 'Importing...' : 'Import from Zillow'}
                    </button>
                </div>
            </div>

            {isLiveFinderModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '600px', width: '90%', padding: '24px', position: 'relative' }}>
                        <div className="flex-between mb-4 pb-4 border-b border-[var(--border-light)]">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Database size={24} className="text-primary" /> Live Finder Engine</h2>
                            <button className="icon-btn-small" onClick={() => { setIsLiveFinderModalOpen(false); setLiveFinderInput(''); }}><X size={20} /></button>
                        </div>

                        <p className="text-sm text-muted mb-4">Initialize a headless browser on Apify's residential proxy network to scrape live For Sale By Owner leads for a target area.</p>

                        <form onSubmit={handleLiveFinder} className="flex gap-2 mb-6">
                            <input
                                type="text"
                                className="fillable-input flex-1"
                                placeholder="Enter Target City or Zip Code (e.g. Nashville, TN or 37206)"
                                value={liveFinderInput}
                                onChange={(e) => setLiveFinderInput(e.target.value)}
                                disabled={isScraping}
                            />
                            <button type="submit" className="btn btn-primary" disabled={isScraping || !liveFinderInput}>
                                {isScraping ? 'Searching...' : 'Initiate Radar'}
                            </button>
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
                    ).map(prop => (
                        <PropertyCard
                            key={prop.id}
                            property={prop}
                            onLaunchPacket={setSelectedPropertyForPacket}
                            onRunComps={setSelectedPropertyForComps}
                            onImport={(id) => {
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
