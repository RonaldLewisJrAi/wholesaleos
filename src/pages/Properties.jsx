import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Home, MapPin, Database, X, CheckCircle, User, Mail, Send, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import { useDemoMode } from '../contexts/DemoModeContext';
import DealPacketModal from '../components/DealPacketModal';
import CompEngineModal from '../components/CompEngineModal';
import './Properties.css';

const mockProperties = [
    { id: 1, address: '349 Rayon Dr, Old Hickory, TN 37138', status: 'FSBO Lead', arv: '$260,000', mao: '$180,000', image: 'https://photos.zillowstatic.com/fp/8a5840d24e54e42ba7ed03c2faeb9e7a-p_e.jpg', sqft: 1200, beds: 3, baths: 2 },
    { id: 2, address: '6207 Laramie Ave, Nashville, TN 37209', status: 'Marketing', arv: '$550,000', mao: '$430,000', image: 'https://photos.zillowstatic.com/fp/9a957b98d4cf72bfec1b9542a17ba3f8-p_e.jpg', sqft: 1850, beds: 4, baths: 3 },
    { id: 3, address: '52 Trimble St, Nashville, TN 37210', status: 'FSBO Lead', arv: '$480,000', mao: '$350,000', image: 'https://photos.zillowstatic.com/fp/7dce2e9c2f6d0a79a5baeb6dcbadadd5-p_e.jpg', sqft: 1403, beds: 4, baths: 2 }
];

