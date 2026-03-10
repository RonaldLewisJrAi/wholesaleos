import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, FileText, CheckCircle, Clock, ShieldCheck, Download, Edit3, Loader2, AlertTriangle, CreditCard, X, Activity, User, UploadCloud, Calendar, Building, ExternalLink, Zap, Users, Send } from 'lucide-react';
import './DealRoom.css';
import { useAuth } from '../../contexts/useAuth';
import { dealDocumentService } from '../../services/dealDocumentService';
import { distributionService } from '../../services/distributionService'; // Added this import
import { dealBlastEngine } from '../../services/dealBlastEngine';
import { useAudioGuidance } from '../../hooks/useAudioGuidance';
import { voiceAssistant } from '../../services/voiceAssistantService';
import { assistantContextService } from '../../services/assistantContextService';
import { assistantInsightService } from '../../services/assistantInsightService';
import { assistantMessages } from '../../services/assistantVoiceTemplates';

const ProgressIndicator = ({ status }) => {
    const steps = [
        { key: 'Lead', label: 'Deal Requested' },
        { key: 'Generated', label: 'Assignment Generated' },
        { key: 'Signed', label: 'Assignment Signed' },
        { key: 'Escrow', label: 'Escrow Confirmed' },
        { key: 'Verified', label: 'Title Verified' },
        { key: 'ASSIGNED', label: 'Closed' }
    ];

    let currentIndex = -1;
    if (status === 'Lead') currentIndex = 0;
    if (status === 'Generated') currentIndex = 1;
    if (status === 'Signed') currentIndex = 2;
    if (status === 'Escrow') currentIndex = 3;
    if (status === 'Verified') currentIndex = 4;
    if (status === 'ASSIGNED') currentIndex = 5;

    return (
        <div className="progress-indicator">
            {steps.map((step, idx) => (
                <div key={idx} className={`progress-step ${idx <= currentIndex ? 'completed' : ''} ${idx === currentIndex ? 'active' : ''}`}>
                    <div className="step-circle">
                        {idx < currentIndex ? <CheckCircle size={14} /> : <span>{idx + 1}</span>}
                    </div>
                    <span className="step-label">{step.label}</span>
                </div>
            ))}
        </div>
    );
};

