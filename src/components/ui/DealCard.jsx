import React from 'react';
import { MapPin, ShieldCheck, CheckCircle, GraduationCap, Award } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';

const getTrustTier = (score = 50) => {
    if (score >= 90) return { label: 'Elite', class: 'bg-success text-bg-[var(--bg-primary)]er' };
    if (score >= 75) return { label: 'Verified Pro', class: 'bg-primary text-bg-[var(--bg-primary)]er' };
    if (score >= 50) return { label: 'Active Trader', class: 'bg-secondary text-white' };
    if (score >= 25) return { label: 'New', class: 'bg-warning text-bg-[var(--bg-primary)]er' };
    return { label: 'High Risk', class: 'bg-danger text-white' };
};

export default function DealCard({ deal }) {
    const { user } = useAuth();
    const isTitleCompany = user?.primaryPersona === 'TITLE_COMPANY';
    const trustScore = deal.wholesaler?.trust_score || deal.wholesaler_trust_score || 50;
    const tier = getTrustTier(trustScore);
    const fallbackImage = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';

    return (
        <div className="property-card glass-panel flex flex-col h-full bg-[var(--surface-color)] shadow-lg rounded-xl overflow-hidden border border-[var(--border-light)] hover:border-primary transition-all duration-300 group">
            <div className="property-image h-48 bg-cover bg-center relative" style={{
                backgroundImage: `url(${deal.image || fallbackImage})`
            }}>
                <div className="flex-between w-full p-3 absolute top-0 left-0 items-start">
                    <div className="flex flex-col gap-2">
                        {deal.velocity_score !== undefined && deal.velocity_score > 0 && (
                            deal.velocity_score >= 80 ? (
                                <span className="bg-red-500/90 text-white border border-red-500/50 px-2 py-1 flex items-center gap-1 font-mono text-[10px] font-bold shadow-lg rounded backdrop-blur-md w-max uppercase tracking-wider">
                                    🔥 HOT DEAL
                                </span>
                            ) : deal.velocity_score >= 40 ? (
                                <span className="bg-amber-500/90 text-white border border-amber-500/50 px-2 py-1 flex items-center gap-1 font-mono text-[10px] font-bold shadow-lg rounded backdrop-blur-md w-max uppercase tracking-wider">
                                    ⚡ FAST MOVING
                                </span>
                            ) : (
                                <span className="bg-gray-800/90 text-gray-300 border border-gray-600/50 px-2 py-1 flex items-center gap-1 font-mono text-[10px] font-bold shadow-lg rounded backdrop-blur-md w-max uppercase tracking-wider">
                                    🐢 SLOW DEAL
                                </span>
                            )
                        )}
                        {deal.distress_score >= 50 && (
                            <span className="bg-red-600/90 text-white border border-red-500 px-2 py-1 flex items-center gap-1 font-mono text-[10px] font-bold shadow-[0_0_15px_rgba(220,38,38,0.5)] rounded backdrop-blur-md w-max uppercase tracking-wider animate-pulse">
                                🚨 HIGH DISTRESS
                            </span>
                        )}
                        <span className={`status-badge w-max bg-primary text-xs font-bold px-2 py-1 rounded shadow-md`}>
                            {deal.status}
                        </span>
                        {deal.poc_verified_doc_id && (
                            <span className="badge bg-[rgba(0,0,0,0.6)] backdrop-blur-md text-success border border-success border-opacity-30 font-bold text-[10px] shadow-lg w-max" title="Proof of Control Verified by Admin">
                                <CheckCircle size={10} className="inline mr-1" /> PoC Verified
                            </span>
                        )}
                    </div>
                    {deal.status !== 'Web Lead' && (
                        <div className="flex gap-1 flex-col items-end">
                            {deal.ai_deal_score ? (
                                <span className={`badge ${deal.ai_deal_score >= 80 ? 'bg-emerald-900/90 text-emerald-400 border border-emerald-500/50' : deal.ai_deal_score >= 60 ? 'bg-amber-900/90 text-amber-400 border border-amber-500/50' : 'bg-red-900/90 text-red-500 border border-red-500/50'} font-bold text-xs shadow-lg px-2 py-1 flex items-center gap-1 rounded backdrop-blur-md`}>
                                    <ShieldCheck size={12} /> AI Score: {deal.ai_deal_score}
                                    <HelpTooltip topic="Deal Score" description="Calculated from Equity Spread, Buyer Demand, Rehab Risk, Seller Motivation, and the Wholesaler's Trust Score." position="bottom" />
                                </span>
                            ) : (
                                <span className={`badge ${tier.class} font-bold text-xs flex items-center shadow-lg px-2 py-1 rounded border border-white/10 backdrop-blur-md`} title={`Wholesaler Trust Score: ${trustScore}/100`}>
                                    <ShieldCheck size={12} className="inline mr-1" /> {tier.label}
                                    <HelpTooltip topic="Trust Score" description="Dictates Marketplace Visibility. 90+ Priority routing. 75-89 Standard visibility. 50-74 Limited blast." position="bottom" />
                                </span>
                            )}
                            {deal.liquidity_signal && (
                                <span className="badge bg-blue-900/90 text-blue-300 border border-blue-500/50 font-bold text-[10px] shadow-lg px-2 py-1 rounded flex items-center gap-1 uppercase tracking-widest backdrop-blur-md">
                                    Demand: {deal.liquidity_signal}
                                </span>
                            )}
                            {deal.wholesaler?.academy_status === 'GRADUATE' && (
                                <span className="badge bg-blue-900/80 text-blue-300 border border-blue-500/50 font-bold text-[10px] shadow-lg px-2 py-1 rounded flex items-center gap-1 uppercase tracking-widest" title="WholesaleOS Academy Graduate">
                                    <GraduationCap size={10} /> Graduate
                                </span>
                            )}
                            {deal.wholesaler?.academy_status === 'CERTIFIED' && (
                                <span className="badge bg-emerald-900/80 text-emerald-400 border border-emerald-500/50 font-bold text-[10px] shadow-lg px-2 py-1 rounded flex items-center gap-1 uppercase tracking-widest" title="WholesaleOS Certified Partner">
                                    <Award size={10} /> Certified
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="property-details p-4 flex flex-col flex-1">
                <h3 className="property-address flex items-center gap-1 font-bold text-sm mb-3 text-white">
                    <MapPin size={16} className="text-primary flex-shrink-0" /> {deal.address || `${deal.city || 'Unknown City'}, ${deal.state || ''}`}
                </h3>
                <div className="property-metrics grid grid-cols-2 gap-4 mb-4 flex-1">
                    <div className="metric flex flex-col">
                        <span className="metric-label text-xs text-muted font-semibold uppercase tracking-wider mb-1">ARV</span>
                        <span className="metric-value font-mono font-bold text-lg text-white">
                            {deal.arv ? `$${deal.arv.toLocaleString()}` : '$--'}
                        </span>
                    </div>
                    <div className="metric flex flex-col">
                        <span className="metric-label text-xs text-muted font-semibold uppercase tracking-wider mb-1">Assignment</span>
                        <span className="metric-value font-mono font-bold text-lg text-success">
                            {deal.assignment ? `$${deal.assignment.toLocaleString()}` : (deal.assignment_fee ? `$${deal.assignment_fee.toLocaleString()}` : '$--')}
                        </span>
                    </div>
                </div>
                <div className="property-actions flex flex-col gap-2 mt-auto">
                    <button className="btn btn-primary w-full shadow-lg hover:shadow-primary/20" onClick={() => window.location.href = `/deal/${deal.id}`}>
                        View Deal ➔
                    </button>
                    {deal.status === 'ACTIVE' && (
                        <button
                            className={`btn btn-secondary w-full opacity-80 hover:opacity-100 ${isTitleCompany ? 'opacity-50 cursor-not-allowed hover:opacity-50' : ''}`}
                            disabled={isTitleCompany}
                            title={isTitleCompany ? "Title companies have read-only access to this module." : ""}
                        >
                            Save to Watchlist
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
