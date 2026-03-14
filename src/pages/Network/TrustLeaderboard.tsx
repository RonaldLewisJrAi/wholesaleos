import React, { useState, useEffect } from 'react';
import { ShieldCheck, Target, Award, CheckCircle } from 'lucide-react';
import { getTrustLeaderboard, LeaderboardProfile } from '../../services/networkService';

export const TrustLeaderboard = ({ persona }: { persona: 'WHOLESALER' | 'INVESTOR' | 'REALTOR' }) => {
    const [profiles, setProfiles] = useState<LeaderboardProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBoard = async () => {
            setLoading(true);
            try {
                const data = await getTrustLeaderboard(persona, 15);
                setProfiles(data);
            } catch (err) {
                console.error('Leaderboard Fetch Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBoard();
    }, [persona]);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profiles.length) {
        return (
            <div className="text-center p-12 text-slate-500">
                <Target size={48} className="mx-auto mb-4 opacity-30" />
                <p>No verified peers found in this organization's ecosystem.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 cursor-default">
            {profiles.map((profile, i) => (
                <div key={profile.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-4">
                        {/* RANKING BUBBLE */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${i === 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' :
                            i === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-400/50' :
                                i === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-500/50' :
                                    'bg-slate-800 text-slate-500'
                            }`}>
                            #{i + 1}
                        </div>

                        <div>
                            <p className="text-white font-bold flex items-center gap-2">
                                {profile.first_name} {profile.last_name}
                                {profile.trust_score >= 80 && <CheckCircle size={14} className="text-emerald-500" />}
                            </p>
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">
                                {profile.company_name || `${persona} Profile`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* DEALS DRILLDOWN */}
                        <div className="text-right">
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Closed</p>
                            <p className="text-slate-200 font-bold">{profile.deals_closed || 0}</p>
                        </div>

                        {/* TRUST SCORE GAUGE */}
                        <div className="text-right w-24">
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1 flex justify-end gap-1">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                Trust
                            </p>
                            <p className={`font-bold text-lg ${profile.trust_score >= 80 ? 'text-emerald-400' :
                                profile.trust_score >= 60 ? 'text-blue-400' :
                                    'text-slate-300'
                                }`}>
                                {profile.trust_score}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
