import React, { useState } from 'react';
import { ShieldCheck, Search, Key, Lock, Check } from 'lucide-react';
import { titleService } from '../services/titleService';
import { useAuth } from '../contexts/useAuth';

const TitlePortal = () => {
    const { user } = useAuth();
    const [closingCode, setClosingCode] = useState('');
    const [deal, setDeal] = useState(null);
    const [codeId, setCodeId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLookup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setDeal(null);

        const res = await titleService.verifyClosingCode(closingCode);
        if (res.success) {
            setDeal(res.deal);
            setCodeId(res.codeId);
        } else {
            setError(res.error || 'Invalid or expired closing code.');
        }
        setLoading(false);
    };

    const handleAction = async (actionType) => {
        setLoading(true);
        const officerId = user?.id || 'title-officer-id';
        let res;

        if (actionType === 'ESCROW') {
            res = await titleService.confirmEscrow(deal.id, officerId);
            if (res.success) setDeal(prev => ({ ...prev, escrow_status: 'CONFIRMED' }));
        } else if (actionType === 'TITLE') {
            res = await titleService.verifyTitle(deal.id, officerId);
            if (res.success) setDeal(prev => ({ ...prev, title_status: 'CLEAR' }));
        } else if (actionType === 'CLOSE') {
            res = await titleService.closeDeal(deal.id, codeId, officerId, null);
            if (res.success) setDeal(prev => ({ ...prev, status: 'Closed' }));
        }

        if (res && !res.success) {
            alert('Action failed: ' + res.error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] p-8 text-white animate-fade-in font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
                    <div className="w-16 h-16 bg-[#131B2C] border border-gray-700 rounded-xl flex items-center justify-center shadow-2xl">
                        <Lock className="text-primary" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Title & Escrow Portal</h1>
                        <p className="text-gray-400 text-sm mt-1">Secure third-party verification environment for Wholesale OS transactions.</p>
                    </div>
                </div>

                {!deal ? (
                    <div className="bg-[#131B2C] border border-gray-800 rounded-xl p-8 shadow-xl max-w-lg mx-auto">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Key size={20} className="text-primary" /> Access File</h2>
                        <form onSubmit={handleLookup} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Closing Code</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-lg p-4 font-mono text-center text-2xl tracking-[0.2em] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:opacity-50"
                                    placeholder="XXXX-XXXX"
                                    value={closingCode}
                                    onChange={e => setClosingCode(e.target.value.toUpperCase())}
                                    disabled={loading}
                                />
                                <p className="text-xs text-muted mt-2 text-center">Use <strong className="text-white">TEST-CLOSING-CODE</strong> to bypass database check in sandbox.</p>
                            </div>
                            {error && <p className="text-danger text-sm font-bold bg-danger/10 border border-danger/20 p-3 rounded text-center">{error}</p>}
                            <button type="submit" className="w-full bg-primary text-bg-darker font-bold py-3 text-lg rounded-lg hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50 transition-all" disabled={loading || !closingCode}>
                                {loading ? 'Verifying Blockchain Registry...' : <><Search size={18} /> Locate Deal File</>}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 space-y-4">
                            <div className="bg-[#131B2C] border border-gray-800 rounded-xl p-6 shadow-xl">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Property Control</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Target Address</p>
                                        <p className="font-bold text-sm text-gray-100">{deal.address}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Current Protocol Status</p>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${deal.status === 'Closed' ? 'bg-success/20 text-success border border-success/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                                            {deal.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => { setDeal(null); setClosingCode(''); }} className="w-full py-3 bg-[#131B2C] border border-gray-800 hover:bg-gray-800 rounded-xl text-sm font-bold transition-colors text-gray-300">
                                Disconnect Session & Start Over
                            </button>
                        </div>

                        <div className="md:col-span-2 bg-[#131B2C] border border-gray-800 rounded-xl p-8 shadow-xl">
                            <h2 className="text-2xl font-bold mb-8 border-b border-gray-800 pb-4 flex items-center gap-3">
                                <ShieldCheck size={28} className="text-primary" /> Verification Pipeline
                            </h2>

                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">

                                {/* Step 1: Escrow */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${deal.escrow_status === 'CONFIRMED' ? 'bg-success border-success/30 text-bg-darker' : 'bg-[#131B2C] border-gray-700 text-gray-400'}`}>
                                        {deal.escrow_status === 'CONFIRMED' ? <Check size={18} /> : <span className="font-bold">1</span>}
                                    </div>
                                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl border shadow-sm ${deal.escrow_status === 'CONFIRMED' ? 'bg-success/5 border-success/20' : 'bg-[#0B0F19] border-gray-800'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className={`font-bold text-lg ${deal.escrow_status === 'CONFIRMED' ? 'text-success' : 'text-gray-200'}`}>Escrow Deposit</div>
                                            {deal.escrow_status === 'CONFIRMED' ? <span className="text-[10px] uppercase tracking-wider bg-success text-bg-darker px-2 py-0.5 rounded font-bold">Confirmed</span> : <span className="text-[10px] uppercase tracking-wider bg-warning text-bg-darker px-2 py-0.5 rounded font-bold">Pending</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">Verify receipt of non-refundable EMD from the investor into your corporate trust account.</p>
                                        {deal.escrow_status !== 'CONFIRMED' && (
                                            <button onClick={() => handleAction('ESCROW')} disabled={loading} className="text-xs font-bold py-2 px-4 bg-success text-bg-darker rounded hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                                Confirm Receipt
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: Title */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mt-6">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${deal.title_status === 'CLEAR' ? 'bg-success border-success/30 text-bg-darker' : 'bg-[#131B2C] border-gray-700 text-gray-400'}`}>
                                        {deal.title_status === 'CLEAR' ? <Check size={18} /> : <span className="font-bold">2</span>}
                                    </div>
                                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl border shadow-sm ${deal.title_status === 'CLEAR' ? 'bg-success/5 border-success/20' : 'bg-[#0B0F19] border-gray-800'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className={`font-bold text-lg ${deal.title_status === 'CLEAR' ? 'text-success' : 'text-gray-200'}`}>Clear Title Search</div>
                                            {deal.title_status === 'CLEAR' ? <span className="text-[10px] uppercase tracking-wider bg-success text-bg-darker px-2 py-0.5 rounded font-bold">Clear</span> : <span className="text-[10px] uppercase tracking-wider bg-warning text-bg-darker px-2 py-0.5 rounded font-bold">Pending</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">Verify property is free and clear of unresolvable liens, encumbrances, or chain of title defects.</p>
                                        {deal.title_status !== 'CLEAR' && (
                                            <button onClick={() => handleAction('TITLE')} disabled={loading || deal.escrow_status !== 'CONFIRMED'} className="text-xs font-bold py-2 px-4 bg-primary text-bg-darker rounded hover:brightness-110 disabled:opacity-50 transition-all">
                                                Mark Title Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Step 3: Close */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mt-6">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${deal.status === 'Closed' ? 'bg-success border-success/30 text-bg-darker' : 'bg-[#131B2C] border-gray-700 text-gray-400'}`}>
                                        {deal.status === 'Closed' ? <Check size={18} /> : <span className="font-bold">3</span>}
                                    </div>
                                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl border shadow-sm ${deal.status === 'Closed' ? 'bg-success/5 border-success/20' : 'bg-[#0B0F19] border-gray-800'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className={`font-bold text-lg ${deal.status === 'Closed' ? 'text-success' : 'text-gray-200'}`}>Final Transfer</div>
                                            {deal.status === 'Closed' ? <span className="text-[10px] uppercase tracking-wider bg-success text-bg-darker px-2 py-0.5 rounded font-bold">Completed</span> : <span className="text-[10px] uppercase tracking-wider bg-gray-600 text-white px-2 py-0.5 rounded font-bold">Locked</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">Execute final closing documents, disburse assignment fees to the wholesaler, and formalize transfer.</p>
                                        {deal.status !== 'Closed' && (
                                            <button onClick={() => handleAction('CLOSE')} disabled={loading || deal.escrow_status !== 'CONFIRMED' || deal.title_status !== 'CLEAR'} className="text-sm font-bold py-3 px-4 bg-blue-500 text-white rounded hover:bg-blue-400 disabled:opacity-50 w-full text-center mt-2 transition-all">
                                                Authorize Closing
                                            </button>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TitlePortal;
