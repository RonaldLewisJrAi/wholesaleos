import React from 'react';
import { MapPin, ShieldCheck, CheckCircle } from 'lucide-react';

const getTrustTier = (score = 50) => {
    if (score >= 90) return { label: 'Elite', class: 'bg-success text-bg-darker' };
    if (score >= 75) return { label: 'Verified Pro', class: 'bg-primary text-bg-darker' };
    if (score >= 50) return { label: 'Active Trader', class: 'bg-secondary text-white' };
    if (score >= 25) return { label: 'New', class: 'bg-warning text-bg-darker' };
    return { label: 'High Risk', class: 'bg-danger text-white' };
};

export default function DealCard({ deal }) {
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
                        <span className={`badge ${tier.class} font-bold text-xs shadow-lg px-2 py-1 rounded`} title={`Wholesaler Trust Score: ${trustScore}/100`}>
                            <ShieldCheck size={12} className="inline mr-1" /> {tier.label}
                        </span>
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
                        <button className="btn btn-secondary w-full opacity-80 hover:opacity-100">
                            Save to Watchlist
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
