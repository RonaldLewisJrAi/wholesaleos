import React, { useState, useEffect } from 'react';
import { CheckCircle, ShieldCheck, DollarSign, FileCheck, RefreshCw } from 'lucide-react';
import { databaseService } from '../../services/databaseService';

export const SuperAdminVerification = () => {
    const [queue, setQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadQueue = async () => {
        setLoading(true);
        try {
            // For the verification queue, we fetch all deals and filter those lacking complete verification
            const allDeals = await databaseService.getDeals();
            const pendingDeals = allDeals.filter(d =>
                !d.property_verified || !d.escrow_paid || !d.title_verified
            );
            setQueue(pendingDeals);
        } catch (err) {
            console.error("Failed to load verification queue", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQueue();
    }, []);

    const handleVerificationTrigger = async (dealId: string, type: 'property' | 'escrow' | 'title') => {
        try {
            let updatedDeal;
            if (type === 'property') {
                updatedDeal = await databaseService.setPropertyVerified(dealId);
            } else if (type === 'escrow') {
                updatedDeal = await databaseService.setEscrowPaid(dealId);
            } else if (type === 'title') {
                updatedDeal = await databaseService.setTitleVerified(dealId);
            }

            if (updatedDeal) {
                // Instantly update local state to reflect the change
                setQueue(prev => prev.map(d => d.id === dealId ? { ...d, ...updatedDeal } : d).filter(d =>
                    !d.property_verified || !d.escrow_paid || !d.title_verified
                ));
            }
        } catch (err: any) {
            alert(`Verification failed: ${err.message}`);
        }
    };

    return (
        <div className="py-6 px-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-[#131B2C] border border-gray-800 rounded-xl p-6 shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <CheckCircle className="text-green-400" size={28} />
                        Verification Action Queue
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Manually triage and trigger database boolean flags for pending deals.</p>
                </div>
                <button className="btn btn-secondary flex items-center gap-2" onClick={loadQueue}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Queue
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="text-center p-8 text-gray-500 border border-gray-800 rounded-xl border-dashed">Loading queue payloads...</div>
                ) : queue.length === 0 ? (
                    <div className="text-center p-12 text-gray-500 bg-[#131B2C] border border-gray-800 rounded-xl">
                        <CheckCircle size={48} className="mx-auto text-green-500/20 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Queue is zero</h3>
                        <p>All active marketplace deals are fully verified.</p>
                    </div>
                ) : queue.map(deal => (
                    <div key={deal.id} className="bg-[#131B2C] border border-gray-800 rounded-xl p-5 shadow-xl flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={deal.imageUrl} alt={deal.address} className="w-full h-full object-cover opacity-80" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{deal.address}</h3>
                                <div className="text-sm text-gray-400 flex gap-4 mt-1">
                                    <span>Added by: <strong className="text-gray-300">{deal.wholesalerName || 'Unknown'}</strong></span>
                                    <span>Status: <strong className="text-gray-300">{deal.status}</strong></span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    {deal.property_verified ? <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] uppercase font-bold rounded">Property Verified</span> : <span className="px-2 py-1 bg-gray-800 text-gray-500 text-[10px] uppercase font-bold rounded">Property Pending</span>}
                                    {deal.escrow_paid ? <span className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] uppercase font-bold rounded">Escrow Paid</span> : <span className="px-2 py-1 bg-gray-800 text-gray-500 text-[10px] uppercase font-bold rounded">Escrow Pending</span>}
                                    {deal.title_verified ? <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] uppercase font-bold rounded">Title Verified</span> : <span className="px-2 py-1 bg-gray-800 text-gray-500 text-[10px] uppercase font-bold rounded">Title Pending</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <button
                                className={`btn ${deal.property_verified ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'} text-xs w-full flex justify-between items-center`}
                                onClick={() => !deal.property_verified && handleVerificationTrigger(deal.id, 'property')}
                                disabled={deal.property_verified}
                            >
                                Verify Property <ShieldCheck size={16} />
                            </button>
                            <button
                                className={`btn ${deal.escrow_paid ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'} text-xs w-full flex justify-between items-center`}
                                onClick={() => !deal.escrow_paid && handleVerificationTrigger(deal.id, 'escrow')}
                                disabled={deal.escrow_paid}
                            >
                                Confirm Escrow <DollarSign size={16} />
                            </button>
                            <button
                                className={`btn ${deal.title_verified ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'} text-xs w-full flex justify-between items-center`}
                                onClick={() => !deal.title_verified && handleVerificationTrigger(deal.id, 'title')}
                                disabled={deal.title_verified}
                            >
                                Clear Title <FileCheck size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
