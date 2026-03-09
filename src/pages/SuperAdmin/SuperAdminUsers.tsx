import React, { useState, useEffect } from 'react';
import { Users, Search, Filter } from 'lucide-react';

export const SuperAdminUsers = () => {
    const [users, setUsers] = useState([
        { id: '1', name: 'Ronald Lewis Jr', email: 'ronald_lewis_jr@live.com', role: 'Global Admin', status: 'Active', dealsPosted: 12, dealsClaimed: 5 },
        { id: '2', name: 'John Supplier', email: 'john@wholesale.com', role: 'Wholesaler', status: 'Active', dealsPosted: 45, dealsClaimed: 0 },
        { id: '3', name: 'Alice Capital', email: 'alice@invest.com', role: 'Investor', status: 'Suspended', dealsPosted: 0, dealsClaimed: 8 },
        { id: '4', name: 'Bob Flips', email: 'bob@spam.com', role: 'Wholesaler', status: 'Terminated', dealsPosted: 1, dealsClaimed: 0 }
    ]);

    const handleAction = (id: string, actionName: string) => {
        const u = users.find(user => user.id === id);
        if (!u) return;

        const confirmation = window.confirm(`Are you sure you want to ${actionName} user: ${u.email}?`);
        if (confirmation) {
            if (actionName === 'Terminate') {
                setUsers(prev => prev.map(usr => usr.id === id ? { ...usr, status: 'Terminated' } : usr));
            } else if (actionName === 'Suspend') {
                setUsers(prev => prev.map(usr => usr.id === id ? { ...usr, status: 'Suspended' } : usr));
            } else if (actionName === 'Restore') {
                setUsers(prev => prev.map(usr => usr.id === id ? { ...usr, status: 'Active' } : usr));
            }
        }
    };

    return (
        <div className="py-6 px-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-[#131B2C] border border-gray-800 rounded-xl p-6 shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Users className="text-indigo-400" size={28} />
                        Global User Management
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Audit, suspend, or terminate malicious actors.</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search by email..."
                            className="bg-[#0B0F19] border border-gray-700 rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 w-64"
                        />
                    </div>
                    <button className="btn btn-secondary flex items-center gap-2">
                        <Filter size={16} /> Filter
                    </button>
                </div>
            </div>

            <div className="bg-[#131B2C] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#0B0F19] border-b border-gray-800">
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Metrics</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {users.map(u => (
                            <tr key={u.id} className={`hover:bg-white/[0.02] transition-colors ${u.status !== 'Active' ? 'opacity-60 bg-red-900/10' : ''}`}>
                                <td className="p-4 text-sm font-medium text-white">{u.name}</td>
                                <td className="p-4 text-sm text-gray-400">{u.email}</td>
                                <td className="p-4 text-sm">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${u.role.includes('Admin') ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${u.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                                        u.status === 'Suspended' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-gray-400">
                                    <div className="flex gap-3">
                                        <span title="Deals Posted">P: <strong className="text-white">{u.dealsPosted}</strong></span>
                                        <span title="Deals Claimed">C: <strong className="text-white">{u.dealsClaimed}</strong></span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="btn btn-secondary text-xs py-1 px-3" onClick={() => handleAction(u.id, 'View')}>View</button>

                                        {u.status === 'Active' ? (
                                            <>
                                                <button className="btn btn-secondary text-xs py-1 px-3 text-yellow-500 hover:text-yellow-400 border-yellow-500/30" onClick={() => handleAction(u.id, 'Suspend')}>Suspend</button>
                                                <button className="btn btn-primary bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30 text-xs py-1 px-3" onClick={() => handleAction(u.id, 'Terminate')}>Terminate</button>
                                            </>
                                        ) : (
                                            <button className="btn btn-primary bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30 text-xs py-1 px-3" onClick={() => handleAction(u.id, 'Restore')}>Restore Access</button>
                                        )}
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
