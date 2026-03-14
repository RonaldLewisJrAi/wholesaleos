import React, { useState, useEffect } from 'react';
import { X, Building, DollarSign, Send, Search } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { sendReferral } from '../../services/referralService';

export const SendReferralModal = ({ propertyId, onClose, onSuccess }: { propertyId: string, onClose: () => void, onSuccess: () => void }) => {
    const [realtors, setRealtors] = useState < any[] > ([]);
    const [selectedRealtorId, setSelectedRealtorId] = useState('');
    const [targetPrice, setTargetPrice] = useState('');
    const [feePct, setFeePct] = useState('25');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRealtors = async () => {
            try {
                // Fetch valid target Realtors mapped to the current tenant's Orgid
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: currentProfile } = await supabase
                    .from('profiles')
                    .select('org_id')
                    .eq('id', user.id)
                    .single();

                if (currentProfile?.org_id) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('id, first_name, last_name, email')
                        .eq('org_id', currentProfile.org_id)
                        .eq('primary_persona', 'REALTOR');

                    if (!error && data) {
                        setRealtors(data);
                    }
                }
            } catch (err) {
                console.error('Failed to load realtors', err);
            }
        };

        fetchRealtors();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedRealtorId) {
            setError('Please select a Realtor to receive the referral.');
            return;
        }

        setLoading(true);
        try {
            await sendReferral(
                propertyId,
                selectedRealtorId,
                parseFloat(feePct),
                notes,
                parseFloat(targetPrice)
            );
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('[SendReferralModal] Error:', err);
            setError(err.message || 'Failed to dispatch referral payload.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-[#0B1F33] border border-slate-700/50 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Send className="text-blue-500" size={20} />
                        Dispatch Referral
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* REALTOR SELECTION */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex justify-between">
                                Target Realtor
                                <span className="text-xs text-blue-400 font-mono">Organization Bound</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-500" />
                                </div>
                                <select
                                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none transition-colors"
                                    value={selectedRealtorId}
                                    onChange={(e) => setSelectedRealtorId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select a verified agent...</option>
                                    {realtors.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.first_name} {r.last_name} ({r.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* FINANCIALS */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Target Sale Price</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="350000"
                                        value={targetPrice}
                                        onChange={(e) => setTargetPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Commission Split %</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    required
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="25.0"
                                    value={feePct}
                                    onChange={(e) => setFeePct(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* NOTES */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Actionable Briefing</label>
                            <textarea
                                rows={3}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                placeholder="Property notes, seller motivation, Lockbox combo, etc."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <div className="pt-4 mt-6 border-t border-slate-800 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !selectedRealtorId || !targetPrice}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                        Dispatching...
                                    </>
                                ) : (
                                    <>
                                        Broadcast Network
                                        <Send size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
