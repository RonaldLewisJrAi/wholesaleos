import React, { useState } from 'react';
import { Users, ShieldAlert, Key, Activity, Database, Ban, Unlock, RefreshCw, MoreVertical, CreditCard, Terminal, Power, Clock } from 'lucide-react';
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

    // Phase 29: Scraper Configuration State
    const [scraperConfigs, setScraperConfigs] = useState([
        { id: 'sc-1', name: 'Rutherford Courthouse Crawler', active: true, limit: 200, type: 'pdfplumber', lastRun: '10m ago' },
        { id: 'sc-2', name: 'Zillow Dynamic Comp Proxy', active: true, limit: 1000, type: 'node', lastRun: 'Live' },
        { id: 'sc-3', name: 'Propwire Bulk APN Scanner', active: false, limit: 500, type: 'api', lastRun: 'Offline' }
    ]);

    // Phase 32: System Observability State
    const [healthMetrics] = useState({
        failedWebhooks: 3,
        dlqSize: 12,
        rateLimitBreaches: 45,
        apiRequestsToday: 12405,
        activeOrgs: 142,
        seatUtilization: '85%'
    });

    const [selectedUser, setSelectedUser] = useState(null);

    const handleAction = (userId, action) => {
        alert(`Admin Action: [${action}] executed on User ID: ${userId}. Normally this would fire an API call to bypass RLS.`);
    };

    const toggleScraperStatus = (id) => {
        setScraperConfigs(configs => configs.map(config =>
            config.id === id ? { ...config, active: !config.active } : config
        ));
        alert("Global Configuration Updated: Kill-switch engaged/disengaged. Changes routed to scraper_admin_config table.");
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
                                                        <span className="text-xs font-bold text-muted uppercase tracking-wider">Org Subscription Controls</span>
                                                    </div>
                                                    <button className="dropdown-item text-success" onClick={() => handleAction(user.id, 'Force Resume Subscription')}>
                                                        <RefreshCw size={14} /> Force Resume
                                                    </button>
                                                    <button className="dropdown-item text-warning" onClick={() => handleAction(user.id, 'Extend Grace Period')}>
                                                        <Clock size={14} /> Extend Grace Period
                                                    </button>
                                                    <button className="dropdown-item text-info" onClick={() => handleAction(user.id, 'Unlock All Seats')}>
                                                        <Unlock size={14} /> Unlock All Seats
                                                    </button>
                                                    <button className="dropdown-item text-muted" onClick={() => handleAction(user.id, 'Adjust Data Retention')}>
                                                        <Database size={14} /> Adjust Retention Window
                                                    </button>
                                                    <button className="dropdown-item text-warning" onClick={() => handleAction(user.id, 'Suspend Account')}>
                                                        <Ban size={14} /> Suspend Access
                                                    </button>
                                                    <button className="dropdown-item text-danger font-bold hover:bg-danger/20" onClick={() => handleAction(user.id, 'Emergency Terminate')}>
                                                        <ShieldAlert size={14} /> EMERGENCY TERMINATE
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

                {/* Phase 29: Scraper Containment Panel */}
                <div className="card glass-panel p-5 scraper-panel border-danger/30 shadow-[0_0_15px_rgba(239,68,68,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-danger"></div>
                    <div className="flex-between mb-4 pl-2">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-danger"><Terminal size={18} /> Scraper Containment Wall</h3>
                        <span className="badge bg-danger/20 text-danger text-xs border border-danger/50 animate-pulse">LIVE</span>
                    </div>
                    <p className="text-sm text-muted mb-4 pl-2">Global kill-switches and rate throttling to protect scraping infrastructure from bot bans.</p>

                    <div className="space-y-3 pl-2">
                        {scraperConfigs.map(config => (
                            <div key={config.id} className="flex-between p-3 bg-[rgba(0,0,0,0.2)] rounded border border-[var(--border-light)]">
                                <div>
                                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                                        {config.name}
                                        <span className={`badge text-[10px] ${config.active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                            {config.active ? 'ACTIVE' : 'OFFLINE'}
                                        </span>
                                    </h4>
                                    <div className="flex gap-3 text-xs text-muted mt-1">
                                        <span>Limit: {config.limit}/hr</span>
                                        <span>Engine: {config.type}</span>
                                        <span>Last Ping: {config.lastRun}</span>
                                    </div>
                                </div>
                                <button
                                    className={`icon-btn p-2 rounded-full ${config.active ? 'bg-success/20 text-success hover:bg-danger/80 hover:text-white' : 'bg-danger/20 text-danger hover:bg-success/80 hover:text-white'}`}
                                    onClick={() => toggleScraperStatus(config.id)}
                                    title={config.active ? 'Kill Scraper' : 'Revive Scraper'}
                                >
                                    <Power size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Phase 32: System Health & Observability Center */}
                <div className="card glass-panel p-5 col-span-2 border-info/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <div className="flex-between mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-info"><Activity size={18} /> System Observability Center</h3>
                        <span className="text-xs text-muted">Real-time Telemetry</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-[var(--surface-dark)] p-3 rounded border border-[var(--border-light)]">
                            <span className="text-xs text-muted uppercase tracking-wider block mb-1">Failed Webhooks (24h)</span>
                            <span className="text-2xl font-bold text-danger">{healthMetrics.failedWebhooks}</span>
                        </div>
                        <div className="bg-[var(--surface-dark)] p-3 rounded border border-[var(--border-light)]">
                            <span className="text-xs text-muted uppercase tracking-wider block mb-1">Dead-Letter Queue</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-warning">{healthMetrics.dlqSize}</span>
                                <button className="btn btn-secondary text-[10px] py-1 px-2 h-auto" onClick={() => alert('Retrying DLQ payloads...')}>Retry All</button>
                            </div>
                        </div>
                        <div className="bg-[var(--surface-dark)] p-3 rounded border border-[var(--border-light)]">
                            <span className="text-xs text-muted uppercase tracking-wider block mb-1">Rate Limit Breaches</span>
                            <span className="text-2xl font-bold text-warning">{healthMetrics.rateLimitBreaches}</span>
                        </div>
                        <div className="bg-[var(--surface-dark)] p-3 rounded border border-[var(--border-light)]">
                            <span className="text-xs text-muted uppercase tracking-wider block mb-1">API Volume (24h)</span>
                            <span className="text-2xl font-bold text-success">{healthMetrics.apiRequestsToday.toLocaleString()}</span>
                        </div>
                        <div className="bg-[var(--surface-dark)] p-3 rounded border border-[var(--border-light)]">
                            <span className="text-xs text-muted uppercase tracking-wider block mb-1">Active Orgs</span>
                            <span className="text-2xl font-bold">{healthMetrics.activeOrgs}</span>
                        </div>
                        <div className="bg-[var(--surface-dark)] p-3 rounded border border-[var(--border-light)]">
                            <span className="text-xs text-muted uppercase tracking-wider block mb-1">Seat Utilization</span>
                            <span className="text-2xl font-bold">{healthMetrics.seatUtilization}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="btn btn-secondary" onClick={() => alert("Navigating to System Logs")}>View Detailed System Logs</button>
                        <button className="btn btn-secondary" onClick={() => alert("Navigating to Feature Flag Audit")}>Feature Flag Audit Trail</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