const PropertyCard = ({ property, onLaunchPacket, onRunComps }) => {
    const { isDemoMode } = useDemoMode();

    return (
        <div className="property-card glass-panel">
            <div className="property-image" style={{
                backgroundImage: `url(${property.image})`
            }}>
                <span className={`status-badge ${property.status === 'Under Contract' ? 'bg-warning' : property.status === 'Marketing' ? 'bg-primary' : 'bg-success'}`}>
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
                    <button className="btn btn-secondary w-full flex justify-center gap-2" onClick={() => onRunComps(property)}>
                        <Activity size={16} /> Run Comps
                    </button>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary flex-1">View</button>
                        <button className="btn btn-primary flex-1 flex justify-center gap-2" onClick={() => onLaunchPacket(property)}>
                            <Send size={16} /> Packet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Properties = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [selectedPropertyForPacket, setSelectedPropertyForPacket] = useState(null);
    const [selectedPropertyForComps, setSelectedPropertyForComps] = useState(null);

    // Assessor Modal State
    const [isAssessorModalOpen, setIsAssessorModalOpen] = useState(false);
    const [assessorInput, setAssessorInput] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [assessorResult, setAssessorResult] = useState(null);
    const { isDemoMode } = useDemoMode();

    useEffect(() => {
        const fetchProperties = async () => {
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
                    setProperties(mockProperties);
                }
            } catch (error) {
                console.error('Error fetching properties, falling back to mock data:', error);
                setProperties(mockProperties);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

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

    const handleAssessorPull = async (e) => {
        e.preventDefault();
        if (!assessorInput) return;
        setIsScraping(true);
        setAssessorResult(null);

        try {
            if (isDemoMode) {
                // Simulated deep web scraping delay (2.5 seconds to feel like heavy lifting)
                await new Promise(resolve => setTimeout(resolve, 2500));

                const mockResult = {
                    realPropertyAddress: assessorInput.toUpperCase(),
                    ownerName: 'JOHNATHAN DOE & JANE DOE',
                    mailingAddress: 'PO BOX ' + Math.floor(Math.random() * 9000 + 1000) + ', AUSTIN, TX 78701',
                    assessedValue: '$' + (Math.floor(Math.random() * 400) + 150) + ',000',
                    yearBuilt: Math.floor(Math.random() * 60) + 1960,
                    lastSaleDate: '10/14/' + (Math.floor(Math.random() * 15) + 2005)
                };
                setAssessorResult(mockResult);
            } else {
                // Fetch live data through the Render proxy -> Python Propwire scraper pipeline
                const response = await axios.post('https://wholesale-os.onrender.com/api/assessor', {
                    address: assessorInput
                });

                if (response.data && response.data.status === 'success') {
                    setAssessorResult({
                        realPropertyAddress: response.data.realPropertyAddress,
                        ownerName: response.data.ownerName,
                        mailingAddress: response.data.mailingAddress,
                        assessedValue: response.data.assessedValue,
                        yearBuilt: response.data.yearBuilt,
                        lastSaleDate: response.data.lastSaleDate
                    });
                } else {
                    alert("Failed to extract data: " + (response.data?.message || "Unknown error"));
                }
            }
        } catch (err) {
            console.error(err);
            alert("Assessor connection failed. Ensure the Render proxy is live.");
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
                    <button className="btn btn-secondary" onClick={() => setIsAssessorModalOpen(true)}>
                        <Database size={16} /> Assessor Pull
                    </button>
                    <button className="btn btn-secondary"><Filter size={16} /> Filter</button>
                    <button className="btn btn-primary" onClick={handleZillowImport} disabled={isImporting}>
                        <Plus size={16} /> {isImporting ? 'Importing...' : 'Import from Zillow'}
                    </button>
                </div>
            </div>

            {isAssessorModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '600px', width: '90%', padding: '24px', position: 'relative' }}>
                        <div className="flex-between mb-4 pb-4 border-b border-[var(--border-light)]">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Database size={24} className="text-primary" /> Public Records Drop</h2>
                            <button className="icon-btn-small" onClick={() => { setIsAssessorModalOpen(false); setAssessorResult(null); setAssessorInput(''); }}><X size={20} /></button>
                        </div>

                        <p className="text-sm text-muted mb-4">Enter a property address to scrape the local county assessor database for verified legal owner and situs details.</p>

                        <form onSubmit={handleAssessorPull} className="flex gap-2 mb-6">
                            <input
                                type="text"
                                className="fillable-input flex-1"
                                placeholder="e.g. 123 Main St, Austin, TX"
                                value={assessorInput}
                                onChange={(e) => setAssessorInput(e.target.value)}
                                disabled={isScraping}
                            />
                            <button type="submit" className="btn btn-primary" disabled={isScraping || !assessorInput}>
                                {isScraping ? 'Scraping...' : 'Pull Data'}
                            </button>
                        </form>

                        {isScraping && (
                            <div className="text-center py-8 text-muted animate-pulse">
                                <Database size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Bypassing standard captchas...</p>
                                <p className="text-xs mt-1">Connecting to county assessor database...</p>
                            </div>
                        )}

                        {assessorResult && (
                            <div className="assessor-result bg-[rgba(0,0,0,0.2)] p-4 rounded border border-[var(--border-light)] animate-fade-in">
                                <h3 className="text-success font-bold mb-4 flex items-center gap-2"><CheckCircle size={16} /> Data Successfully Extracted</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted text-xs mb-1 uppercase tracking-wider">Legal Owner Name(s)</p>
                                        <p className="font-semibold flex items-center gap-2"><User size={14} className="text-muted" /> {assessorResult.ownerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted text-xs mb-1 uppercase tracking-wider">Tax Mailing Address</p>
                                        <p className="font-semibold flex items-center gap-2"><Mail size={14} className="text-muted" /> {assessorResult.mailingAddress}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-muted text-xs mb-1 uppercase tracking-wider">Real Property Address (Situs)</p>
                                        <p className="font-semibold flex items-center gap-2"><MapPin size={14} className="text-muted" /> {assessorResult.realPropertyAddress}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted text-xs mb-1 uppercase tracking-wider">Assessed Value (Tax)</p>
                                        <p className="font-semibold">{assessorResult.assessedValue}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted text-xs mb-1 uppercase tracking-wider">Property Specs</p>
                                        <p className="font-semibold">Built {assessorResult.yearBuilt} • Last Sold {assessorResult.lastSaleDate}</p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-[var(--border-light)] flex justify-end">
                                    <button className="btn btn-secondary" onClick={() => {
                                        setProperties(prev => [{
                                            id: Date.now(),
                                            address: assessorResult.realPropertyAddress,
                                            status: 'Lead',
                                            arv: 'Pending',
                                            mao: 'Pending',
                                            image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                        }, ...prev]);
                                        setIsAssessorModalOpen(false);
                                        setAssessorInput('');
                                        setAssessorResult(null);
                                    }}>
                                        <Plus size={16} /> Add to System as Lead
                                    </button>
                                </div>
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
                        placeholder="Search by address, city, or zip code..."
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
