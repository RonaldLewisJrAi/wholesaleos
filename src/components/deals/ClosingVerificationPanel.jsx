import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Key, CheckCircle, AlertCircle, Loader2, Play } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { triPartyVerificationService } from '../../services/triPartyVerificationService';

export default function ClosingVerificationPanel({ dealId }) {
    const { user } = useAuth();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initiating, setInitiating] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const isTitleCompany = user?.primaryPersona === 'TITLE_COMPANY';
    const isWholesaler = user?.primaryPersona === 'WHOLESALER';
    const isInvestor = user?.primaryPersona === 'INVESTOR';

    const fetchSession = useCallback(async () => {
        const data = await triPartyVerificationService.getVerificationSession(dealId);
        setSession(data);
    }, [dealId]);

    useEffect(() => {
        let isMounted = true;
        if (dealId) {
            triPartyVerificationService.getVerificationSession(dealId).then(data => {
                if (isMounted) {
                    setSession(data);
                    setLoading(false);
                }
            });
        }
        return () => { isMounted = false; };
    }, [dealId]);

    const handleInitiate = async () => {
        if (initiating) return; // Prevent double click duplicate requests
        setInitiating(true);
        setError('');
        const res = await triPartyVerificationService.initiateClosingVerification(dealId, user.id);
        if (res.success) {
            setSuccessMsg('Verification session initiated. Codes generated.');
            // MVP: Show codes in alert since no email service is hooked up
            const codeStr = res.codes.map(c => `${c.role}: ${c.code}`).join('\n');
            alert(`[MOCK EMAIL SEND]\n\nGenerated Codes:\n${codeStr}`);
            await fetchSession();
        } else {
            setError(res.error?.message || 'Failed to initiate session.');
        }
        setInitiating(false);
    };

    const handleVerify = async (role) => {
        if (!code || code.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }
        setVerifying(true);
        setError('');
        setSuccessMsg('');

        const res = await triPartyVerificationService.submitVerificationCode(dealId, role, code);

        if (res.success) {
            setSuccessMsg(`${role} Verified Successfully!`);
            setCode('');
            await fetchSession();
            if (res.isAllVerified) {
                alert("🎉 TRI-PARTY VERIFICATION COMPLETE. DEAL CLOSED.");
            }
        } else {
            setError(res.error || 'Verification failed.');
        }
        setVerifying(false);
    };

    if (loading) {
        return (
            <div className="glass-card p-6 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="glass-card p-6 border-blue-900/50">
                <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                    <Shield className="text-blue-500" size={20} />
                    Tri-Party Closing Verification
                </h3>
                <p className="text-gray-400 text-sm font-mono mb-4">
                    No verification session active for this deal. A Title Company must initiate the closing process.
                </p>
                {isTitleCompany && (
                    <button
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-mono tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2"
                        onClick={handleInitiate}
                        disabled={initiating}
                    >
                        {initiating ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                        Initiate Closing Session
                    </button>
                )}
            </div>
        );
    }

    const { wholesaler_status, investor_status, title_status, overall_status } = session;

    const renderStatusObj = (status) => {
        if (status === 'VERIFIED') return <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={14} /> Verified</span>;
        if (status === 'PENDING') return <span className="text-amber-400 flex items-center gap-1"><AlertCircle size={14} /> Pending</span>;
        return <span className="text-gray-500">{status}</span>;
    };

    const getActiveRoleKey = () => {
        if (isWholesaler) return 'WHOLESALER';
        if (isInvestor) return 'INVESTOR';
        if (isTitleCompany) return 'TITLE_COMPANY';
        return null;
    };

    const activeRoleKey = getActiveRoleKey();
    const activeStatus = activeRoleKey === 'WHOLESALER' ? wholesaler_status :
        activeRoleKey === 'INVESTOR' ? investor_status :
            activeRoleKey === 'TITLE_COMPANY' ? title_status : null;

    return (
        <div className="glass-card p-6 border-blue-900/50 relative overflow-hidden">
            {overall_status === 'VERIFIED_CLOSED' && (
                <div className="absolute inset-0 bg-emerald-900/20 backdrop-blur-sm z-10 flex flex-col items-center justify-center border-2 border-emerald-500/50 rounded-xl">
                    <Shield className="text-emerald-400 mb-2" size={48} />
                    <h3 className="text-2xl font-bold text-white tracking-widest uppercase text-shadow-glow-emerald">Verified Closed</h3>
                    <p className="text-emerald-300 font-mono mt-2">Tri-Party Consensus Reached</p>
                </div>
            )}

            <h3 className="text-white font-bold flex items-center gap-2 mb-6">
                <Shield className="text-blue-500" size={20} />
                Tri-Party Closing Verification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-0">
                <div className={`p-4 rounded-lg border ${wholesaler_status === 'VERIFIED' ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-[var(--bg-tertiary)] border-blue-900/30'}`}>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Wholesaler</div>
                    <div className="font-bold text-lg mb-1">{renderStatusObj(wholesaler_status)}</div>
                </div>

                <div className={`p-4 rounded-lg border ${investor_status === 'VERIFIED' ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-[var(--bg-tertiary)] border-blue-900/30'}`}>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Investor</div>
                    <div className="font-bold text-lg mb-1">{renderStatusObj(investor_status)}</div>
                </div>

                <div className={`p-4 rounded-lg border ${title_status === 'VERIFIED' ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-[var(--bg-tertiary)] border-blue-900/30'}`}>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Title Company</div>
                    <div className="font-bold text-lg mb-1">{renderStatusObj(title_status)}</div>
                </div>
            </div>

            {error && <div className="mb-4 bg-red-900/20 text-red-400 p-3 rounded border border-red-500/30 text-sm font-mono">{error}</div>}
            {successMsg && <div className="mb-4 bg-emerald-900/20 text-emerald-400 p-3 rounded border border-emerald-500/30 text-sm font-mono">{successMsg}</div>}

            {activeRoleKey && activeStatus === 'PENDING' && (
                <div className="bg-blue-900/10 p-5 rounded-lg border border-blue-500/20 mt-4">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Key size={16} className="text-blue-400" /> Enter Your {activeRoleKey} Code</h4>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="6-Digit Code"
                            className="bg-[var(--bg-secondary)] border border-blue-900/50 text-white px-4 py-2 rounded focus:outline-none focus:border-blue-500 font-mono flex-1 uppercase tracking-widest"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                            maxLength={6}
                        />
                        <button
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-mono font-bold tracking-widest uppercase transition-colors whitespace-nowrap"
                            onClick={() => handleVerify(activeRoleKey)}
                            disabled={verifying || code.length !== 6}
                        >
                            {verifying ? <Loader2 className="animate-spin inline" size={16} /> : 'Verify'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
