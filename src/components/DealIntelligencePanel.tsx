import React from 'react';
import { Brain, TrendingUp, AlertTriangle, ShieldCheck, DollarSign, Activity } from 'lucide-react';
import { DealIntelligenceReport } from '../services/dealEvaluatorEngine';

interface DealIntelligencePanelProps {
    report: DealIntelligenceReport;
    isGenerating?: boolean;
}

export const DealIntelligencePanel: React.FC<DealIntelligencePanelProps> = ({ report, isGenerating = false }) => {

    if (isGenerating) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <Brain className="text-emerald-500 animate-pulse mb-4" size={48} />
                <h3 className="text-xl font-bold text-white mb-2">Analyzing Deal Intelligence...</h3>
                <p className="text-slate-400 text-center max-w-sm">
                    Cross-referencing wholesaler trust history, localized buyer liquidity, and market comps to evaluate risk.
                </p>
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden relative group cursor-default shadow-lg">

            {/* Visual AI Halo */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -z-10 transition-colors duration-1000 ${report.risk_level === 'Low' ? 'bg-emerald-500/20' :
                    report.risk_level === 'Medium' ? 'bg-amber-500/20' :
                        'bg-red-500/20'
                }`} />

            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Brain className="text-emerald-400" size={20} />
                    AI Intelligence Report
                </h2>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Score</span>
                    <span className={`text-3xl font-black drop-shadow-md ${report.ai_deal_score >= 80 ? 'text-emerald-400' :
                            report.ai_deal_score >= 50 ? 'text-amber-400' :
                                'text-red-400'
                        }`}>
                        {report.ai_deal_score}
                    </span>
                </div>
            </div>

            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">

                {/* Equity Spread */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-emerald-500/30 transition-colors">
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                        <TrendingUp size={14} className="text-emerald-400" /> Equity Spread
                    </div>
                    <div className="text-xl font-bold text-white mb-1">
                        ${report.equity_spread.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                        <ShieldCheck size={12} className={report.arv_confidence === 'High' ? 'text-emerald-500' : 'text-amber-500'} />
                        {report.arv_confidence} Confidence
                    </div>
                </div>

                {/* Liquidity Signal */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-emerald-500/30 transition-colors">
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Activity size={14} className="text-blue-400" /> Buyer Demand
                    </div>
                    <div className="text-xl font-bold text-white mb-1">
                        {report.buyer_demand}
                    </div>
                    <div className="text-xs text-slate-500">
                        Signal: {report.liquidity_signal}
                    </div>
                </div>

                {/* Risk Profiling */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-emerald-500/30 transition-colors">
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                        <AlertTriangle size={14} className={
                            report.risk_level === 'Low' ? 'text-emerald-400' :
                                report.risk_level === 'Medium' ? 'text-amber-400' : 'text-red-400'
                        } /> Risk Level
                    </div>
                    <div className={`text-xl font-bold mb-1 ${report.risk_level === 'Low' ? 'text-emerald-400' :
                            report.risk_level === 'Medium' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                        {report.risk_level}
                    </div>
                </div>

                {/* Offer Recommendation Action Box */}
                <div className="md:col-span-3 bg-gradient-to-r from-slate-800 to-slate-800/50 border border-slate-700 p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <p className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                            <DollarSign size={16} className="text-emerald-500" /> Maximum Allowable Offer (MAO)
                        </p>
                        <p className="text-2xl font-black text-white">
                            ${report.recommended_offer.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-700 pt-4 sm:pt-0 sm:pl-6">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Target Assignment</p>
                        <p className="text-emerald-400 font-bold">${report.estimated_assignment_fee.toLocaleString()}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};
