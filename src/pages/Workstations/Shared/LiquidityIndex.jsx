import React from 'react';
import { Droplet, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const LiquidityIndex = ({ persona = 'WHOLESALER', velocityScore = 82 }) => {

    // Dynamic Content Resolver for Liquidity Interpretations
    const resolveContext = () => {
        if (velocityScore > 75) {
            return {
                level: "Highly Liquid",
                color: "text-success",
                trendIcon: <ArrowUpRight size={14} />,
                messages: {
                    'WHOLESALER': 'Rapid dispositions expected. High end-buyer demand matrix.',
                    'INVESTOR': 'Competitive environment. Expect multiple offers on turnkey exits.',
                    'REALTOR': 'Fast escrows. Properties typically sell under 14 days.',
                    'VIRTUAL_ASSISTANT': 'Prime territory. High conversion rate on initial contact hooks.'
                }
            };
        } else if (velocityScore > 45) {
            return {
                level: "Moderate Fluidity",
                color: "text-warning",
                trendIcon: <Activity size={14} />,
                messages: {
                    'WHOLESALER': 'Standard disposition timelines. Requires aggressive marketing.',
                    'INVESTOR': 'Stable hold. Potential for negotiating favorable entry pricing.',
                    'REALTOR': 'Balanced market. Standard marketing strategies apply.',
                    'VIRTUAL_ASSISTANT': 'Follow-up cadence critical for maintaining pipeline velocity.'
                }
            };
        } else {
            return {
                level: "Illiquid / Stagnant",
                color: "text-danger",
                trendIcon: <ArrowDownRight size={14} />,
                messages: {
                    'WHOLESALER': 'DANGER: Extremely high risk of holding costs. Secure deep discounts only.',
                    'INVESTOR': 'Long-term play required. Difficult to exit quickly without major concessions.',
                    'REALTOR': 'Buyer market. Expect extended Days on Market (DOM) averages.',
                    'VIRTUAL_ASSISTANT': 'Low engagement zone. Focus dialer on heavily distressed segments only.'
                }
            };
        }
    };

    const config = resolveContext();
    const specificMessage = config.messages[persona] || config.messages['WHOLESALER'];

    return (
        <div className="card glass-panel p-5 border-l-4" style={{ borderLeftColor: `var(--${config.color.split('-')[1]}-color)`, minHeight: '160px' }}>
            <div className="flex-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                    <Droplet className={config.color} size={18} /> Macro Liquidity Index
                </h3>
                <div className="flex items-center gap-1">
                    <span className={`text-2xl font-bold ${config.color} font-mono`}>{velocityScore}</span>
                    <span className="text-xs text-muted">/100</span>
                </div>
            </div>

            <div className="mt-4">
                <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${config.color} mb-1`}>
                    {config.trendIcon} {config.level}
                </div>
                <p className="text-sm text-muted">{specificMessage}</p>
            </div>
        </div>
    );
};

export default LiquidityIndex;
