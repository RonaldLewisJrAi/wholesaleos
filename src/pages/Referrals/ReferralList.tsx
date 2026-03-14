import React from 'react';
import { Home, User, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { Referral, updateReferralStatus } from '../../services/referralService';

export const ReferralList = ({ referrals, loading, isRealtorMode, onActionSuccess }: { referrals: Referral[], loading: boolean, isRealtorMode: boolean, onActionSuccess: () => void }) => {

    const handleAction = async (id: string, newStatus: 'accepted' | 'declined') => {
        try {
            await updateReferralStatus(id, newStatus);
            onActionSuccess();
        } catch (err) {
            console.error('[ReferralList] Failed to update status:', err);
            alert('Error updating referral status.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p>Syncing network matrix...</p>
            </div>
        );
    }

    if (!referrals.length) {
        return (
            <div className="text-center py-24 text-slate-400">
                <Network className="mx-auto mb-4 opacity-50" size={48} />
                <p className="text-lg">No active referrals found in your network.</p>
                {!isRealtorMode && <p className="text-sm mt-2 opacity-75">Assign properties to realtors to begin tracking off-market handoffs.</p>}
            </div>
        );
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            case 'accepted': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
            case 'declined': return 'bg-red-500/20 text-red-500 border-red-500/30';
            case 'closed': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left col-collapse">
                <thead>
                    <tr className="bg-slate-800 border-b border-slate-700 text-slate-400 text-xs font-semibold tracking-wider uppercase">
                        <th className="p-4">Property</th>
                        <th className="p-4">{isRealtorMode ? 'Sent By' : 'Realtor'}</th>
                        <th className="p-4">Target Price</th>
                        <th className="p-4">Fee Split</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {referrals.map((ref) => {
                        const targetUser = isRealtorMode ? ref.referrer : ref.referred_to;

                        return (
                            <tr key={ref.id} className="border-b border-slate-700/50 hover:bg-slate-800/20 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Home size={18} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white truncate max-w-[200px]">
                                                {ref.property?.address || 'Unknown Address'}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate max-w-[200px]">
                                                {ref.property?.city}, {ref.property?.state} {ref.property?.zip}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-blue-400" />
                                        <span className="text-slate-300">
                                            {targetUser?.first_name} {targetUser?.last_name}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 truncate max-w-[150px]">
                                        {targetUser?.email}
                                    </p>
                                </td>

                                <td className="p-4">
                                    <span className="text-emerald-400 font-medium">
                                        ${ref.target_price?.toLocaleString()}
                                    </span>
                                </td>

                                <td className="p-4">
                                    <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-300">
                                        {ref.referral_fee_pct}%
                                    </span>
                                </td>

                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(ref.referral_status)} flex w-max items-center gap-1.5 capitalize`}>
                                        {ref.referral_status === 'pending' && <Clock size={12} />}
                                        {ref.referral_status === 'accepted' && <CheckCircle size={12} />}
                                        {ref.referral_status === 'declined' && <XCircle size={12} />}
                                        {ref.referral_status}
                                    </span>
                                </td>

                                <td className="p-4 text-right">
                                    {isRealtorMode && ref.referral_status === 'pending' ? (
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleAction(ref.id, 'accepted')}
                                                className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded border border-emerald-400/20 transition-colors"
                                                title="Accept Referral"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleAction(ref.id, 'declined')}
                                                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded border border-red-400/20 transition-colors"
                                                title="Decline Referral"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <ExternalLink size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
