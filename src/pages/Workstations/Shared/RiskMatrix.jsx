import React from 'react';
import { ShieldAlert, TrendingDown, Target, Building } from 'lucide-react';

const RiskMatrix = ({ persona = 'WHOLESALER' }) => {

    // Dynamic Content Resolver based on cross-persona interaction expectations
    const resolveContext = () => {
        switch (persona) {
            case 'INVESTOR':
                return {
                    title: "ROI Viability Risk",
                    metric: "High Yield Variance",
                    value: "Medium-High",
                    color: "text-warning",
                    bg: "bg-warning/20 border-warning/50",
                    description: "Capital expenditure risk vs projected ARV exit.",
                    icon: <TrendingDown size={18} className="text-warning" />
                };
            case 'REALTOR':
                return {
                    title: "Pricing Strategy Risk",
                    metric: "Days on Market Risk",
                    value: "Low",
                    color: "text-success",
                    bg: "bg-success/20 border-success/50",
                    description: "Likelihood of standard retail liquidity without severe price reductions.",
                    icon: <Building size={18} className="text-success" />
                };
            case 'VIRTUAL_ASSISTANT':
                return {
                    title: "Lead Motivation Stability",
                    metric: "Ghosting Probability",
                    value: "High",
                    color: "text-danger",
                    bg: "bg-danger/20 border-danger/50",
                    description: "Predictive outcome of prospect disengagement based on call outcome clusters.",
                    icon: <ShieldAlert size={18} className="text-danger" />
                };
            case 'WHOLESALER':
            default:
                return {
                    title: "Contract Assignment Risk",
                    metric: "Disposition Probability",
                    value: "Medium",
                    color: "text-primary",
                    bg: "bg-primary/20 border-primary/50",
                    description: "Probability of successfully finding an end-buyer before EMD hard dates.",
                    icon: <Target size={18} className="text-primary" />
                };
        }
    };

    const config = resolveContext();

    return (
        <div className="card glass-panel p-5 relative overflow-hidden" style={{ minHeight: '160px' }}>
            <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-10 -translate-y-10 rounded-full blur-3xl opacity-20 ${config.bg.split(' ')[0]}`}></div>

            <div className="flex-between mb-4 relative z-10">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${config.color}`}>
                    {config.icon} {config.title}
                </h3>
                <span className={`badge ${config.bg} ${config.color} uppercase tracking-wider text-[10px] font-bold`}>
                    {config.value}
                </span>
            </div>

            <div className="relative z-10 mt-2">
                <div className="text-xs font-bold text-white mb-1 uppercase tracking-wider">{config.metric}</div>
                <p className="text-sm text-muted">{config.description}</p>
            </div>
        </div>
    );
};

export default RiskMatrix;
