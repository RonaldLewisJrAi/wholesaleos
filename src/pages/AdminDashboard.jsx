import React, { useState } from 'react';
import { Users, ShieldAlert, Key, Activity, Database, Ban, Unlock, RefreshCw, MoreVertical, CreditCard } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
    // Mock Data reflecting Phase 21 database structure
    const [users] = useState([
        {
            id: 'u-1',
            email: 'ronald_lewis_jr@live.com',
            name: 'Ronald Lewis',
            tier: 'SUPER',
            status: 'Active',
            docCount: 142,
            revenue: '$3,000',
            signupDate: '2026-01-15',
            lastLogin: 'Today, 08:30 AM',
            ip: '192.168.1.45',
            isAdmin: true
        },
        {
            id: 'u-2',
            email: 'investor_john@example.com',
            name: 'John Smith',
            tier: 'ADVANCED',
            status: 'Active',
            docCount: 18,
            revenue: '$1,500',
            signupDate: '2026-02-01',
            lastLogin: 'Yesterday, 14:20 PM',
            ip: '68.45.2.19',
            isAdmin: false
        },
        {
            id: 'u-3',
            email: 'sarah_wholesaler@example.com',
            name: 'Sarah Jenkins',
            tier: 'BASIC',
            status: 'Suspended',
            docCount: 5,
            revenue: '$100',
            signupDate: '2026-02-10',
            lastLogin: 'Feb 20, 2026',
            ip: '104.28.14.9',
            isAdmin: false
        }
    ]);

    const [selectedUser, setSelectedUser] = useState(null);

    const handleAction = (userId, action) => {
        alert(`Admin Action: [${action}] executed on User ID: ${userId}. Normally this would fire an API call to bypass RLS.`);
    };

    return (
        <div className="admin-dashboard animate-fade-in">
            <div className="admin-header">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <ShieldAlert className="text-danger" size={32} />
                        Platform Administration
                    </h1>
                    <p className="text-muted mt-2">Global system configuration, user lifecycle management, and Stripe override controls.</p>
                </div>
                <div className="admin-stats flex gap-4">
                    <div className="stat-badge">
                        <span className="text-xs text-muted block uppercase font-bold">Total Users</span>
                        <span className="text-xl font-bold">1,204</span>
                    </div>
                    <div className="stat-badge">
                        <span className="text-xs text-muted block uppercase font-bold">MRR</span>
                        <span className="text-xl font-bold text-success">$42,500</span>
                    </div>
                </div>
            </div>

            <div className="card glass-panel mt-6">
                <div className="p-5 border-b border-[var(--border-light)] flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Users size={20} /> User Directory & Subscriptions</h2>
                    <button className="btn btn-secondary text-sm"><RefreshCw size={14} /> Sync Stripe Webhooks</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="admin-table w-full text-left">
                        <thead>
                            <tr>
                                <th>User / Email</th>
                                <th>Tier</th>
                                <th>Status</th>
                                <th>Doc Usage</th>
                                <th>Revenue</th>
                                <th>Last Login / IP</th>
                                <th className="text-right">Admin Controls</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className={user.isAdmin ? 'admin-row' : ''}>
                                    <td>
                                        <div className="font-bold">{user.name} {user.isAdmin && <span className="badge-admin">ADMIN</span>}</div>
                                        <div className="text-xs text-muted">{user.email}</div>
                                        <div className="text-[10px] text-muted mt-1 font-mono">ID: {user.id}</div>
                                    </td>
                                    <td>
                                        <span className={`tier-badge tier-${user.tier.toLowerCase()}`}>{user.tier}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${user.status.toLowerCase()}`}>{user.status}</span>
                                    </td>
                                    <td>
                                        <div className="font-mono">{user.docCount} <span className="text-muted text-xs">generated</span></div>
                                    </td>
                                    <td className="font-bold text-success">{user.revenue}</td>
                                    <td>
                                        <div className="text-sm">{user.lastLogin}</div>
                                        <div className="text-xs text-muted font-mono">{user.ip}</div>
                                    </td>
                                    <td className="text-right align-middle">
                                        <div className="dropdown-container inline-block">
                                            <button className="icon-btn-small hover:bg-[var(--surface-light)]" onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}>
                                                <MoreVertical size={16} />
                                            </button>

                                            {selectedUser === user.id && (
                                                <div className="dropdown-menu admin-actions-dropdown animate-fade-in right-0">
                                                    <div className="dropdown-header text-left">
                                                        <span className="text-xs font-bold text-muted uppercase tracking-wider">Overrides</span>
                                                    </div>
                                                    <button className="dropdown-item" onClick={() => handleAction(user.id, 'Reset Usage Count')}>
                                                        <Database size={14} /> Reset Doc Count
                                                    </button>
                                                    <button className="dropdown-item text-primary" onClick={() => handleAction(user.id, 'Grant Promo Upgrade')}>
                                                        <Unlock size={14} /> Grant Promo Upgrade
                                                    </button>
                                                    <button className="dropdown-item" onClick={() => handleAction(user.id, 'Manual Stripe Sync')}>
                                                        <CreditCard size={14} /> Force Stripe Sync
                                                    </button>
                                                    <div className="dropdown-divider"></div>
                                                    <div className="dropdown-header text-left">
                                                        <span className="text-xs font-bold text-muted uppercase tracking-wider">Lifecycle</span>
                                                    </div>
                                                    <button className="dropdown-item text-warning" onClick={() => handleAction(user.id, 'Suspend User')}>
                                                        <Ban size={14} /> Suspend Account
                                                    </button>
                                                    <button className="dropdown-item text-danger" onClick={() => handleAction(user.id, 'Terminate User')}>
                                                        <ShieldAlert size={14} /> Terminate Account
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="card glass-panel p-5">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Key size={18} /> Demo Access Codes</h3>
                    <p className="text-sm text-muted mb-4">Generate temporary bypass codes to grant users temporary access to higher tiers without a Stripe checkout.</p>
                    <button className="btn btn-secondary w-full" onClick={() => alert("Code generation modal opened")}>Generate Live Access Code</button>
                </div>

                <div className="card glass-panel p-5">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Activity size={18} /> System Security Logs</h3>
                    <p className="text-sm text-muted mb-4">Monitor RLS bypass attempts, bulk PDF generation endpoints, and Stripe webhook failures.</p>
                    <button className="btn btn-secondary w-full" onClick={() => alert("Navigating to comprehensive audit logs")}>View Audit Logs</button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
