import React, { useState, useEffect } from 'react';
import { Network, Handshake, TrendingUp, Filter, AlertCircle, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { getOutboundReferrals, getInboundReferrals, Referral } from '../../services/referralService';
import { ReferralList } from './ReferralList';

export const ReferralDashboard = () => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState < Referral[] > ([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Determine view context
    const isRealtor = user?.primary_persona === 'REALTOR';
    const personaTitle = isRealtor ? 'Inbound Realtor Referrals' : 'Outbound Referral Network';

    const fetchReferrals = async () => {
        setLoading(true);
        setError('');
        try {
            const data = isRealtor
                ? await getInboundReferrals()
                : await getOutboundReferrals();
            setReferrals(data || []);
        } catch (err: any) {
            console.error('[ReferralDashboard] Fetch Error:', err);
            setError('Failed to securely load referral data. Please verify your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReferrals();
    }, [isRealtor]);

    const handleActionComplete = () => {
        fetchReferrals(); // Hard refresh the data matrix upon accept/decline success.
    };

    return (
        <div className="p-8 max-w-7xl mx-auto pb-32">
            <header className="mb-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                            <Network className="text-blue-500" size={32} />
                            Referral Intelligence Hub
                        </h1>
                        <p className="text-slate-400">
                            Manage your {isRealtor ? 'inbound leads sent to you for closing.' : 'outbound property hand-offs to external realtors.'}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={fetchReferrals}
                            className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 transition-colors px-4 py-2 rounded-lg text-slate-300 flex items-center gap-2"
                        >
                            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                            Sync Network
                        </button>
                    </div>
                </div>
            </header>

            {/* STATS MATRIX */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                            <Handshake size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Pending Matches</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                            {referrals.filter(r => r.referral_status === 'pending').length}
                        </h3>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Active Pursuits</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                            {referrals.filter(r => r.referral_status === 'accepted').length}
                        </h3>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">
                            <Network size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Total Volume</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                            {referrals.length}
                        </h3>
                    </div>
                </div>
            </div>

            {/* ERROR BOUNDARY */}
            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            {/* LIST INJECTION */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white tracking-wide">{personaTitle}</h2>
                    <div className="flex gap-2">
                        <button className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 transition-colors">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-0">
                    <ReferralList
                        referrals={referrals}
                        loading={loading}
                        isRealtorMode={isRealtor}
                        onActionSuccess={handleActionComplete}
                    />
                </div>
            </div>
        </div>
    );
};
