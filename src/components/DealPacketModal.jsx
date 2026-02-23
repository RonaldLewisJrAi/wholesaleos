import React, { useState } from 'react';
import { X, FileText, Users, Wrench, Send, Link, Zap, Activity } from 'lucide-react';
import RehabEstimator from './RehabEstimator';
import './DealPacketModal.css';

// Mock Cash Buyer Database for the Matching Engine
const mockCashBuyers = [
    { id: 1, name: 'Apex Capital Funding', zipCodes: ['78701', '78704', 'TX'], minEquity: 30, phone: '555-0101' },
    { id: 2, name: 'Sunbelt Property Group', zipCodes: ['Dallas', 'Houston', 'TX'], minEquity: 25, phone: '555-0202' },
    { id: 3, name: 'Lone Star Rehabbers', zipCodes: ['Austin', 'San Antonio'], minEquity: 20, phone: '555-0303' },
    { id: 4, name: 'J&M Development Co.', zipCodes: ['Any'], minEquity: 40, phone: '555-0404' }
];

const DealPacketModal = ({ isOpen, onClose, property }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isGenerating, setIsGenerating] = useState(false);
    const [rehabTotal, setRehabTotal] = useState(null);

    // Simulated Buyer Matching Engine (Phase 10)
    const matchedBuyers = React.useMemo(() => {
        if (!property || !isOpen) return [];

        // In a real app, this queries the backend buyer_criteria table via Supabase RPC
        // Using property.id and buyer.id to generate deterministic mock scores (fixes impure function lint)
        return mockCashBuyers.map(buyer => {
            const score = 70 + ((property.id * buyer.id * 17) % 30); // Pseudo-random 70-99
            return { ...buyer, matchScore: score };
        }).sort((a, b) => b.matchScore - a.matchScore);
    }, [property, isOpen]);

    if (!property) return null;

    const handleCopyLink = () => {
        // navigator.clipboard.writeText(`https://wholesaleos.com/deal/${property.id}`);
        alert(`Investor view-only link copied: wholesaleos.com/deal/${property.id}`);
    };

    const handleGeneratePacket = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            const rehabStr = rehabTotal ? `\n- Est. Rehab: $${rehabTotal.toLocaleString()}` : '';
            alert("Deal Packet PDF Successfully Generated!\n\nContains:\n- Comps Summary\n- ARV Justification" + rehabStr);
        }, 2000);
    };

    const handleBlast = (method) => {
        alert(`${method} Blast Initiated.\nSending packet to ${matchedBuyers.length} VIP matched buyers...`);
    };

    const handleRehabSave = (total) => {
        setRehabTotal(total);
        // Switch back to overview tab after saving
        setActiveTab('overview');
    };

    return (
        <>
            {isOpen && <div className="modal-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }} />}
            <div className={`modal-slide-pane ${isOpen ? 'open' : ''}`}>
                <div className="modal-slide-header">
                    <div>
                        <h2 className="modal-slide-title"><Zap className="text-primary" size={24} /> Disposition Engine</h2>
                        <p className="modal-slide-subtitle">{property.address}</p>
                    </div>
                    <button className="icon-btn-small" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-slide-body">
                    <div className="disposition-tabs">
                        <button className={`disposition-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                        <button className={`disposition-tab ${activeTab === 'buyers' ? 'active' : ''}`} onClick={() => setActiveTab('buyers')}>Buyer Matches</button>
                        <button className={`disposition-tab ${activeTab === 'rehab' ? 'active' : ''}`} onClick={() => setActiveTab('rehab')}>Rehab</button>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="tab-pane animate-fade-in">
                            <div className="deal-hero-stats">
                                <div className="deal-stat-box">
                                    <div className="stat-label">ARV</div>
                                    <div className="stat-val">{property.arv}</div>
                                </div>
                                <div className="deal-stat-box border-success">
                                    <div className="stat-label text-success">Requested Price</div>
                                    <div className="stat-val text-success">{property.mao}</div>
                                </div>
                                {rehabTotal !== null && (
                                    <div className="deal-stat-box border-warning mt-4 col-span-2">
                                        <div className="stat-label text-warning flex items-center justify-center gap-2"><Wrench size={16} /> Est. Rehab Cost</div>
                                        <div className="stat-val text-warning text-center">${rehabTotal.toLocaleString()}</div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Deal Assets</h3>

                                <button className="btn btn-primary w-full flex justify-center py-3" onClick={handleGeneratePacket} disabled={isGenerating}>
                                    {isGenerating ? <span className="animate-pulse">Generating Packet...</span> : <><FileText size={18} /> Generate Deal Packet</>}
                                </button>

                                <button className="btn btn-secondary w-full flex justify-center" onClick={handleCopyLink}>
                                    <Link size={18} /> Copy Investor Link
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'buyers' && (
                        <div className="tab-pane animate-fade-in">
                            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4 flex-between">
                                VIP Matches <span className="badge bg-primary text-xs">{matchedBuyers.length} Found</span>
                            </h3>
                            <div className="buyer-match-list">
                                {matchedBuyers.map(buyer => (
                                    <div key={buyer.id} className="buyer-match-card">
                                        <div className="buyer-info">
                                            <div className="name">{buyer.name}</div>
                                            <div className="criteria">Min Equity: {buyer.minEquity}% • Prefers: {buyer.zipCodes[0]}</div>
                                        </div>
                                        <div className="match-score-badge">
                                            <Activity size={14} /> {buyer.matchScore}% Match
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'rehab' && (
                        <div className="tab-pane animate-fade-in">
                            <RehabEstimator property={property} onSaveComplete={handleRehabSave} />
                        </div>
                    )}
                </div>

                <div className="modal-action-footer">
                    <p className="text-xs text-muted text-center mb-2 uppercase tracking-wide">Disposition Blast Triggers</p>
                    <div className="blast-controls">
                        <button className="btn border-primary text-primary hover:bg-primary hover:text-white" onClick={() => handleBlast('SMS')}>
                            <Send size={16} /> SMS Blast
                        </button>
                        <button className="btn btn-primary" onClick={() => handleBlast('Email')}>
                            <MailIcon /> Email Blast
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

// Temporary inline icon for blast button
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;

export default DealPacketModal;
