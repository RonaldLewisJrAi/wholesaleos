import React, { useState } from 'react';
import { Users, ShieldAlert, Key, Database, Ban, RefreshCw, MoreVertical, CreditCard, Terminal, Power, Building, Edit } from 'lucide-react';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
    // Mock Data reflecting Phase 30 multi-persona database structure
    const [organizations] = useState([
        {
            id: 'org-1',
            name: 'Wholesale Mavericks LLC',
            tier: 'SUPER',
            status: 'active',
            teamSize: 4,
            seatLimit: 10,
            revenue: '$497',
            stripeSync: 'Synced 1m ago',
            scraperUsage: '45% (450/1000)',
            enabledPersonas: ['WHOLESALER', 'REALTOR', 'INVESTOR', 'VIRTUAL_ASSISTANT']
        },
        {
            id: 'org-2',
            name: 'Solo Flips',
            tier: 'BASIC',
            status: 'active',
            teamSize: 1,
            seatLimit: 1,
            revenue: '$97',
            stripeSync: 'Synced 1hr ago',
            scraperUsage: '10% (10/100)',
            enabledPersonas: ['WHOLESALER']
        },
        {
            id: 'org-3',
            name: 'Nashville Invest Co',
            tier: 'PRO',
            status: 'suspended',
            teamSize: 3,
            seatLimit: 3,
            revenue: '$0 (Past Due)',
            stripeSync: 'Failed',
            scraperUsage: '0%',
            enabledPersonas: ['WHOLESALER', 'INVESTOR']
        }
    ]);

    const [users] = useState([
        {
            id: 'u-1',
            email: 'admin@wholesale-os.com',
            name: 'Platform Admin',
            org: 'Wholesale Mavericks LLC',
            primaryPersona: 'WHOLESALER',
            role: 'ADMIN',
            status: 'Active',
            lastLogin: 'Today, 08:30 AM',
            isSuperAdmin: true
        },
        {
            id: 'u-2',
            email: 'va@example.com',
            name: 'Remote Caller',
            org: 'Wholesale Mavericks LLC',
            primaryPersona: 'VIRTUAL_ASSISTANT',
            role: 'MEMBER',
            status: 'Active',
            lastLogin: 'Today, 09:15 AM',
            isSuperAdmin: false
        }
    ]);

    // Phase 29 & 30: Scraper & Feature Flag Configuration State
    const [scraperConfigs, setScraperConfigs] = useState([
        { id: 'sc-1', name: 'Rutherford Courthouse Crawler', active: true, limit: 200, type: 'pdfplumber', lastRun: '10m ago' },
        { id: 'sc-2', name: 'Zillow Dynamic Comp Proxy', active: true, limit: 1000, type: 'node', lastRun: 'Live' }
    ]);

    const [featureFlags, setFeatureFlags] = useState([
        { id: 'ff-1', name: 'Global Liquidity Engine', active: true },
        { id: 'ff-2', name: 'New AI Escrow Extraction', active: false },
        { id: 'ff-3', name: 'Realtor Referral Bridge', active: true }
    ]);

    const [selectedItem, setSelectedItem] = useState(null);
    const [viewMode, setViewMode] = useState('organizations'); // 'organizations' or 'users'

    const handleAction = (id, action) => {
        alert(`Admin Action: [${action}] executed on ID: ${id}. Normally this would fire a secure API call bypassing RLS.`);
    };

    const toggleScraperStatus = (id) => {
        setScraperConfigs(configs => configs.map(config =>
            config.id === id ? { ...config, active: !config.active } : config
        ));
        alert("Global Configuration Updated: Scraper kill-switch toggled.");
    };

    const toggleFeatureFlag = (id) => {
        setFeatureFlags(flags => flags.map(flag =>
            flag.id === id ? { ...flag, active: !flag.active } : flag
        ));
        alert("Global Feature Flag Updated.");
    };

    return (
        <div className="admin-dashboard animate-fade-in">
            <div className="admin-header">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <ShieldAlert className="text-danger" size={32} />
                        Super Admin Terminal
                    </h1>
                    <p className="text-muted mt-2">Bypass RLS and manage global organization parameters, tiers, and system configuration.</p>
                </div>
                <div className="admin-stats flex gap-4">
                    <div className="stat-badge">
                        <span className="text-xs text-muted block uppercase font-bold">Total MRR</span>
                        <span className="text-xl font-bold text-success">$42,500</span>
                    </div>
                    <div className="stat-badge">
                        <span className="text-xs text-muted block uppercase font-bold">Active Orgs</span>
                        <span className="text-xl font-bold text-info">204</span>
                    </div>
                </div>
            </div>

            <div className="card glass-panel mt-6">
                <div className="p-5 border-b border-[var(--border-light)] flex justify-between items-center bg-gradient-to-r from-[rgba(239,68,68,0.1)] to-transparent">
                    <div className="flex gap-4">
                        <button
                            className={`text-lg font-bold flex items-center gap-2 pb-1 ${viewMode === 'organizations' ? 'border-b-2 border-primary text-primary' : 'text-muted'}`}
                            onClick={() => setViewMode('organizations')}
                        >
                            <Building size={20} /> Organizations
                        </button>
                        <button
                            className={`text-lg font-bold flex items-center gap-2 pb-1 ${viewMode === 'users' ? 'border-b-2 border-primary text-primary' : 'text-muted'}`}
                            onClick={() => setViewMode('users')}
                        >
                            <Users size={20} /> Identity & Access
                        </button>
                    </div>
                    <button className="btn btn-secondary text-sm"><RefreshCw size={14} /> Global Stripe Sync</button>
                </div>

                <div className="overflow-x-auto">
                    {viewMode === 'organizations' ? (
                        <table className="admin-table w-full text-left">
                            <thead>
                                <tr>
                                    <th>Organization Name</th>
                                    <th>Subscription Tier</th>
                                    <th>Status & Stripe Sync</th>
                                    <th>Team Seats</th>
                                    <th>Enabled Personas</th>
                                    <th className="text-right">Overrides</th>
                                </tr>
                            </thead>
                            <tbody>
                                {organizations.map(org => (
                                    <tr key={org.id} className={org.status === 'suspended' ? 'opacity-70' : ''}>
                                        <td>
                                            <div className="font-bold">{org.name}</div>
                                            <div className="text-[10px] text-muted mt-1 font-mono">ID: {org.id}</div>
                                            <div className="text-xs text-success font-bold mt-1">{org.revenue}</div>
                                        </td>
                                        <td>
                                            <span className={`tier-badge tier-${org.tier.toLowerCase()}`}>{org.tier}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${org.status.toLowerCase()} mb-1 inline-block`}>{org.status}</span>
                                            <div className="text-xs text-muted flex items-center gap-1"><RefreshCw size={10} /> {org.stripeSync}</div>
                                        </td>
                                        <td>
                                            <div className="font-mono">{org.teamSize} / {org.seatLimit}</div>
                                            <div className="text-xs text-muted">{org.scraperUsage} API</div>
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {org.enabledPersonas.map(p => (
                                                    <span key={p} className="text-[9px] bg-[var(--surface-dark)] border border-[var(--border-light)] px-1 rounded">{p}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="text-right align-middle">
                                            <div className="dropdown-container inline-block">
                                                <button className="icon-btn-small hover:bg-[var(--surface-light)]" onClick={() => setSelectedItem(selectedItem === org.id ? null : org.id)}>
                                                    <MoreVertical size={16} />
                                                </button>

                                                {selectedItem === org.id && (
                                                    <div className="dropdown-menu admin-actions-dropdown animate-fade-in right-0">
                                                        <div className="dropdown-header text-left">
                                                            <span className="text-xs font-bold text-muted uppercase tracking-wider">Billing & Limits</span>
                                                        </div>
                                                        <button className="dropdown-item text-primary" onClick={() => handleAction(org.id, 'Override Subscription Tier')}>
                                                            <Key size={14} /> Override Subscription Tier
                                                        </button>
                                                        <button className="dropdown-item" onClick={() => handleAction(org.id, 'Reset Org Usage')}>
                                                            <Database size={14} /> Reset Doc/API Limits
                                                        </button>
                                                        <div className="dropdown-divider"></div>
                                                        <div className="dropdown-header text-left">
                                                            <span className="text-xs font-bold text-muted uppercase tracking-wider">Configuration</span>
                                                        </div>
                                                        <button className="dropdown-item" onClick={() => handleAction(org.id, 'Modify Feature Flags')}>
                                                            <Terminal size={14} /> Modify Feature Flags
                                                        </button>
                                                        <button className="dropdown-item" onClick={() => handleAction(org.id, 'Override Allowed Personas')}>
                                                            <Edit size={14} /> Override Allowed Personas
                                                        </button>
                                                        <div className="dropdown-divider"></div>
                                                        <button className="dropdown-item text-warning" onClick={() => handleAction(org.id, 'Suspend Organization')}>
                                                            <Ban size={14} /> Suspend Organization
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="admin-table w-full text-left">
                            <thead>
                                <tr>
                                    <th>User Name / Email</th>
                                    <th>Organization</th>
                                    <th>Primary Persona</th>
                                    <th>Role / Access</th>
                                    <th>Last Login</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className={user.isSuperAdmin ? 'bg-danger/10' : ''}>
                                        <td>
                                            <div className="font-bold flex items-center gap-2">
                                                {user.name}
                                                {user.isSuperAdmin && <span className="badge-admin">GLOBAL ADMIN</span>}
                                            </div>
                                            <div className="text-xs text-muted">{user.email}</div>
                                        </td>
                                        <td>
                                            <span className="text-sm">{user.org}</span>
                                        </td>
                                        <td>
                                            <span className="badge bg-primary/20 text-primary border border-primary/30 text-xs">
                                                {user.primaryPersona}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="text-sm font-bold">{user.role}</div>
                                            <div className="text-xs text-muted">{user.status}</div>
                                        </td>
                                        <td>
                                            <div className="text-sm">{user.lastLogin}</div>
                                        </td>
                                        <td className="text-right align-middle">
                                            <button className="btn btn-secondary text-xs" onClick={() => handleAction(user.id, 'Audit Persona Changes')}>
                                                Audit History
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="card glass-panel p-5 relative overflow-hidden">
                    <div className="flex-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-primary"><CreditCard size={18} /> Stripe Webhook Controls</h3>
                    </div>
                    <p className="text-sm text-muted mb-4">Manual controls for Stripe webhook synchronization and recovering account statuses.</p>
                    <div className="flex gap-2">
                        <button className="btn btn-primary w-full text-sm" onClick={() => alert("Force resync initiated")}>Force Resync All Orgs</button>
                        <button className="btn btn-secondary w-full text-sm" onClick={() => alert("Checking dead letter queue")}>Check Dead Webhooks</button>
                    </div>
                </div>

                {/* Scraper & Feature Flag Containment Panel */}
                <div className="card glass-panel p-5 scraper-panel border-danger/30 shadow-[0_0_15px_rgba(239,68,68,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-danger"></div>
                    <div className="flex-between mb-4 pl-2">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-danger"><Terminal size={18} /> Global System Modules</h3>
                        <span className="badge bg-danger/20 text-danger text-xs border border-danger/50 animate-pulse">LIVE</span>
                    </div>

                    <div className="space-y-3 pl-2">
                        {scraperConfigs.map(config => (
                            <div key={config.id} className="flex-between p-3 bg-[rgba(0,0,0,0.2)] rounded border border-[var(--border-light)]">
                                <div>
                                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                                        {config.name}
                                        <span className={`badge text-[10px] ${config.active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                            {config.active ? 'ONLINE' : 'OFFLINE'}
                                        </span>
                                    </h4>
                                    <div className="text-xs text-muted mt-1">Scraper Engine Limit: {config.limit}/hr</div>
                                </div>
                                <button
                                    className={`icon-btn p-2 rounded-full ${config.active ? 'bg-success/20 text-success hover:bg-danger/80 hover:text-white' : 'bg-danger/20 text-danger hover:bg-success/80 hover:text-white'}`}
                                    onClick={() => toggleScraperStatus(config.id)}
                                >
                                    <Power size={18} />
                                </button>
                            </div>
                        ))}

                        <h4 className="font-bold text-sm mt-4 mb-2 text-muted uppercase tracking-wider">Feature Flags</h4>
                        {featureFlags.map(flag => (
                            <div key={flag.id} className="flex-between p-2 bg-[rgba(0,0,0,0.2)] rounded border border-[var(--border-light)]">
                                <span className="text-sm text-white">{flag.name}</span>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="toggle-switch accent-success"
                                        checked={flag.active}
                                        onChange={() => toggleFeatureFlag(flag.id)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
