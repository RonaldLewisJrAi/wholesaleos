import React, { useState } from 'react';
import { FileText, Search, ShieldAlert, Lock, Trash2, Eye } from 'lucide-react';

export const SuperAdminDeals = () => {
    const [deals, setDeals] = useState([
        { id: 'd1', property: '123 Main St', city: 'Nashville, TN', wholesaler: 'John Supplier', score: 92, status: 'Active', claimStatus: 'Available' },
        { id: 'd2', property: '456 Oak Ave', city: 'Atlanta, GA', wholesaler: 'Bob Flips', score: 45, status: 'Flagged', claimStatus: 'Available' },
        { id: 'd3', property: '789 Pine Rd', city: 'Austin, TX', wholesaler: 'Ronald Lewis Jr', score: 98, status: 'Active', claimStatus: 'Claimed (Escrow)' },
        { id: 'd4', property: '321 Elm St', city: 'Denver, CO', wholesaler: 'John Supplier', score: 88, status: 'Locked', claimStatus: 'Closed' }
    ]);

    const handleAction = (id: string, actionName: string) => {
        const d = deals.find(deal => deal.id === id);
        if (!d) return;

        const confirmation = window.confirm(`Are you sure you want to ${actionName} deal: ${d.property}?`);
        if (confirmation) {
            if (actionName === 'Lock') {
                setDeals(prev => prev.map(deal => deal.id === id ? { ...deal, status: 'Locked' } : deal));
            } else if (actionName === 'Flag') {
                setDeals(prev => prev.map(deal => deal.id === id ? { ...deal, status: 'Flagged' } : deal));
            } else if (actionName === 'Remove') {
                setDeals(prev => prev.filter(deal => deal.id !== id));
            }
        }
    };

    return (
        <div className="py-6 px-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-[#131B2C] border border-gray-800 rounded-xl p-6 shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileText className="text-blue-400" size={28} />
                        Global Deal Audit
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Monitor, flag, or completely remove active marketplace listings.</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search properties or cities..."
                            className="bg-[#0B0F19] border border-gray-700 rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-[#131B2C] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#0B0F19] border-b border-gray-800">
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Property</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Wholesaler</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Score</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">System Status</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Claim Status</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {deals.map(d => (
                            <tr key={d.id} className={`hover:bg-white/[0.02] transition-colors ${d.status === 'Flagged' ? 'bg-red-900/10' : ''}`}>
                                <td className="p-4">
                                    <div className="text-sm font-bold text-white">{d.property}</div>
                                    <div className="text-xs text-gray-500">{d.city}</div>
                                </td>
                                <td className="p-4 text-sm text-gray-300">{d.wholesaler}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${d.score >= 90 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                        d.score >= 70 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                            'bg-red-500/20 text-red-400 border border-red-500/30'
                                        }`}>
                                        {d.score}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${d.status === 'Active' ? 'text-gray-300' :
                                        d.status === 'Locked' ? 'bg-gray-800 text-gray-400' :
                                            'bg-red-500/20 text-red-400 flex items-center gap-1 w-max'
                                        }`}>
                                        {d.status === 'Flagged' && <ShieldAlert size={12} />}
                                        {d.status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-400">{d.claimStatus}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="btn btn-secondary text-xs px-2 py-1" onClick={() => handleAction(d.id, 'View')} title="View Deal" aria-label="View Deal"><Eye size={16} /></button>

                                        {d.status !== 'Locked' && (
                                            <button className="btn btn-secondary text-xs px-2 py-1 text-yellow-500 hover:text-yellow-400 border-yellow-500/30" onClick={() => handleAction(d.id, 'Lock')} title="Lock Deal"><Lock size={16} /></button>
                                        )}

                                        {d.status !== 'Flagged' && (
                                            <button className="btn btn-secondary text-xs px-2 py-1 text-red-400 hover:text-red-300 border-red-500/30" onClick={() => handleAction(d.id, 'Flag')}>Flag</button>
                                        )}

                                        <button className="btn btn-primary bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30 text-xs px-2 py-1" onClick={() => handleAction(d.id, 'Remove')} title="Delete Deal permanently"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
