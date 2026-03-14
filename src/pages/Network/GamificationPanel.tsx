import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, ShieldCheck, Trophy, ArrowUpRight } from 'lucide-react';
import { getGamificationProfile } from '../../services/networkService';

export const GamificationPanel = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurrentState = async () => {
            setLoading(true);
            try {
                const data = await getGamificationProfile();
                setProfile(data);
            } catch (err) {
                console.error('Gamification Fetch Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCurrentState();
    }, []);

    if (loading || !profile) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 min-h-[300px] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const { trust_score, deals_closed, kyc_verified, title_verified, subscription_tier } = profile;

    // Derived Logic for Tier Advancements
    const currentTier = trust_score >= 90 ? 'Platinum Operator' :
        trust_score >= 75 ? 'Gold Producer' :
            trust_score >= 50 ? 'Verified Member' : 'New User';

    const nextTier = trust_score >= 90 ? 'Max Level' :
        trust_score >= 75 ? 'Platinum Operator' :
            trust_score >= 50 ? 'Gold Producer' : 'Verified Member';

    const nextThreshold = trust_score >= 90 ? 100 :
        trust_score >= 75 ? 90 :
            trust_score >= 50 ? 75 : 50;

    const progressPct = Math.min(100, Math.max(0, (trust_score / nextThreshold) * 100));

    const progressRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (progressRef.current) {
            progressRef.current.style.width = `${progressPct}%`;
        }
    }, [progressPct]);

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 relative overflow-hidden group">

            {/* Visual Flair Elements */}
            <div className="absolute -top-10 -right-10 text-emerald-500/10 transition-transform group-hover:scale-110 duration-500">
                <Trophy size={140} />
            </div>

            <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-400" />
                    Network Reputation
                </h3>

                <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                        {trust_score}
                    </span>
                    <span className="text-slate-400 font-medium">/ 100 Trust Score</span>
                </div>

                {/* Progress Bar Component */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                        <span className="text-slate-300">{currentTier}</span>
                        <span className="text-slate-500">{nextTier}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden shadow-inner border border-slate-800">
                        <div
                            ref={progressRef}
                            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full relative"
                        >
                            <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 skew-x-12 animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>
                </div>

                {/* Platform Action Checklists to Gameify Platform Operations */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 mb-2">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Target size={14} /> Level Up Path
                    </p>
                    <ul className="space-y-3 font-medium text-sm">
                        <li className="flex items-start gap-3">
                            {kyc_verified ? (
                                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                            ) : (
                                <div className="w-[18px] h-[18px] border-2 border-slate-600 rounded-full flex-shrink-0" />
                            )}
                            <span className={kyc_verified ? "text-slate-400 line-through" : "text-slate-200"}>Identity / KYC Validation (+10)</span>
                        </li>
                        <li className="flex items-start gap-3">
                            {title_verified ? (
                                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                            ) : (
                                <div className="w-[18px] h-[18px] border-2 border-slate-600 rounded-full flex-shrink-0" />
                            )}
                            <span className={title_verified ? "text-slate-400 line-through" : "text-slate-200"}>Connect Title Company (+15)</span>
                        </li>
                        <li className="flex items-start gap-3">
                            {deals_closed >= 5 ? (
                                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                            ) : (
                                <div className="w-[18px] h-[18px] border-2 border-slate-600 rounded-full flex-shrink-0" />
                            )}
                            <span className={deals_closed >= 5 ? "text-slate-400 line-through" : "text-slate-200"}>Close 5 Transactions ({deals_closed}/5)</span>
                        </li>
                        <li className="flex items-start gap-3">
                            {subscription_tier === 'PRO' || subscription_tier === 'SUPER' ? (
                                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                            ) : (
                                <div className="w-[18px] h-[18px] border-2 border-slate-600 rounded-full flex-shrink-0" />
                            )}
                            <span className={(subscription_tier === 'PRO' || subscription_tier === 'SUPER') ? "text-slate-400 line-through" : "text-slate-200"}>Upgrade to WholesaleOS Pro</span>
                        </li>
                    </ul>
                </div>

            </div>
        </div>
    );
};
