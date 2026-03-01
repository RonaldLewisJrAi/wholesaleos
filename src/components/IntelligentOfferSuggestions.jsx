import React from 'react';
import { Lightbulb, Target, TrendingDown, AlertTriangle } from 'lucide-react';

const IntelligentOfferSuggestions = ({ leadData, intelligentData }) => {
    if (!leadData || !intelligentData) return null;

    // intelligentData maps to the `vw_intelligent_offer_suggestions` postgres view
    const {
        conservative_offer,
        aggressive_offer,
        mao,
        heat_score,
        negotiation_strategy
    } = intelligentData;

    return (
        <div className="card glass-panel bg-gradient-to-br from-primary/10 to-transparent border-primary/30 p-5 mt-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary">
                <Lightbulb size={20} /> Intelligent Offer Suggestions
            </h3>

            <p className="text-sm text-muted mb-6">{negotiation_strategy}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Conservative Offer */}
                <div className="bg-[rgba(255,255,255,0.03)] border border-[var(--border-light)] p-4 rounded-lg">
                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                        <TrendingDown size={14} /> Low Anchor
                    </h4>
                    <span className="text-2xl font-bold text-white">
                        ${Number(conservative_offer).toLocaleString()}
                    </span>
                    <p className="text-[10px] text-muted mt-2">60% ARV - Repairs. Use if seller urgency is extremely high.</p>
                </div>

                {/* Aggressive Offer */}
                <div className="bg-[rgba(255,255,255,0.03)] border border-[var(--border-light)] p-4 rounded-lg relative overflow-hidden">
                    {heat_score > 75 && (
                        <div className="absolute top-0 right-0 p-1 bg-danger/20 text-danger text-[9px] font-bold uppercase rounded-bl">
                            Hot Lead Match
                        </div>
                    )}
                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Target size={14} /> Standard Offer
                    </h4>
                    <span className="text-2xl font-bold text-white">
                        ${Number(aggressive_offer).toLocaleString()}
                    </span>
                    <p className="text-[10px] text-muted mt-2">75% ARV - Repairs. Competitive standard entry.</p>
                </div>

                {/* MAO Limit */}
                <div className="bg-[rgba(239,68,68,0.05)] border border-danger/20 p-4 rounded-lg">
                    <h4 className="text-xs font-bold text-danger uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertTriangle size={14} /> Strict MAO Limit
                    </h4>
                    <span className="text-2xl font-bold text-danger">
                        ${Number(mao).toLocaleString()}
                    </span>
                    <p className="text-[10px] text-danger/80 mt-2">Maximum Allowable Offer. Do not exceed to preserve minimum fee target.</p>
                </div>
            </div>

            <div className="mt-6 flex gap-3">
                <button className="btn btn-primary text-xs py-1.5 flex-1">Generate Contract at Low Anchor</button>
                <button className="btn btn-secondary text-xs py-1.5 flex-1">Generate Contract at Standard</button>
            </div>
        </div>
    );
};

export default IntelligentOfferSuggestions;