export const DealRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [deal, setDeal] = useState(null);

    const getTrustTier = (score = 50) => {
        if (score >= 90) return { label: 'Elite Closer', class: 'bg-success text-bg-darker' };
        if (score >= 75) return { label: 'Verified Pro', class: 'bg-primary text-bg-darker' };
        if (score >= 50) return { label: 'Active Trader', class: 'bg-secondary text-white' };
        if (score >= 25) return { label: 'New Participant', class: 'bg-warning text-bg-darker' };
        return { label: 'High Risk', class: 'bg-danger text-white' };
    };
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [signing, setSigning] = useState(false);

    // Reservation Modal State
    const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
    const [isReserving, setIsReserving] = useState(false);

    // Platform Events Timeline Tracker
    const [activityLog, setActivityLog] = useState([
        { id: '1', type: 'DEAL_CREATED', user: 'System', time: new Date(Date.now() - 86400000).toISOString(), note: 'Deal generated from property CRM' }
    ]);

    // Document Vault State (Phase 17)
    const [vaultDocuments, setVaultDocuments] = useState([]);
    const [uploadingDoc, setUploadingDoc] = useState(false);

    // Phase 20 - Priority Deal Blast State
    const [isPriorityBlast, setIsPriorityBlast] = useState(false);

    // Audio Guidance
    const { enabled: audioEnabled } = useAudioGuidance();
    const [hasSpokenDeal, setHasSpokenDeal] = useState(false);

    // Mock initial fetch if database is empty
    useEffect(() => {
        const fetchDeal = async () => {
            setLoading(true);
            try {
                // We use properties to mock the deals base data
                const { data } = await supabase.from('properties').select('*').eq('id', id).single();
                if (data) {
                    setDeal({ ...data, status: 'Lead' });
                } else {
                    // Fallback stub
                    setDeal({
                        id,
                        address: '349 Rayon Dr, Old Hickory, TN 37138',
                        arv: '$260,000',
                        mao: '$180,000',
                        rehab: '$45,000',
                        image: 'https://photos.zillowstatic.com/fp/8a5840d24e54e42ba7ed03c2faeb9e7a-p_e.jpg',
                        status: 'Lead',
                        closing_code: null,
                        signed_wholesaler: false,
                        signed_investor: false,
                        wholesaler: {
                            trust_score: 95 // Simulated fallback value
                        }
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDeal();
    }, [id]);

    useEffect(() => {
        if (audioEnabled && !loading && deal && !hasSpokenDeal) {
            const context = assistantContextService.getDealContext(deal, user?.primaryPersona || 'UNKNOWN');
            voiceAssistant.speak(assistantInsightService.getDealRoomSummary(context));
            setHasSpokenDeal(true);
        }
    }, [audioEnabled, loading, deal, hasSpokenDeal, user]);

    useEffect(() => {
        const fetchVaultDocs = async () => {
            const res = await dealDocumentService.getDealDocuments(id);
            if (res.success) {
                setVaultDocuments(res.documents);
            }
        };
        if (id) fetchVaultDocs();
    }, [id]);

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingDoc(true);
        const res = await dealDocumentService.uploadDealDocument(id, user?.id || 'simulated-wholesaler', file, type);

        if (res.success) {
            setVaultDocuments(prev => [res.document, ...prev]);
            setActivityLog(prev => [{ id: Date.now().toString(), type: 'PROOF_OF_CONTROL_UPLOADED', user: 'Wholesaler', time: new Date().toISOString(), note: `${type.replace(/_/g, ' ')} uploaded for verification.` }, ...prev]);
            alert("Document uploaded successfully and is pending admin verification.");
        } else {
            alert("Failed to upload document: " + (res.error || "Unknown Error"));
        }
        setUploadingDoc(false);
    };

    const handleGenerateAgreement = () => {
        setGenerating(true);
        setTimeout(() => {
            setDeal(prev => ({ ...prev, status: 'Generated', document_generated: true }));
            setActivityLog(prev => [{ id: Date.now().toString(), type: 'ASSIGNMENT_GENERATED', user: 'Wholesaler', time: new Date().toISOString(), note: 'Standard Assignment Agreement Created' }, ...prev]);
            setGenerating(false);
            alert("Assignment Agreement PDF automatically generated and attached to the deal.");
        }, 1500);
    };

    const handleSignAgreement = async (role) => {
        setSigning(true);
        setTimeout(() => {
            setDeal(prev => {
                const updated = { ...prev };
                if (role === 'wholesaler') {
                    updated.signed_wholesaler = true;
                    setActivityLog(logs => [{ id: Date.now().toString(), type: 'ASSIGNMENT_SIGNED', user: 'Wholesaler', time: new Date().toISOString(), note: 'Digital Signature captured.' }, ...logs]);
                }
                if (role === 'investor') {
                    updated.signed_investor = true;
                    setActivityLog(logs => [{ id: Date.now().toString(), type: 'ASSIGNMENT_SIGNED', user: 'Investor', time: new Date().toISOString(), note: 'Digital Signature captured.' }, ...logs]);
                }

                if (updated.signed_wholesaler && updated.signed_investor) {
                    updated.status = 'ASSIGNED';
                    updated.closing_code = `CS-${Math.floor(10000 + Math.random() * 90000)}`;
                    setActivityLog(logs => [
                        { id: Date.now().toString() + '2', type: 'TITLE_VERIFIED', user: 'System', time: new Date().toISOString(), note: `Generated Handover Code: ${updated.closing_code}` },
                        { id: Date.now().toString() + '1', type: 'ESCROW_CONFIRMED', user: 'Stripe Connect', time: new Date().toISOString(), note: 'Platform Escrow conditions fulfilled.' },
                        ...logs
                    ]);
                } else if (updated.signed_wholesaler || updated.signed_investor) {
                    updated.status = 'Signed';
                }
                return updated;
            });
            setSigning(false);
        }, 1200);
    };

    const handleReserveClick = () => {
        setIsReserveModalOpen(true);
    };

    const submitReservation = () => {
        setIsReserving(true);
        // Simulate Stripe Escrow processing
        setTimeout(() => {
            setDeal(prev => ({
                ...prev,
                status: 'RESERVED',
                reservation_user_id: user?.id || 'simulated-investor',
                reservation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }));
            setActivityLog(prev => [{ id: Date.now().toString(), type: 'DEAL_RESERVED', user: 'Investor', time: new Date().toISOString(), note: '$250 Deposit Secured (24h Exclusivity)' }, ...prev]);
            setIsReserving(false);
            setIsReserveModalOpen(false);
            if (audioEnabled) {
                voiceAssistant.speak(assistantMessages.dealReserved());
            }
            alert("Reservation Successful! $250 deposit secured. The Wholesaler has been notified to generate the Assignment Agreement.");
        }, 1500);
    };

    if (loading) return <div className="dealroom-loading"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    if (!deal) return <div className="dealroom-loading">Deal Not Found</div>;

    const bothSigned = deal.signed_wholesaler && deal.signed_investor;

    return (
        <div className="dealroom-container animate-fade-in">
            <div className="dealroom-header glass-panel">
                <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>← Back to Marketplace</button>
                <div className="header-title">
                    <h1>{deal.address}</h1>
                    <div className="deal-badges">
                        <span className="badge bg-primary">Deal Score: 88</span>

                        {/* Wholesaler Trust Badge */}
                        {(() => {
                            const trustScore = deal.wholesaler?.trust_score || deal.wholesaler_trust_score || 50;
                            const tier = getTrustTier(trustScore);
                            return (
                                <span className={`badge ${tier.class} font-bold px-3 py-1`} title={`Trust Score: ${trustScore}/100`}>
                                    <ShieldCheck size={14} className="inline mr-1" /> {tier.label}
                                </span>
                            );
                        })()}

                        {deal.status === 'ASSIGNED' && <span className="badge bg-success"><ShieldCheck size={14} /> Secured</span>}
                    </div>
                </div>
            </div>

            <div className="dealroom-layout">
                {/* LEFT COLUMN: Data & Documents */}
                <div className="dealroom-left">
                    <div className="deal-gallery" style={{ backgroundImage: `url(${deal.image})` }}></div>

                    <div className="deal-analytics glass-panel">
                        <h3>Financial Breakdown</h3>
                        <div className="analytics-grid">
                            <div className="stat-box">
                                <label>ARV</label>
                                <span>{deal.arv}</span>
                            </div>
                            <div className="stat-box highlight text-success">
                                <label>Asking Price</label>
                                <span>{deal.mao}</span>
                            </div>
                            <div className="stat-box">
                                <label>Est. Rehab</label>
                                <span>{deal.rehab || 'TBD'}</span>
                            </div>
                            <div className="stat-box">
                                <label>Est. ROI</label>
                                <span>22.4%</span>
                            </div>
                        </div>
                    </div>

                    <div className="document-vault glass-panel">
                        <div className="flex-between mb-4 border-b border-[var(--border-light)] pb-4">
                            <h3 className="m-0 flex items-center gap-2"><ShieldCheck size={18} className="text-primary" /> Proof of Control Vault</h3>
                            {(!user || user.primaryPersona === 'WHOLESALER') && (
                                <label className="btn btn-primary btn-sm m-0 cursor-pointer">
                                    {uploadingDoc ? <Loader2 className="animate-spin inline mr-2" size={14} /> : <UploadCloud className="inline mr-2" size={14} />}
                                    Upload Contract
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,image/*"
                                        disabled={uploadingDoc}
                                        onChange={(e) => handleFileUpload(e, 'PURCHASE_AGREEMENT')}
                                    />
                                </label>
                            )}
                        </div>

                        {vaultDocuments.length === 0 ? (
                            <div className="empty-docs">
                                <p className="text-muted text-sm m-0">No Proof of Control documents have been uploaded for this deal.</p>
                                {(!user || user.primaryPersona === 'WHOLESALER') && <p className="text-xs text-warning mt-2">Uploading verified contracts boosts your platform Trust Score.</p>}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {vaultDocuments.map((doc) => (
                                    <div key={doc.id} className="active-doc p-3 border border-[rgba(255,255,255,0.1)] rounded-lg bg-[rgba(0,0,0,0.2)] flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <FileText size={20} className={doc.status === 'VERIFIED' ? 'text-success' : doc.status === 'REJECTED' ? 'text-danger' : 'text-warning'} />
                                            <div>
                                                <p className="m-0 font-bold text-sm tracking-wide">{doc.document_type.replace(/_/g, ' ')}</p>
                                                <p className="m-0 text-xs text-muted font-mono">{new Date(doc.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`badge font-bold text-[10px] ${doc.status === 'VERIFIED' ? 'bg-success text-bg-darker' : doc.status === 'REJECTED' ? 'bg-danger text-white' : 'bg-warning text-bg-darker'}`}>
                                                {doc.status}
                                            </span>
                                            {doc.status === 'VERIFIED' && (
                                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="icon-btn text-muted hover:text-white" title="View Document">
                                                    <Download size={14} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="deal-documents glass-panel">
                        <h3><FileText size={18} className="text-primary mr-2 inline" /> Document Control & Assignment</h3>

                        <div className="document-list">
                            {!deal.document_generated ? (
                                <div className="empty-docs">
                                    <p className="text-muted text-sm mb-3">No Assignment Agreement has been generated for this deal yet.</p>
                                    <button className="btn btn-primary" onClick={handleGenerateAgreement} disabled={generating}>
                                        {generating ? <Loader2 className="animate-spin inline" size={16} /> : 'Generate Assignment Agreement'}
                                    </button>
                                </div>
                            ) : (
                                <div className="active-doc">
                                    <div className="doc-info">
                                        <FileText size={24} className="text-primary" />
                                        <div>
                                            <h4>Standard Assignment Agreement.pdf</h4>
                                            <span className="text-xs text-muted">Generated Today • 124KB</span>
                                        </div>
                                    </div>
                                    <button className="icon-btn" title="Download Document"><Download size={18} /></button>
                                </div>
                            )}
                        </div>

                        {deal.document_generated && (
                            <div className="signature-block mt-4">
                                <h4 className="text-sm font-bold uppercase tracking-wide text-muted mb-3">Digital Signatures Required</h4>
                                <div className="flex gap-4">
                                    <button
                                        className={`btn flex-1 ${deal.signed_wholesaler ? 'btn-success bg-opacity-20 text-success' : 'btn-secondary'}`}
                                        onClick={() => handleSignAgreement('wholesaler')}
                                        disabled={deal.signed_wholesaler || signing}
                                    >
                                        {deal.signed_wholesaler ? <><CheckCircle size={16} className="mr-2" /> Wholesaler Signed</> : <><Edit3 size={16} className="mr-2" /> Sign as Wholesaler</>}
                                    </button>
                                    <button
                                        className={`btn flex-1 ${deal.signed_investor ? 'btn-success bg-opacity-20 text-success' : 'btn-primary'}`}
                                        onClick={() => handleSignAgreement('investor')}
                                        disabled={deal.signed_investor || signing}
                                    >
                                        {deal.signed_investor ? <><CheckCircle size={16} className="mr-2" /> Investor Signed</> : <><Edit3 size={16} className="mr-2" /> Sign as Investor</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Sticky Transaction Panel */}
                <div className="dealroom-right">
                    <div className="transaction-panel glass-panel sticky top-24">
                        <h2 className="panel-title">Transaction Status</h2>

                        <div className="progress-wrapper mb-6">
                            <ProgressIndicator status={deal.status} />
                        </div>

                        <div className="status-metrics flex flex-col gap-4 mb-6">
                            <div className="status-row flex-between">
                                <span className="text-muted">Escrow Status:</span>
                                {deal.escrow_status === 'CONFIRMED' ? (
                                    <span className="text-success font-bold flex items-center gap-1"><CheckCircle size={14} /> Confirmed</span>
                                ) : bothSigned ? (
                                    <span className="text-warning flex items-center gap-1"><Clock size={14} /> Pending Transfer</span>
                                ) : (
                                    <span>Awaiting Signatures</span>
                                )}
                            </div>
                            <div className="status-row flex-between">
                                <span className="text-muted">Title Verification:</span>
                                {deal.title_status === 'CLEAR' ? (
                                    <span className="text-success font-bold flex items-center gap-1"><CheckCircle size={14} /> Clear</span>
                                ) : bothSigned ? (
                                    <span className="text-warning flex items-center gap-1"><Clock size={14} /> In Review</span>
                                ) : (
                                    <span>Awaiting Signatures</span>
                                )}
                            </div>
                        </div>

                        {deal.closing_code && (
                            <div className="closing-code-box bg-success bg-opacity-10 border border-success border-opacity-30 rounded-lg p-4 mb-6 text-center">
                                <div className="text-xs uppercase tracking-widest text-success mb-1 font-bold">Secure Closing Code</div>
                                <div className="text-2xl font-mono text-white tracking-[0.2em]">{deal.closing_code}</div>
                                <div className="text-[10px] text-muted mt-2">Provide this code to the Title Company.</div>
                            </div>
                        )}

                        <div className="panel-actions flex flex-col gap-3">
                            {(!user || user.primaryPersona === 'WHOLESALER') ? (
                                <>
                                    {deal.status === 'Lead' || deal.status === 'DRAFT' ? (
                                        <label className="flex items-center gap-2 cursor-pointer mb-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-all">
                                            <input
                                                type="checkbox"
                                                className="accent-yellow-500"
                                                checked={isPriorityBlast}
                                                onChange={(e) => setIsPriorityBlast(e.target.checked)}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-yellow-500 flex items-center gap-1"><Zap size={14} /> Priority Deal Blast</span>
                                                <span className="text-xs text-muted">Bypass basic filters and send immediate SMS alerts to Top Buyers. (Limits apply: 3/day)</span>
                                            </div>
                                        </label>
                                    ) : null}
                                    <button
                                        className={`btn w-full py-3 text-lg font-bold ${deal.status === 'Lead' || deal.status === 'DRAFT' ? 'btn-primary' : 'btn-secondary text-muted'}`}
                                        onClick={async () => {
                                            const hasVerified = vaultDocuments.some(d => d.status === 'VERIFIED');
                                            if (!hasVerified) {
                                                alert("🛑 OPERATIONAL BLOCK: You cannot publish this deal until a Proof of Control document has been VERIFIED by an Admin. Please upload your contract to the Document Vault to lift the publishing hold.");
                                                return;
                                            }

                                            // Update state visually
                                            setDeal(prev => ({ ...prev, status: 'Active' }));
                                            setActivityLog(prev => [{ id: Date.now().toString(), type: 'DEAL_PUBLISHED', user: 'Wholesaler', time: new Date().toISOString(), note: 'Deal approved and pushed to LIVE Marketplace.' }, ...prev]);

                                            try {
                                                const wholesalerId = deal.user_id || user?.id;
                                                let matchCount = 0;

                                                if (isPriorityBlast) {
                                                    // Phase 20: Expanded Audience Targeting
                                                    const result = await dealBlastEngine.executePriorityBlast({ ...deal, priority: true }, wholesalerId);
                                                    if (!result.success) {
                                                        alert(result.error);
                                                        return; // Abort push if quota violated
                                                    }
                                                    matchCount = result.count;
                                                } else {
                                                    // Phase 19: Standard Buy-Box Matchmaking
                                                    const result = await distributionService.distributeDeal(deal, wholesalerId);
                                                    matchCount = result.matches?.length || 0;
                                                }

                                                if (audioEnabled) {
                                                    voiceAssistant.speak(assistantMessages.dealPublished());
                                                }
                                                alert(`✅ Deal successfully pushed Live! Alert dispatched to ${matchCount} targeted Investors.`);
                                            } catch (e) {
                                                console.error("Matchmaking distribution failed silently.", e);
                                                alert("Deal successfully published to the live Marketplace!");
                                            }
                                        }}
                                        disabled={deal.status !== 'Lead' && deal.status !== 'DRAFT'}
                                    >
                                        {deal.status === 'Lead' || deal.status === 'DRAFT' ? 'Publish to Marketplace' : deal.status === 'RESERVED' ? 'Deal Lock Activated' : 'Deal is Active / Syndicated'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    className={`btn w-full py-3 text-lg font-bold ${deal.status === 'Active' || deal.status === 'Marketing' ? 'btn-primary' : 'btn-secondary text-muted'}`}
                                    onClick={handleReserveClick}
                                    disabled={deal.status !== 'Active' && deal.status !== 'Marketing'}
                                >
                                    {deal.status === 'Active' || deal.status === 'Marketing' ? 'Request Deal ($250 Deposit)' : deal.status === 'RESERVED' ? 'Deal Reserved (24h Lock)' : 'Verification Pending'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Activity Ledger inserted below the sticky panel */}
                    <div className="platform-events-timeline glass-panel mt-6">
                        <h2 className="panel-title flex items-center gap-2"><Activity size={18} className="text-primary" /> Activity Ledger</h2>
                        <div className="timeline-container">
                            {activityLog.map((log) => (
                                <div key={log.id} className="timeline-item">
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content border border-[var(--border-light)] rounded-lg p-3 bg-white bg-opacity-5">
                                        <div className="flex-between mb-1">
                                            <span className="text-xs font-bold text-primary">{log.type.replace(/_/g, ' ')}</span>
                                            <span className="text-[10px] text-muted">{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-xs text-muted mb-2">{log.note}</p>
                                        <div className="text-[10px] flex items-center gap-1 opacity-70">
                                            <User size={10} /> {log.user}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reservation Modal */}
            {isReserveModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '90%', padding: '32px', position: 'relative' }}>
                        <div className="flex-between mb-4 border-b border-[var(--border-light)] pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard size={24} className="text-primary" /> Secure Deal Reservation</h2>
                            <button className="icon-btn-small" onClick={() => setIsReserveModalOpen(false)} disabled={isReserving}><X size={20} /></button>
                        </div>

                        <div className="bg-warning bg-opacity-10 border border-warning border-opacity-20 rounded-lg p-4 mb-6 flex gap-3">
                            <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-bold text-warning mb-1">Non-Refundable $250 Deposit Required</p>
                                <p className="text-muted leading-relaxed">Locking this deal requires a <strong>$250 reservation deposit</strong> via Stripe. This grants you a 24-hour exclusive window to sign the Assignment Agreement.</p>
                            </div>
                        </div>

                        <ul className="text-sm text-muted mb-8 space-y-3 pl-2 border-l-2 border-primary border-opacity-30">
                            <li>• The deposit will apply toward your final WholesaleOS platform fee.</li>
                            <li>• If you back out without cause, the deposit goes to the Wholesaler.</li>
                            <li>• If the Wholesaler fails to provide the Assignment Agreement within 24 hours, you receive a full refund.</li>
                        </ul>

                        <div className="flex gap-4">
                            <button className="btn btn-secondary flex-1" onClick={() => setIsReserveModalOpen(false)} disabled={isReserving}>Cancel</button>
                            <button className="btn btn-primary flex-1 py-3 text-lg" onClick={submitReservation} disabled={isReserving}>
                                {isReserving ? <Loader2 className="animate-spin mx-auto" /> : 'Pay $250 & Lock Deal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DealRoom;
