import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, FileText, CheckCircle, Clock, ShieldCheck, Download, Edit3, Loader2, AlertTriangle, CreditCard, X, Activity, User, UploadCloud, Calendar, Building, ExternalLink, Zap, Users, Send, Target, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { dealDocumentService } from '../../services/dealDocumentService';
import { distributionService } from '../../services/distributionService';
import { dealBlastEngine } from '../../services/dealBlastEngine';
import { calculateDealScore, calculateLiquiditySignal, calculateCloseProbability } from '../../services/dealIntelligenceEngine';

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
        <div className="flex flex-col relative pl-4 border-l border-blue-900/40 ml-2 mb-2 font-mono">
            {steps.map((step, idx) => {
                const isCompleted = idx < currentIndex;
                const isActive = idx === currentIndex;

                let textColor = 'text-gray-500';
                let dotClass = 'bg-[#050816] border-blue-900/40';

                if (isCompleted) {
                    textColor = 'text-emerald-400';
                    dotClass = 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
                } else if (isActive) {
                    textColor = 'text-blue-400 font-bold';
                    dotClass = 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(78,123,255,0.6)]';
                }

                return (
                    <div key={idx} className={`flex items-center gap-4 py-3 relative z-10 ${isActive ? 'bg-blue-900/10 rounded-r-lg border-l-2 border-blue-500 -ml-[1px]' : ''}`}>
                        <div className={`absolute -left-[22px] w-3 h-3 rounded-full border-2 ${dotClass}`}></div>
                        <span className={`text-xs uppercase tracking-widest ${textColor}`}>{step.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export const DealRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [deal, setDeal] = useState(null);

    const getTrustTier = (score = 50) => {
        if (score >= 90) return { label: 'Elite Closer', class: 'text-emerald-400 border-emerald-500/30 bg-emerald-900/10' };
        if (score >= 75) return { label: 'Verified Pro', class: 'text-blue-400 border-blue-500/30 bg-blue-900/10' };
        if (score >= 50) return { label: 'Active Trader', class: 'text-gray-300 border-gray-600/30 bg-gray-800/20' };
        if (score >= 25) return { label: 'New Participant', class: 'text-amber-400 border-amber-500/30 bg-amber-900/10' };
        return { label: 'High Risk', class: 'text-red-400 border-red-500/30 bg-red-900/10' };
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

    // Document Vault State
    const [vaultDocuments, setVaultDocuments] = useState([]);
    const [uploadingDoc, setUploadingDoc] = useState(false);

    // Priority Deal Blast State
    const [isPriorityBlast, setIsPriorityBlast] = useState(false);

    useEffect(() => {
        const fetchDeal = async () => {
            setLoading(true);
            try {
                const { data } = await supabase.from('properties').select('*').eq('id', id).single();
                if (data) {
                    setDeal({ ...data, status: 'Lead', score: 88 });
                } else {
                    setDeal({
                        id,
                        address: '349 Rayon Dr, Old Hickory, TN 37138',
                        arv: '$260,000',
                        mao: '$180,000',
                        rehab: '$45,000',
                        score: 88,
                        image: 'https://photos.zillowstatic.com/fp/8a5840d24e54e42ba7ed03c2faeb9e7a-p_e.jpg',
                        status: 'Lead',
                        closing_code: null,
                        signed_wholesaler: false,
                        signed_investor: false,
                        wholesaler: {
                            trust_score: 95
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
        }, 1500);
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
    );

    if (!deal) return <div className="text-center text-white p-6">Deal Not Found</div>;

    const bothSigned = deal.signed_wholesaler && deal.signed_investor;

    // AI Intelligence metrics based on deal state
    const parseCurrency = (str) => parseInt(String(str).replace(/[^0-9]/g, '') || '0', 10);
    const intelligenceData = {
        arv: parseCurrency(deal.arv),
        purchase_price: parseCurrency(deal.mao),
        repairs: parseCurrency(deal.rehab),
        buyerDemand: deal.status === 'Active' ? 8 : 4,
        escrowStatus: (deal.status === 'ASSIGNED' || deal.escrow_status === 'CONFIRMED') ? 'ACTIVE' : 'PENDING',
        titleVerified: deal.title_status === 'CLEAR'
    };

    const aiScore = calculateDealScore(intelligenceData);
    const { label: aiLiquidity } = calculateLiquiditySignal(intelligenceData);
    const closeProb = calculateCloseProbability(intelligenceData);

    return (
        <div className="p-6 max-w-[1400px] mx-auto animate-fade-in relative">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 border-b border-blue-900/40 pb-6 relative overflow-hidden">
                <button
                    className="self-start flex items-center gap-1 text-sm text-blue-400 hover:text-white transition-colors"
                    onClick={() => navigate(-1)}
                >
                    <ChevronLeft size={16} /> Back to Grid
                </button>

                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{deal.address}</h1>
                        <div className="flex gap-3 items-center">
                            <span className="px-3 py-1 rounded border border-blue-500/30 bg-blue-900/10 text-blue-400 text-xs font-mono font-bold tracking-widest flex items-center gap-1">
                                <Activity size={12} />
                                SCORE: {aiScore}
                            </span>

                            {(() => {
                                const trustScore = deal.wholesaler?.trust_score || deal.wholesaler_trust_score || 50;
                                const tier = getTrustTier(trustScore);
                                return (
                                    <span className={`px-3 py-1 rounded border text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-1 ${tier.class}`} title={`Trust Score: ${trustScore}/100`}>
                                        <ShieldCheck size={12} className="inline mr-1" /> {tier.label}
                                    </span>
                                );
                            })()}

                            {deal.status === 'ASSIGNED' && (
                                <span className="px-3 py-1 rounded border border-emerald-500/30 bg-emerald-900/10 text-emerald-400 text-xs font-mono font-bold tracking-widest flex items-center gap-1">
                                    <CheckCircle size={12} /> SECURED
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* LEFT COLUMN: Data & Documents */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div
                        className="h-80 rounded-xl bg-cover bg-center border border-blue-900/40 relative shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                        style={{ backgroundImage: `url(${deal.image})` }}
                    >
                        <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay rounded-xl pointer-events-none"></div>
                    </div>

                    {/* Intelligence Summary */}
                    <div className="glass-card p-6 group transition-all duration-300 hover:border-blue-500/50 hover:shadow-[0_0_25px_rgba(78,123,255,0.15)]">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-blue-900/30 pb-2">
                            <Target className="text-blue-400" size={18} /> Deal Intelligence
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black/40 border border-blue-900/40 rounded-lg p-4 transition-colors group-hover:border-blue-500/30">
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1 block">ARV</label>
                                <span className="text-xl font-mono font-bold text-white">{deal.arv}</span>
                            </div>
                            <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-lg p-4 shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-colors transform group-hover:-translate-y-0.5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                                <label className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono mb-1 block relative z-10">Asking Price</label>
                                <span className="text-2xl font-mono font-bold text-emerald-400 relative z-10">{deal.mao}</span>
                            </div>
                            <div className="bg-black/40 border border-blue-900/40 rounded-lg p-4 transition-colors group-hover:border-blue-500/30">
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1 block">Est. Rehab</label>
                                <span className="text-xl font-mono font-bold text-amber-400">{deal.rehab || 'TBD'}</span>
                            </div>
                            <div className="bg-black/40 border border-blue-900/40 rounded-lg p-4 transition-colors group-hover:border-blue-500/30">
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1 block">Est. ROI</label>
                                <span className="text-xl font-mono font-bold text-blue-400">22.4%</span>
                            </div>
                        </div>
                    </div>

                    {/* Document Vault */}
                    <div className="glass-card p-6 group transition-all duration-300 hover:border-blue-500/50">
                        <div className="flex justify-between items-center mb-4 border-b border-blue-900/30 pb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 m-0">
                                <ShieldCheck size={18} className="text-emerald-400" /> Proof of Control Vault
                            </h3>
                            {(!user || user.primaryPersona === 'WHOLESALER') && (
                                <label className="cursor-pointer bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/40 text-blue-300 hover:text-white px-4 py-2 rounded-lg text-xs font-mono tracking-widest transition-all shadow-[0_0_15px_rgba(78,123,255,0.2)] flex items-center gap-2">
                                    {uploadingDoc ? <Loader2 className="animate-spin" size={14} /> : <UploadCloud size={14} />}
                                    UPLOAD CONTRACT
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
                            <div className="p-8 text-center bg-black/40 border border-dashed border-blue-900/50 rounded-lg">
                                <p className="text-gray-500 text-sm m-0 font-mono">No Proof of Control documents uploaded.</p>
                                {(!user || user.primaryPersona === 'WHOLESALER') && <p className="text-[10px] text-amber-400 tracking-widest font-mono uppercase mt-2">Uploading verified contracts boosts platform Trust Score.</p>}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {vaultDocuments.map((doc) => (
                                    <div key={doc.id} className="p-4 border border-blue-900/40 rounded-lg bg-[#050816]/60 flex justify-between items-center hover:border-blue-500/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <FileText size={20} className={doc.status === 'VERIFIED' ? 'text-emerald-400' : doc.status === 'REJECTED' ? 'text-red-400' : 'text-amber-400'} />
                                            <div>
                                                <p className="m-0 font-bold text-white text-sm tracking-wide">{doc.document_type.replace(/_/g, ' ')}</p>
                                                <p className="m-0 text-[10px] text-gray-500 font-mono tracking-widest">{new Date(doc.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold tracking-widest uppercase ${doc.status === 'VERIFIED' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/30' : doc.status === 'REJECTED' ? 'bg-red-900/20 text-red-400 border border-red-500/30' : 'bg-amber-900/20 text-amber-400 border border-amber-500/30'}`}>
                                                {doc.status}
                                            </span>
                                            {doc.status === 'VERIFIED' && (
                                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors" title="View Document">
                                                    <Download size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Document Control */}
                    <div className="glass-card p-6 group transition-all duration-300 hover:border-blue-500/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-blue-900/30 pb-2">
                            <FileText size={18} className="text-amber-400" /> Document Control & Assignment
                        </h3>

                        <div className="mb-6">
                            {!deal.document_generated ? (
                                <div className="p-8 text-center bg-black/40 border border-dashed border-blue-900/50 rounded-lg">
                                    <p className="text-gray-500 text-sm mb-4 font-mono">No Assignment Agreement generated.</p>
                                    <button
                                        className="bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/40 text-blue-300 hover:text-white px-6 py-2 rounded-lg text-sm font-mono tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(78,123,255,0.2)] flex items-center gap-2 mx-auto"
                                        onClick={handleGenerateAgreement}
                                        disabled={generating}
                                    >
                                        {generating ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                                        Generate Assignment Agreement
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 border border-blue-900/40 rounded-lg bg-[#050816]/60 flex justify-between items-center hover:border-blue-500/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <FileText size={24} className="text-blue-400" />
                                        <div>
                                            <h4 className="m-0 font-bold text-white text-sm">Standard Assignment Agreement.pdf</h4>
                                            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Generated Today • 124KB</span>
                                        </div>
                                    </div>
                                    <button className="text-gray-500 hover:text-blue-400 transition-colors" title="Download Document"><Download size={18} /></button>
                                </div>
                            )}
                        </div>

                        {deal.document_generated && (
                            <div className="mt-4 pt-4 border-t border-blue-900/30">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400/70 font-mono mb-4">Digital Signatures Required</h4>
                                <div className="flex gap-4">
                                    <button
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold tracking-wide transition-all border ${deal.signed_wholesaler ? 'bg-emerald-900/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-[#050816]/80 border-blue-900/50 text-gray-300 hover:bg-blue-900/30 hover:border-blue-500/40 hover:text-white'}`}
                                        onClick={() => handleSignAgreement('wholesaler')}
                                        disabled={deal.signed_wholesaler || signing}
                                    >
                                        {deal.signed_wholesaler ? <><CheckCircle size={16} /> Wholesaler Signed</> : <><Edit3 size={16} /> Sign as Wholesaler</>}
                                    </button>
                                    <button
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold tracking-wide transition-all border ${deal.signed_investor ? 'bg-emerald-900/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/40 hover:text-white shadow-[0_0_15px_rgba(78,123,255,0.2)]'}`}
                                        onClick={() => handleSignAgreement('investor')}
                                        disabled={deal.signed_investor || signing}
                                    >
                                        {deal.signed_investor ? <><CheckCircle size={16} /> Investor Signed</> : <><Edit3 size={16} /> Sign as Investor</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Sticky Transaction Panel & Timeline */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="glass-card p-6 group transition-all duration-300 hover:shadow-[0_0_25px_rgba(78,123,255,0.2)] sticky top-[100px] z-20">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-blue-900/30 pb-2">
                            <Activity className="text-blue-400" size={18} /> Transaction Status
                        </h2>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-black/40 border border-blue-900/30 rounded p-3">
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono block mb-1">Liquidity Signal</span>
                                <span className={`text-sm font-bold font-mono tracking-widest ${aiLiquidity === 'HIGH' ? 'text-blue-400' : 'text-amber-400'}`}>{aiLiquidity}</span>
                            </div>
                            <div className="bg-black/40 border border-emerald-900/30 rounded p-3">
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono block mb-1">Close Probability</span>
                                <span className={`text-sm font-bold font-mono tracking-widest ${closeProb >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{closeProb}%</span>
                            </div>
                        </div>

                        <div className="mb-8 border-t border-blue-900/30 pt-4">
                            <ProgressIndicator status={deal.status} />
                        </div>

                        <div className="flex flex-col gap-4 mb-6 pt-4 border-t border-blue-900/30">
                            <div className="flex justify-between items-center text-sm font-mono tracking-wide">
                                <span className="text-gray-500 uppercase text-[10px]">Escrow Status</span>
                                {deal.escrow_status === 'CONFIRMED' ? (
                                    <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle size={14} /> Confirmed</span>
                                ) : bothSigned ? (
                                    <span className="text-amber-400 flex items-center gap-1"><Clock size={14} /> Pending Transfer</span>
                                ) : (
                                    <span className="text-gray-400">Awaiting Sigs</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-sm font-mono tracking-wide border-b border-blue-900/30 pb-4">
                                <span className="text-gray-500 uppercase text-[10px]">Title Verification</span>
                                {deal.title_status === 'CLEAR' ? (
                                    <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle size={14} /> Clear</span>
                                ) : bothSigned ? (
                                    <span className="text-amber-400 flex items-center gap-1"><Clock size={14} /> In Review</span>
                                ) : (
                                    <span className="text-gray-400">Awaiting Sigs</span>
                                )}
                            </div>
                        </div>

                        {deal.closing_code && (
                            <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-lg p-5 mb-6 text-center shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-emerald-500/5 pulse-animation pointer-events-none"></div>
                                <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-2 font-mono font-bold flex items-center justify-center gap-1"><ShieldCheck size={14} /> Secure Closing Code</div>
                                <div className="text-3xl font-mono text-white tracking-[0.25em] font-bold">{deal.closing_code}</div>
                                <div className="text-[9px] text-gray-400 mt-2 font-mono uppercase tracking-widest">Provide this code to the Title Company</div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            {(!user || user.primaryPersona === 'WHOLESALER') ? (
                                <>
                                    {deal.status === 'Lead' || deal.status === 'DRAFT' ? (
                                        <label className="flex items-start gap-3 cursor-pointer mb-2 p-3 bg-amber-900/10 border border-amber-500/30 rounded-lg hover:border-amber-400/50 transition-all">
                                            <input
                                                type="checkbox"
                                                className="mt-1 accent-amber-500"
                                                checked={isPriorityBlast}
                                                onChange={(e) => setIsPriorityBlast(e.target.checked)}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400 flex items-center gap-1"><Zap size={12} /> Priority Deal Blast</span>
                                                <span className="text-[10px] text-gray-400 leading-relaxed mt-1">Bypass basic filters and send immediate SMS alerts to Top Buyers. (Limits apply: 3/day)</span>
                                            </div>
                                        </label>
                                    ) : null}
                                    <button
                                        className={`w-full py-3 rounded-lg text-sm font-mono font-bold tracking-widest uppercase transition-all shadow-lg ${deal.status === 'Lead' || deal.status === 'DRAFT' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50' : 'bg-[#050816] border border-blue-900/50 text-gray-500 cursor-not-allowed'}`}
                                        onClick={async () => {
                                            const hasVerified = vaultDocuments.some(d => d.status === 'VERIFIED');
                                            if (!hasVerified) {
                                                alert("🛑 OPERATIONAL BLOCK: You cannot publish this deal until a Proof of Control document has been VERIFIED by an Admin. Please upload your contract to the Document Vault to lift the publishing hold.");
                                                return;
                                            }

                                            setDeal(prev => ({ ...prev, status: 'Active' }));
                                            setActivityLog(prev => [{ id: Date.now().toString(), type: 'DEAL_PUBLISHED', user: 'Wholesaler', time: new Date().toISOString(), note: 'Deal approved and pushed to LIVE Marketplace.' }, ...prev]);

                                            try {
                                                const wholesalerId = deal.user_id || user?.id;
                                                let matchCount = 0;

                                                if (isPriorityBlast) {
                                                    const result = await dealBlastEngine.executePriorityBlast({ ...deal, priority: true }, wholesalerId);
                                                    if (!result.success) {
                                                        alert(result.error);
                                                        return;
                                                    }
                                                    matchCount = result.count;
                                                } else {
                                                    const result = await distributionService.distributeDeal(deal, wholesalerId);
                                                    matchCount = result.matches?.length || 0;
                                                }

                                                alert(`✅ Deal successfully pushed Live! Alert dispatched to ${matchCount} targeted Investors.`);
                                            } catch (e) {
                                                console.error("Matchmaking distribution failed silently.", e);
                                                alert("Deal successfully published to the live Marketplace!");
                                            }
                                        }}
                                        disabled={deal.status !== 'Lead' && deal.status !== 'DRAFT'}
                                    >
                                        {deal.status === 'Lead' || deal.status === 'DRAFT' ? 'Publish to Marketplace' : deal.status === 'RESERVED' ? 'Deal Lock Activated' : 'Deal is Syndicated'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    className={`w-full py-3 rounded-lg text-sm font-mono font-bold tracking-widest uppercase transition-all shadow-lg ${deal.status === 'Active' || deal.status === 'Marketing' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50 border border-blue-400/50' : 'bg-[#050816] border border-blue-900/50 text-gray-500 cursor-not-allowed'}`}
                                    onClick={handleReserveClick}
                                    disabled={deal.status !== 'Active' && deal.status !== 'Marketing'}
                                >
                                    {deal.status === 'Active' || deal.status === 'Marketing' ? 'Request Deal ($250 Lock)' : deal.status === 'RESERVED' ? 'Deal Reserved (24h Lock)' : 'Verification Pending'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Timeline Log */}
                    <div className="glass-card p-6 group transition-all duration-300">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-blue-900/30 pb-2">
                            <Activity size={18} className="text-purple-400" /> Platform Event Log
                        </h2>
                        <div className="relative pl-6 flex flex-col gap-4">
                            <div className="absolute top-1 bottom-1 left-[5px] w-[1px] bg-blue-900/30"></div>
                            {activityLog.map((log) => (
                                <div key={log.id} className="relative z-10 group/timeline">
                                    <div className={`absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full border border-[rgba(5,8,22,1)] ${log.type.includes('VERIFIED') || log.type.includes('PUBLISHED') ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(78,123,255,0.4)]'}`}></div>
                                    <div className="bg-black/40 border border-blue-900/40 rounded-lg p-3 group-hover/timeline:border-blue-500/40 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-blue-400 font-mono tracking-widest uppercase">{log.type.replace(/_/g, ' ')}</span>
                                            <span className="text-[9px] text-gray-500 font-mono tracking-wider">{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-xs text-gray-300 mb-2 leading-relaxed font-sans">{log.note}</p>
                                        <div className="text-[9px] flex items-center gap-1 text-gray-500 font-mono tracking-widest uppercase">
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
                <div className="fixed inset-0 bg-[#050816]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-lg w-full p-8 relative animate-fade-in shadow-[0_0_50px_rgba(78,123,255,0.15)]">
                        <div className="flex justify-between items-center mb-6 border-b border-blue-900/30 pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-white"><CreditCard size={24} className="text-blue-400" /> Secure Terminal Lock</h2>
                            <button className="text-gray-500 hover:text-white transition-colors" onClick={() => setIsReserveModalOpen(false)} disabled={isReserving}><X size={20} /></button>
                        </div>

                        <div className="bg-amber-900/10 border border-amber-500/30 rounded-lg p-4 mb-6 flex gap-3 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm border-l border-amber-500/20 pl-3">
                                <p className="font-bold text-amber-400 mb-1 font-mono tracking-wide uppercase">Non-Refundable $250 Deposit</p>
                                <p className="text-gray-300 leading-relaxed font-sans">Locking this deal requires an immediate <strong>$250 reservation deposit</strong> via Stripe. This grants you a 24-hour exclusive terminal command window to execute the Assignment Agreement.</p>
                            </div>
                        </div>

                        <ul className="text-xs text-gray-400 mb-8 space-y-3 pl-3 border-l-2 border-blue-500/40 font-mono">
                            <li>• The deposit will apply toward your final WholesaleOS platform fee.</li>
                            <li>• If you abort the sequence without cause, the deposit goes to the Wholesaler.</li>
                            <li>• If the Wholesaler fails to provide the Assignment Agreement within 24 hours, you receive a full refund.</li>
                        </ul>

                        <div className="flex gap-4">
                            <button className="flex-1 py-3 bg-[#050816] border border-blue-900/50 hover:bg-blue-900/20 text-gray-300 rounded-lg text-sm font-mono tracking-widest uppercase transition-all" onClick={() => setIsReserveModalOpen(false)} disabled={isReserving}>Abort</button>
                            <button className="flex-1 py-3 border border-blue-400/50 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(78,123,255,0.3)] rounded-lg text-sm font-mono tracking-widest uppercase font-bold transition-all flex items-center justify-center gap-2" onClick={submitReservation} disabled={isReserving}>
                                {isReserving ? <Loader2 className="animate-spin" size={16} /> : 'Pay $250 & Lock Deal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DealRoom;
