import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Mail, Phone, MapPin, X, UploadCloud, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDemoMode } from '../contexts/DemoModeContext';
import { calculateDealProbability, calculateBuyerDemandIndex } from '../lib/DealIntelligence';
import './CRM.css';

const mockContacts = [
    { id: 1, name: 'Sarah Jenkins', type: 'Cash Buyer', tags: ['VIP', 'Multi-family'], email: 'sarah.j@investments.com', phone: '(555) 123-4567', location: 'Austin, TX', lat: 30.2672, lng: -97.7431, tier: 'Tier 1' },
    { id: 2, name: 'Michael Chen', type: 'Lead (Motivated)', tags: ['Pre-foreclosure'], email: 'mchen88@gmail.com', phone: '(555) 987-6543', location: 'Dallas, TX', lat: 32.7767, lng: -96.7970, tier: 'N/A', arv: 350000, mortgage_balance: 180000, distress_score: 85, motivation_level: 5, timeline_to_sell: '0-30 days', last_contact_date: '2026-02-21' },
    { id: 3, name: 'Apex Properties LLC', type: 'Cash Buyer', tags: ['Fix & Flip', 'Commercial'], email: 'acquisitions@apexprop.net', phone: '(555) 456-7890', location: 'Houston, TX', lat: 29.7604, lng: -95.3698, tier: 'Tier 2' },
    { id: 4, name: 'David Rodriguez', type: 'Lead (Probate)', tags: ['High Equity'], email: 'd.rodriguez.estate@yahoo.com', phone: '(555) 222-3333', location: 'San Antonio, TX', lat: 29.4241, lng: -98.4936, tier: 'N/A', arv: 220000, mortgage_balance: 45000, distress_score: 40, motivation_level: 3, timeline_to_sell: '30-90 days', last_contact_date: '2026-02-15' },
    { id: 5, name: 'Emily Carter', type: 'Lead (Tired Landlord)', tags: ['Eviction'], email: 'emily.carter99@gmail.com', phone: '(555) 888-1111', location: 'Nashville, TN', lat: 36.1627, lng: -86.7816, tier: 'N/A', arv: 410000, mortgage_balance: 380000, distress_score: 95, motivation_level: 4, timeline_to_sell: '0-30 days', last_contact_date: '2026-02-20' },
];

// Lead Intelligence Logic
const calculateEquity = (contact) => {
    // Prefer the exact backend calculated value from the Supabase Trigger Engine
    if (contact.equity_percent !== undefined && contact.equity_percent !== null) {
        return Number(contact.equity_percent);
    }
    // Fallback for mocked or pre-migration data
    if (!contact.arv) return 0;
    return Math.max(0, ((contact.arv - contact.mortgage_balance) / contact.arv) * 100);
};

const calculateHeatScore = (contact) => {
    if (!contact.type?.includes('Lead')) return null;

    // Prefer the exact backend calculated value from the Supabase Trigger Engine
    if (contact.heat_score !== undefined && contact.heat_score !== null && contact.heat_score > 0) {
        return Number(contact.heat_score);
    }

    // Fallback client-side algorithm for mocked data
    let score = 0;

    // Distress (0-40 points)
    if (contact.distress_score) score += (contact.distress_score / 100) * 40;

    // Motivation (0-30 points)
    if (contact.motivation_level) score += (contact.motivation_level / 5) * 30;

    // Equity (0-20 points - sweet spot is 40-70%)
    const equityPct = calculateEquity(contact);
    if (equityPct >= 40 && equityPct <= 70) score += 20;
    else if (equityPct > 70) score += 15;
    else if (equityPct > 20) score += 5;

    // Timeline (0-10 points)
    if (contact.timeline_to_sell === '0-30 days') score += 10;
    else if (contact.timeline_to_sell === '30-90 days') score += 5;

    return Math.round(score);
};

const getNextBestAction = (heatScore, equityPct) => {
    if (heatScore >= 80 && equityPct >= 30) return { action: 'Draft Off-Market Offer', color: 'text-danger' };
    if (heatScore >= 60) return { action: 'Schedule Walkthrough', color: 'text-warning' };
    if (heatScore >= 40) return { action: 'Send Drip Campaign', color: 'text-primary' };
    return { action: 'Follow Up in 30 Days', color: 'text-muted' };
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(amount);
};

