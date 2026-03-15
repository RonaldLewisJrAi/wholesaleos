import React, { useState } from 'react';
import { supabase as supabaseClient } from '../../lib/supabase';
import { useAuth } from '../../contexts/useAuth';
import { FileText, AlertTriangle, Home, Calendar, UploadCloud, CheckCircle, ShieldAlert, Zap, Loader2, X } from 'lucide-react';

const supabase = supabaseClient!;

interface SellerDistressUploadProps {
    leadId?: string; // Optional: If updating an existing lead
    onComplete?: () => void;
    onCancel?: () => void;
}

export const MotivatedSellerUpload: React.FC<SellerDistressUploadProps> = ({ leadId, onComplete, onCancel }) => {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    // Distress Flags
    const [flags, setFlags] = useState({
        tax_delinquent: false,
        code_violations: false,
        vacancy_indicator: false,
        auction_date: ''
    });

    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');

    const toggleFlag = (key: keyof typeof flags) => {
        if (key === 'auction_date') return;
        setFlags(prev => ({ ...prev, [key]: !prev[key as keyof typeof flags] }));
    };

    const calculateLiveScore = () => {
        let score = 0;
        if (flags.tax_delinquent) score += 35;
        if (flags.code_violations) score += 20;
        if (flags.vacancy_indicator) score += 25;
        if (flags.auction_date) {
            const days = (new Date(flags.auction_date).getTime() - Date.now()) / (1000 * 3600 * 24);
            if (days > 0 && days <= 30) score += 50;
            else if (days > 30 && days <= 90) score += 30;
        }
        return Math.min(100, score);
    };

    const currentScore = calculateLiveScore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                tax_delinquent: flags.tax_delinquent,
                code_violations: flags.code_violations,
                vacancy_indicator: flags.vacancy_indicator,
                auction_date: flags.auction_date ? new Date(flags.auction_date).toISOString() : null,
                distress_score: currentScore
            };

            if (leadId) {
                // Update existing lead
                await supabase.from('foreclosure_leads').update(payload).eq('id', leadId);
            } else {
                // Create new generic lead
                await supabase.from('foreclosure_leads').insert({
                    user_id: user?.id,
                    address: address || 'TBD (Distress Log)',
                    status: 'New',
                    ...payload
                });
            }

            if (onComplete) onComplete();
            else alert('Motivated Seller Data successfully committed to WholesaleOS.');

        } catch (err) {
            console.error(err);
            alert('Failed to log distress vectors.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 pulse-animation pointer-events-none" />
                <h2 className="text-xl font-bold text-white flex items-center gap-2 relative z-10">
                    <ShieldAlert className="text-red-500" />
                    Intake: Motivated Seller OSINT
                </h2>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="text-slate-400 hover:text-white relative z-10 transition-colors"
                        title="Close Intake Form"
                        aria-label="Close Intake Form"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-6">

                {!leadId && (
                    <div className="mb-6">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Property Address</label>
                        <input
                            type="text"
                            required
                            aria-label="Property Address"
                            title="Property Address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Enter Subject Property Address"
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                )}

                <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                        <Zap className="text-amber-400" size={16} /> Select Primary Distress Vectors
                    </h3>

                    <div className="flex flex-col gap-3">
                        <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${flags.tax_delinquent ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}>
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-amber-500 cursor-pointer"
                                checked={flags.tax_delinquent}
                                onChange={() => toggleFlag('tax_delinquent')}
                            />
                            <div>
                                <div className={`font-bold ${flags.tax_delinquent ? 'text-amber-400' : 'text-slate-300'}`}>Tax Delinquent</div>
                                <div className="text-xs text-slate-500">Property is behind on municipal tax assessments.</div>
                            </div>
                        </label>

                        <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${flags.code_violations ? 'bg-orange-900/20 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}>
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-orange-500 cursor-pointer"
                                checked={flags.code_violations}
                                onChange={() => toggleFlag('code_violations')}
                            />
                            <div>
                                <div className={`font-bold ${flags.code_violations ? 'text-orange-400' : 'text-slate-300'}`}>Active Code Violations</div>
                                <div className="text-xs text-slate-500">Subject has open municipal safety or structural code citations.</div>
                            </div>
                        </label>

                        <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${flags.vacancy_indicator ? 'bg-purple-900/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}>
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-purple-500 cursor-pointer"
                                checked={flags.vacancy_indicator}
                                onChange={() => toggleFlag('vacancy_indicator')}
                            />
                            <div>
                                <div className={`font-bold ${flags.vacancy_indicator ? 'text-purple-400' : 'text-slate-300'}`}>USPS Vacancy Flag</div>
                                <div className="text-xs text-slate-500">Mail forwarding elapsed or property marked physically vacant.</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Imminent Danger (Auction) */}
                <div className="mb-8 border-t border-slate-700/50 pt-6">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" size={14} /> Auction Date (If Applicable)
                    </label>
                    <input
                        type="date"
                        aria-label="Expected Foreclosure Auction Date"
                        title="Expected Foreclosure Auction Date"
                        value={flags.auction_date}
                        onChange={(e) => setFlags(prev => ({ ...prev, auction_date: e.target.value }))}
                        className={`w-full bg-slate-800 border rounded-lg px-4 py-3 text-white outline-none transition-all ${flags.auction_date ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-600 focus:border-red-500'}`}
                    />
                    <p className="text-xs text-slate-500 mt-2 italic">A scheduled foreclosure auction dramatically spikes the AI Deal Score priority.</p>
                </div>

                {/* Live Scoring Evaluation Panel */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 mb-6 flex justify-between items-center relative overflow-hidden">

                    {currentScore >= 75 && <div className="absolute inset-0 bg-red-500/10 pointer-events-none" />}
                    {currentScore >= 50 && currentScore < 75 && <div className="absolute inset-0 bg-amber-500/10 pointer-events-none" />}

                    <div className="relative z-10 w-full flex items-center justify-between">
                        <div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                                Projected Distress Score
                            </div>
                            <div className="text-xs text-slate-500 max-w-xs leading-relaxed">
                                This metadata will pipe directly into the master `DealEvaluatorEngine` to augment the final `ai_deal_score`.
                            </div>
                        </div>
                        <div className={`text-5xl font-black drop-shadow-md mx-4 ${currentScore >= 75 ? 'text-red-500' :
                            currentScore >= 50 ? 'text-amber-500' :
                                currentScore > 0 ? 'text-emerald-400' : 'text-slate-600'
                            }`}>
                            {currentScore}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-4 rounded-xl text-white font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${submitting ? 'bg-slate-700 cursor-not-allowed' :
                        currentScore >= 75 ? 'bg-red-600 hover:bg-red-500 shadow-red-900/50' :
                            currentScore >= 50 ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/50' :
                                'bg-blue-600 hover:bg-blue-500 shadow-blue-900/50'
                        }`}
                >
                    {submitting ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                    Commmit OSINT Data
                </button>
            </form>
        </div>
    );
};
