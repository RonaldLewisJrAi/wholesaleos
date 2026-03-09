import React, { useState } from 'react';
import { List, Clock, Activity, AlertTriangle, UserPlus, CheckCircle, ShieldAlert } from 'lucide-react';

export const SuperAdminLogs = () => {
    const [logs] = useState([
        { id: '1', type: 'system', action: 'Global Scraper Limit Reset', entity: 'CRON', time: 'Just now', icon: <Activity size={16} className="text-blue-400" /> },
        { id: '2', type: 'verification', action: 'Escrow Confirmed: 123 Main St', entity: 'ronald_lewis_jr@live.com', time: '5m ago', icon: <CheckCircle size={16} className="text-green-400" /> },
        { id: '3', type: 'security', action: 'Suspended User: alice@invest.com', entity: 'Admin Console', time: '1hr ago', icon: <ShieldAlert size={16} className="text-yellow-400" /> },
        { id: '4', type: 'deal', action: 'Deal Locked: 321 Elm St', entity: 'john@wholesale.com', time: '2hrs ago', icon: <AlertTriangle size={16} className="text-orange-400" /> },
        { id: '5', type: 'user', action: 'New Wholesaler Registration', entity: 'newbie@flips.com', time: 'Yesterday', icon: <UserPlus size={16} className="text-purple-400" /> }
    ]);

    return (
        <div className="py-6 px-8 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-[#131B2C] border border-gray-800 rounded-xl p-6 shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <List className="text-indigo-400" size={28} />
                        System Activity Feed
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Immutable audit logs of all platform operations and administrative actions.</p>
                </div>
            </div>

            <div className="bg-[#131B2C] border border-gray-800 rounded-xl overflow-hidden shadow-xl p-4">
                <div className="space-y-4">
                    {logs.map(log => (
                        <div key={log.id} className="flex items-start gap-4 p-4 border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-[#0B0F19] flex items-center justify-center border border-gray-800 flex-shrink-0">
                                {log.icon}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">{log.action}</p>
                                <p className="text-xs text-gray-400 mt-1">Triggered by: <span className="font-mono text-gray-300">{log.entity}</span></p>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={12} /> {log.time}
                            </div>
                        </div>
                    ))}

                    <div className="text-center p-4">
                        <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                            Load historical logs...
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