const calculateOffers = (arv) => {
    if (!arv) return null;
    return {
        aggressive: arv * 0.60,
        target: arv * 0.65,
        mao: arv * 0.70 // Typical 70% rule
    };
};

const CRM = () => {
    const { isDemoMode } = useDemoMode();
    const [activeTab, setActiveTab] = useState('All');
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState('Manual'); // 'Manual' or 'Import'
    const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', tags: '' });
    const [isUploading, setIsUploading] = useState(false);

    // Intelligence Panel State
    const [selectedLead, setSelectedLead] = useState(null);
    const [simulatedBdi, setSimulatedBdi] = useState(null);

    // Phase 28: Fetch BDI asynchronously when a lead is selected 
    useEffect(() => {
        if (selectedLead && selectedLead.type?.includes("Lead")) {
            // We use a mock zip code here for CRM contacts lacking full property location details
            calculateBuyerDemandIndex("37206", "SFR").then(bdi => setSimulatedBdi(bdi));
        } else {
            setSimulatedBdi(null);
        }
    }, [selectedLead]);

    useEffect(() => {
        const fetchContacts = async () => {
            setLoading(true);
            if (isDemoMode) {
                setContacts(mockContacts);
                setLoading(false);
                return;
            }

            if (!supabase) {
                console.warn('Live Mode active but Supabase is not configured. Contact list will be empty.');
                setContacts([]);
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('crm_contacts')
                    .select('*');

                if (error) throw error;

                if (data && data.length > 0) {
                    setContacts(data);
                } else {
                    setContacts([]);
                }
            } catch (error) {
                console.error('Error fetching CRM contacts:', error);
                setContacts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, [isDemoMode]);

    const handleOpenModal = () => {
        setIsAddModalOpen(true);
        setModalTab('Manual');
        setNewContact({ name: '', phone: '', email: '', tags: '' });
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
    };

    const submitManualContact = (e) => {
        e.preventDefault();
        if (!newContact.name) return;

        const contactData = {
            id: Date.now(),
            name: newContact.name,
            type: 'Lead (Manual)',
            tags: newContact.tags ? newContact.tags.split(',').map(t => t.trim()) : [],
            email: newContact.email || 'N/A',
            phone: newContact.phone || 'N/A',
            location: 'Unknown',
            tier: 'N/A'
        };

        setContacts(prev => [contactData, ...prev]);
        handleCloseModal();
    };

    const simulateFileUpload = async () => {
        setIsUploading(true);
        try {
            // Simulate reading a CSV file
            await new Promise(resolve => setTimeout(resolve, 2000));
            const batchContacts = [
                { id: Date.now() + 1, name: 'Hedge Fund Alpha', type: 'Cash Buyer', tags: ['Institutional', 'Bulk'], email: 'acquisitions@hf-alpha.com', phone: '(800) 555-0000', location: 'National', tier: 'Tier 1' },
                { id: Date.now() + 2, name: 'Zillow Offers', type: 'iBuyer', tags: ['Automated'], email: 'offers@zillow.com', phone: 'N/A', location: 'National', tier: 'Tier 2' },
                { id: Date.now() + 3, name: 'Local Flipper LLC', type: 'Cash Buyer', tags: ['Cosmetic Rehab'], email: 'deals@localflipper.com', phone: '(555) 999-8888', location: 'Regional', tier: 'Tier 3' }
            ];
            setContacts(prev => [...batchContacts, ...prev]);
            handleCloseModal();
        } finally {
            setIsUploading(false);
        }
    };

    // Simple client-side filtering logic for the tabs
    const filteredContacts = contacts.filter(contact => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Cash Buyers' && contact.type.includes('Buyer')) return true;
        if (activeTab === 'Motivated Leads' && contact.type.includes('Lead')) return true;
        if (activeTab === 'VIP Investors' && contact.tags && contact.tags.includes('VIP')) return true;
        return false;
    }).sort((a, b) => {
        // Default sort: highest heat score first for leads
        const scoreA = calculateHeatScore(a) || 0;
        const scoreB = calculateHeatScore(b) || 0;
        return scoreB - scoreA;
    });

    return (
        <div className="crm-container animate-fade-in">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Leads & Buyers (CRM)</h1>
                    <p className="page-description">Manage your investor network, inbound leads, and communication history.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary"><Filter size={16} /> Filter</button>
                    <button className="btn btn-primary" onClick={handleOpenModal}><UserPlus size={16} /> Add Contact</button>
                </div>
            </div>

            <div className="crm-toolbar glass-panel" style={{ marginBottom: '24px' }}>
                <div className="tabs">
                    {['All', 'Cash Buyers', 'Motivated Leads', 'VIP Investors'].map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search contacts..." className="search-input" />
                </div>
            </div>


            <div className="card table-card glass-panel">
                <div className="table-responsive">
                    <table className="crm-table">
                        <thead>
                            <tr>
                                <th>Name / Entity</th>
                                <th>Type</th>
                                <th>Contact Info</th>
                                <th>Target Market</th>
                                <th>Tags</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-4 text-muted">Loading contacts...</td></tr>
                            ) : (
                                filteredContacts.map(contact => (
                                    <tr key={contact.id}>
                                        <td>
                                            <div className="contact-name-cell">
                                                <div className="contact-avatar">{contact.name ? contact.name.charAt(0) : '?'}</div>
                                                <div>
                                                    <div className="contact-name flex items-center gap-2">
                                                        {contact.name}
                                                        {calculateHeatScore(contact) >= 80 && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span></span>}
                                                    </div>
                                                    {contact.tier && contact.tier !== 'N/A' && <div className="contact-tier">{contact.tier}</div>}
                                                    {contact.type?.includes('Lead') && (
                                                        <div className="text-[10px] text-muted mt-0.5">
                                                            Heat: <span className={calculateHeatScore(contact) >= 70 ? 'text-danger font-bold' : 'text-warning font-bold'}>{calculateHeatScore(contact)}</span> / 100
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`type-badge ${contact.type && contact.type.includes('Buyer') ? 'bg-primary' : 'bg-warning'}`}>
                                                {contact.type || 'Unknown'}
                                            </span>
                                            {contact.type?.includes('Lead') && (
                                                <div className={`text-[10px] font-medium mt-1 ${calculateEquity(contact) >= 50 ? 'text-success' : 'text-danger'}`}>
                                                    {calculateEquity(contact).toFixed(0)}% Est. Equity
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="contact-info-cell">
                                                <span><Mail size={12} /> {contact.email}</span>
                                                <span><Phone size={12} /> {contact.phone}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {contact.type?.includes('Lead') ? (
                                                <div className="flex flex-col gap-1 text-xs">
                                                    <span className="font-semibold">Next Action:</span>
                                                    <span className={`${getNextBestAction(calculateHeatScore(contact), calculateEquity(contact)).color} font-medium`}>
                                                        {getNextBestAction(calculateHeatScore(contact), calculateEquity(contact)).action}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="location-text"><MapPin size={12} /> {contact.location}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="contact-tags">
                                                {contact.tags && contact.tags.map(tag => (
                                                    <span key={tag} className="tag">{tag}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLead(contact)}>Profile</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Contact Modal */}
            {
                isAddModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '90%' }}>
                            <div className="modal-header flex-between" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Add New Contacts</h2>
                                <button className="icon-btn-small" onClick={handleCloseModal}><X size={20} /></button>
                            </div>

                            <div className="tabs mb-4" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)' }}>
                                <button
                                    className={`tab-btn ${modalTab === 'Manual' ? 'active' : ''}`}
                                    onClick={() => setModalTab('Manual')}
                                    style={{ borderRadius: '4px 4px 0 0', padding: '8px 16px', borderBottom: modalTab === 'Manual' ? '2px solid var(--accent-primary)' : 'none' }}
                                >
                                    Manual Entry
                                </button>
                                <button
                                    className={`tab-btn ${modalTab === 'Import' ? 'active' : ''}`}
                                    onClick={() => setModalTab('Import')}
                                    style={{ borderRadius: '4px 4px 0 0', padding: '8px 16px', borderBottom: modalTab === 'Import' ? '2px solid var(--accent-primary)' : 'none' }}
                                >
                                    Import File (.csv)
                                </button>
                            </div>

                            {modalTab === 'Manual' ? (
                                <form onSubmit={submitManualContact} className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Full Name / Entity</label>
                                        <input type="text" className="form-input" required placeholder="e.g. Acme Investments LLC" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white' }} />
                                    </div>
                                    <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Email Address</label>
                                            <input type="email" className="form-input" placeholder="contact@example.com" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white' }} />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone Number</label>
                                            <input type="tel" className="form-input" placeholder="(555) 000-0000" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white' }} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tags (comma isolated)</label>
                                        <input type="text" className="form-input" placeholder="e.g. VIP, Multi-family, Fix & Flip" value={newContact.tags} onChange={e => setNewContact({ ...newContact, tags: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white' }} />
                                    </div>
                                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" disabled={!newContact.name}>Save Contact</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="import-tab" style={{ textAlign: 'center', padding: '24px 0' }}>
                                    <div className="upload-dropzone" style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '40px 20px', background: 'var(--bg-primary)', cursor: 'pointer', marginBottom: '24px' }} onClick={simulateFileUpload}>
                                        <UploadCloud size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
                                        <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Click to Upload .CSV Spreadsheet</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Drag and drop your exported contacts file here</p>
                                    </div>
                                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                        <button type="button" className="btn btn-primary" onClick={simulateFileUpload} disabled={isUploading}>
                                            {isUploading ? 'Importing...' : 'Simulate Import'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* AI Intelligence Profile Side Panel */}
            <div className={`intelligence-panel-overlay ${selectedLead ? 'open' : ''}`} onClick={() => setSelectedLead(null)}></div>
            <div className={`intelligence-panel ${selectedLead ? 'open' : ''}`}>
                {selectedLead && (
                    <>
                        <div className="panel-header">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {selectedLead.name}
                                    {selectedLead.tier && selectedLead.tier !== 'N/A' && <span className="badge bg-primary text-xs ml-2">{selectedLead.tier}</span>}
                                </h2>
                                <p className="text-sm text-muted">{selectedLead.type}</p>
                            </div>
                            <button className="icon-btn-small" onClick={() => setSelectedLead(null)}><X size={20} /></button>
                        </div>

                        <div className="panel-content">
                            {/* Contact Info Block */}
                            <div className="metric-box">
                                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Contact Details</h3>
                                <div className="space-y-2 text-sm text-gray-300">
                                    <p className="flex items-center gap-2"><Mail size={14} className="text-muted" /> {selectedLead.email}</p>
                                    <p className="flex items-center gap-2"><Phone size={14} className="text-muted" /> {selectedLead.phone}</p>
                                    <p className="flex items-center gap-2"><MapPin size={14} className="text-muted" /> {selectedLead.location}</p>
                                </div>
                                {selectedLead.tags && selectedLead.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {selectedLead.tags.map(tag => <span key={tag} className="tag text-xs">{tag}</span>)}
                                    </div>
                                )}
                            </div>

                            {/* Intelligence Engine Section (Only for Leads) */}
                            {selectedLead.type?.includes('Lead') && selectedLead.arv ? (
                                <>
                                    {/* Heat Score Diagnostic */}
                                    <div className="metric-box">
                                        <div className="flex-between mb-2">
                                            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Acquisition Intelligence</h3>
                                            <span className={`badge ${calculateHeatScore(selectedLead) >= 70 ? 'bg-danger text-white border-danger' : 'bg-warning text-white border-warning'}`}>
                                                Lead Heat: {calculateHeatScore(selectedLead)}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {/* Phase 28: Render Predictive Deal Probability */}
                                            {(() => {
                                                const eqPct = calculateEquity(selectedLead);
                                                const probScore = calculateDealProbability(eqPct, selectedLead.motivation_level || 3, simulatedBdi ? simulatedBdi.matches : 0);

                                                let probColor = "text-danger";
                                                if (probScore > 75) probColor = "text-success";
                                                else if (probScore > 50) probColor = "text-warning";

                                                return (
                                                    <div className="mb-3 p-3 bg-[rgba(0,0,0,0.3)] rounded border border-warning/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                                                        <div className="flex-between mb-2">
                                                            <span className="text-xs text-muted flex items-center gap-1"><Target size={12} /> AI Deal Probability</span>
                                                            <span className={`text-sm font-bold ${probColor}`}>{probScore}%</span>
                                                        </div>
                                                        <div className="bg-warning/10 text-warning text-[10px] px-2 py-1 rounded border border-warning/20 text-center font-mono">
                                                            ⚠️ BETA INTELLIGENCE: Under 50 Closed Deals Mapped. Estimates may fluctuate.
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            <div>
                                                <div className="flex-between text-xs mb-1">
                                                    <span className="text-gray-400">Distress Level</span>
                                                    <span>{selectedLead.distress_score}/100</span>
                                                </div>
                                                <div className="w-full bg-[rgba(255,255,255,0.1)] rounded-full h-1.5">
                                                    <div className="bg-danger h-1.5 rounded-full" style={{ width: `${selectedLead.distress_score || 0}%` }}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex-between text-xs mb-1">
                                                    <span className="text-gray-400">Equity Position</span>
                                                    <span className="text-success">{calculateEquity(selectedLead).toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-[rgba(255,255,255,0.1)] rounded-full h-1.5">
                                                    <div className="bg-success h-1.5 rounded-full" style={{ width: `${calculateEquity(selectedLead)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Suggested Offer Range */}
                                    <div className="metric-box border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 pl-2">AI Offer Analysis (70% Rule)</h3>

                                        <div className="grid grid-cols-2 gap-4 mb-4 pl-2">
                                            <div>
                                                <p className="text-xs text-muted mb-0.5">Estimated ARV</p>
                                                <p className="font-bold text-white text-lg">{formatCurrency(selectedLead.arv)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted mb-0.5">Est. Mortgage Bal.</p>
                                                <p className="font-bold text-white text-lg">{formatCurrency(selectedLead.mortgage_balance)}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pl-2">
                                            <div className="offer-tier aggressive">
                                                <div>
                                                    <p className="font-bold text-success">{formatCurrency(calculateOffers(selectedLead.arv).aggressive)}</p>
                                                    <p className="text-[10px] text-muted font-medium uppercase mt-0.5">Aggressive Offer (60%)</p>
                                                </div>
                                                <button className="btn btn-secondary btn-sm bg-[rgba(16,185,129,0.1)] hover:bg-[rgba(16,185,129,0.2)] text-success border-0" onClick={() => alert(`Aggressive Offer of ${formatCurrency(calculateOffers(selectedLead.arv).aggressive)} selected for Deal Packet.`)}>Select</button>
                                            </div>
                                            <div className="offer-tier target">
                                                <div>
                                                    <p className="font-bold text-warning">{formatCurrency(calculateOffers(selectedLead.arv).target)}</p>
                                                    <p className="text-[10px] text-muted font-medium uppercase mt-0.5">Target Offer (65%)</p>
                                                </div>
                                                <button className="btn btn-secondary btn-sm bg-[rgba(245,158,11,0.1)] hover:bg-[rgba(245,158,11,0.2)] text-warning border-0" onClick={() => alert(`Target Offer of ${formatCurrency(calculateOffers(selectedLead.arv).target)} selected for Deal Packet.`)}>Select</button>
                                            </div>
                                            <div className="offer-tier max">
                                                <div>
                                                    <p className="font-bold text-danger">{formatCurrency(calculateOffers(selectedLead.arv).mao)}</p>
                                                    <p className="text-[10px] text-muted font-medium uppercase mt-0.5">MAO Limit (70%)</p>
                                                </div>
                                                <button className="btn btn-secondary btn-sm bg-[rgba(239,68,68,0.1)] hover:bg-[rgba(239,68,68,0.2)] text-danger border-0" onClick={() => alert(`Maximum Allowable Offer limit logged at ${formatCurrency(calculateOffers(selectedLead.arv).mao)}.`)}>Select</button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6 text-muted border border-dashed border-[var(--border-light)] rounded-lg">
                                    <p className="text-sm">No property data available to calculate AI Offer range for this contact.</p>
                                </div>
                            )}

                            {/* Actions Group */}
                            <div className="mt-auto flex flex-col gap-2 pt-4">
                                {selectedLead.type?.includes('Lead') && (
                                    <button className="btn btn-primary w-full justify-center" onClick={() => alert("Draft Contract Generation initialized. Please wait...")}>
                                        Generate Draft Contract
                                    </button>
                                )}
                                <div className="flex gap-2">
                                    <button className="btn btn-secondary flex-1 justify-center" onClick={() => alert("Note Editor opened.")}>Add Note</button>
                                    <button className="btn btn-secondary flex-1 justify-center" onClick={() => alert("Email Composer opened.")}>Send Email</button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

        </div >
    );
};

export default CRM;
