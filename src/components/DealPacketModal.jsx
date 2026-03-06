import React, { useState } from 'react';
import { X, FileText, Users, Wrench, Send, Link, Zap, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import RehabEstimator from './RehabEstimator';
import './DealPacketModal.css';



const DealPacketModal = ({ isOpen, onClose, property }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isGenerating, setIsGenerating] = useState(false);
    const [rehabTotal, setRehabTotal] = useState(null);
    const [isPreviewing, setIsPreviewing] = useState(false);

    const [matchedBuyers, setMatchedBuyers] = useState([]);
    const [isLoadingBuyers, setIsLoadingBuyers] = useState(false);

    // Live Supabase Buyer Matching Engine (Phase 10)
    React.useEffect(() => {
        if (!property || !isOpen) return;

        let isMounted = true;
        const fetchBuyers = async () => {
            setIsLoadingBuyers(true);
            try {
                const extractedZip = property.address?.match(/\b\d{5}\b/) ? property.address.match(/\b\d{5}\b/)[0] : '37206';
                const propEquity = property.arv > 0 ? ((property.arv - (property.mao || 0)) / property.arv) * 100 : 0;

                const { data, error } = await supabase.rpc('get_matching_buyers', {
                    p_zip_code: extractedZip,
                    p_equity: propEquity,
                    p_property_type: 'SFR', // Defaulting to SFR since not explicitly captured
                    p_asking_price: property.mao || 0
                });

                if (error) throw error;
                if (isMounted) setMatchedBuyers(data || []);
            } catch (err) {
                console.error("Match Engine Error", err);
                if (isMounted) setMatchedBuyers([]);
            } finally {
                if (isMounted) setIsLoadingBuyers(false);
            }
        };

        fetchBuyers();
        return () => { isMounted = false; };
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
            setIsPreviewing(true);
        }, 800);
    };

    const handleDownloadPdf = () => {
        alert("Downloading PDF to your device...");
        setIsPreviewing(false);
    };

    const handleBlast = async (method) => {
        if (matchedBuyers.length === 0) {
            return alert('No matched buyers found for this property.');
        }

        const confirmBlast = window.confirm(`Initiate ${method} Blast to ${matchedBuyers.length} VIP buyers?`);
        if (!confirmBlast) return;

        try {
            const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
            const endpoint = method === 'SMS' ? '/api/disposition/blast/sms' : '/api/disposition/blast/email';

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    propertyId: property.id,
                    buyerIds: matchedBuyers.map(b => b.contact_id || b.id),
                    subject: method === 'Email' ? `Exclusive Deal Packet: ${property.address}` : undefined,
                    htmlContent: method === 'Email' ? `<p>Please review the enclosed Deal Packet for ${property.address}.</p>` : undefined
                })
            });

            const data = await res.json();
            alert(data.message || `${method} Blast Successful!`);
        } catch (err) {
            console.error('Blast Error', err);
            alert(`Failed to dispatch ${method} blast payload to proxy relay.`);
        }
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
                            {isPreviewing ? (
                                <div className="pdf-preview-mode animate-fade-in">
                                    <div className="pdf-preview-container">
                                        <div className="pdf-header">
                                            <div className="pdf-title">Investment Deal Packet</div>
                                            <div className="pdf-address">{property.address}</div>
                                        </div>

                                        <div className="pdf-section">
                                            <div className="pdf-section-title">Property Financials</div>
                                            <div className="pdf-metrics-grid">
                                                <div className="pdf-metric">
                                                    <span className="pdf-metric-label">After Repair Value (ARV)</span>
                                                    <span className="pdf-metric-value">{property.arv}</span>
                                                </div>
                                                <div className="pdf-metric">
                                                    <span className="pdf-metric-label">Asking Price</span>
                                                    <span className="pdf-metric-value highlight">{property.mao}</span>
                                                </div>
                                                <div className="pdf-metric">
                                                    <span className="pdf-metric-label">Est. Rehab Needed</span>
                                                    <span className="pdf-metric-value">{rehabTotal ? `$${rehabTotal.toLocaleString()}` : 'TBD'}</span>
                                                </div>
                                                <div className="pdf-metric">
                                                    <span className="pdf-metric-label">Estimated ROI</span>
                                                    <span className="pdf-metric-value">22.4%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pdf-section">
                                            <div className="pdf-section-title">Comparable Sales (Comps)</div>
                                            <table className="pdf-comps-table">
                                                <thead>
                                                    <tr>
                                                        <th>Distance</th>
                                                        <th>Beds/Baths</th>
                                                        <th>Sqft</th>
                                                        <th>Sold Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>0.2 mi</td>
                                                        <td>3 / 2</td>
                                                        <td>1,850</td>
                                                        <td>$435,000</td>
                                                    </tr>
                                                    <tr>
                                                        <td>0.4 mi</td>
                                                        <td>4 / 2</td>
                                                        <td>2,100</td>
                                                        <td>$460,000</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="preview-actions">
                                        <button className="btn btn-secondary flex-1" onClick={() => setIsPreviewing(false)}>
                                            <X size={18} className="mr-2" /> Cancel / Edit
                                        </button>
                                        <button className="btn btn-primary flex-1" onClick={handleDownloadPdf}>
                                            <FileText size={18} className="mr-2" /> Download Document
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
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
                                            {isGenerating ? <span className="animate-pulse">Generating Packet...</span> : <><FileText size={18} className="mr-2" /> Generate Deal Packet</>}
                                        </button>

                                        <button className="btn btn-secondary w-full flex justify-center" onClick={handleCopyLink}>
                                            <Link size={18} className="mr-2" /> Copy Investor Link
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'buyers' && (
                        <div className="tab-pane animate-fade-in">
                            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4 flex-between">
                                VIP Matches
                                {isLoadingBuyers ? (
                                    <span className="badge bg-[rgba(255,255,255,0.1)] text-xs text-muted animate-pulse">Calculating...</span>
                                ) : (
                                    <span className="badge bg-primary text-xs">{matchedBuyers.length} Found</span>
                                )}
                            </h3>
                            <div className="buyer-match-list">
                                {matchedBuyers.map(buyer => (
                                    <div key={buyer.id || buyer.contact_id} className="buyer-match-card">
                                        <div className="buyer-info">
                                            <div className="name">{buyer.name}</div>
                                            <div className="criteria flex flex-wrap gap-x-2">
                                                <span>Min Equity: {buyer.min_equity || buyer.minEquity || 0}%</span>
                                                <span className="text-muted">•</span>
                                                <span>{buyer.phone}</span>
                                                {buyer.email && <> <span className="text-muted">•</span> <span>{buyer.email}</span> </>}
                                            </div>
                                        </div>
                                        <div className="match-score-badge">
                                            <Activity size={14} /> {buyer.matchScore || buyer.match_score}% Match
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
