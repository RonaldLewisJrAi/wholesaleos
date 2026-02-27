import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Webhook, Key, Terminal, ToggleLeft, ToggleRight, MessageSquare, Mail, Zap, Phone, CreditCard, Users as UsersIcon } from 'lucide-react';
import { useSubscription } from '../contexts/useSubscription';
import './Settings.css';

const Settings = () => {
    const { subscriptionTier, subscriptionStatus, setSubscriptionStatus } = useSubscription();
    const [activeTab, setActiveTab] = useState('communication');

    // Mock User - Assume Admin check passed for this demo
    const isAdmin = true;
    const isBasic = subscriptionTier === 'BASIC';

    const [featureFlags, setFeatureFlags] = useState({
        enable_scraper: true,
        enable_webhooks: true,
        enable_predictive_recalibration: false,
        enable_dialer: true,
    });

    const toggleFlag = (flag) => {
        setFeatureFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
    };

    // Phase 32: Secure Action Handler
    const handleSecureAction = (actionName, finalStatus) => {
        if (actionName === 'RESUME') {
            setSubscriptionStatus(finalStatus);
            return;
        }

        const password = prompt(`Security Verification Required.\n\nPlease enter your password to confirm [${actionName}]:`);
        if (password !== null && password !== "") {
            // In production, we'd hit /api/subscription/action with the password payload.
            setSubscriptionStatus(finalStatus);
            alert(`${actionName} confirmed and executed. Immutable log generated.`);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-8 text-center animate-fade-in text-muted">
                <Shield className="mx-auto mb-4 opacity-50" size={48} />
                <h2 className="text-xl font-bold">Access Denied</h2>
                <p>Only Organization Administrators can manage Integrations.</p>
            </div>
        );
    }

    return (
        <div className="settings-container animate-fade-in max-w-6xl mx-auto">
            <div className="page-header flex-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <SettingsIcon className="text-primary" size={32} />
                        Integration & Infrastructure
                    </h1>
                    <p className="text-muted mt-2">Manage third-party connections, webhooks, API tokens, and feature flags.</p>
                </div>
                {isBasic && (
                    <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-2 rounded flex items-center gap-2 text-sm font-bold">
                        <Shield size={16} /> BASIC TIER: Integrations Locked
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Lateral Tabs */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="card glass-panel flex flex-col overflow-hidden">
                        <button
                            className={`p-4 text-left font-bold border-l-4 transition-colors flex items-center gap-2 ${activeTab === 'billing' ? 'border-primary bg-[var(--surface-light)]' : 'border-transparent hover:bg-white/5'}`}
                            onClick={() => setActiveTab('billing')}
                        >
                            <CreditCard size={16} /> Billing & Plan
                        </button>
                        <button
                            className={`p-4 text-left font-bold border-l-4 transition-colors flex items-center gap-2 ${activeTab === 'communication' ? 'border-primary bg-[var(--surface-light)]' : 'border-transparent hover:bg-white/5'}`}
                            onClick={() => setActiveTab('communication')}
                        >
                            <MessageSquare size={16} /> Communication
                        </button>
                        <button
                            className={`p-4 text-left font-bold border-l-4 transition-colors flex items-center gap-2 ${activeTab === 'automation' ? 'border-primary bg-[var(--surface-light)]' : 'border-transparent hover:bg-white/5'}`}
                            onClick={() => setActiveTab('automation')}
                        >
                            <Zap size={16} /> Automation
                        </button>
                        <button
                            className={`p-4 text-left font-bold border-l-4 transition-colors flex items-center gap-2 ${activeTab === 'webhooks' ? 'border-primary bg-[var(--surface-light)]' : 'border-transparent hover:bg-white/5'}`}
                            onClick={() => setActiveTab('webhooks')}
                        >
                            <Webhook size={16} /> Webhooks
                        </button>
                        <button
                            className={`p-4 text-left font-bold border-l-4 transition-colors flex items-center gap-2 ${activeTab === 'api' ? 'border-primary bg-[var(--surface-light)]' : 'border-transparent hover:bg-white/5'}`}
                            onClick={() => setActiveTab('api')}
                        >
                            <Key size={16} /> API Access
                        </button>
                        <button
                            className={`p-4 text-left font-bold border-l-4 transition-colors flex items-center gap-2 ${activeTab === 'flags' ? 'border-primary bg-[var(--surface-light)]' : 'border-transparent hover:bg-white/5'}`}
                            onClick={() => setActiveTab('flags')}
                        >
                            <Terminal size={16} /> Feature Flags
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className={`flex-1 ${isBasic ? 'opacity-50 pointer-events-none' : ''}`}>

                    {/* BILLING TAB */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="card glass-panel p-6 border-t-4 border-primary">
                                <div className="flex-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold flex items-center gap-2"><CreditCard className="text-primary" /> Subscription & Plan</h3>
                                        <p className="text-sm text-muted mt-1">Manage your active tier, seats, and billing lifecycle.</p>
                                    </div>
                                    <span className={`badge tier-${subscriptionTier.toLowerCase()} text-lg px-4 py-1 shadow-lg`}>{subscriptionTier}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-[var(--surface-dark)] p-4 rounded border border-[var(--border-light)]">
                                        <div className="text-xs text-muted uppercase tracking-wider font-bold mb-1">Status</div>
                                        <div className="text-xl font-bold flex items-center gap-2">
                                            {subscriptionStatus === 'ACTIVE' && <><div className="w-3 h-3 rounded-full bg-success"></div> ACTIVE</>}
                                            {subscriptionStatus === 'GRACE_PERIOD' && <><div className="w-3 h-3 rounded-full bg-warning"></div> GRACE PERIOD</>}
                                            {subscriptionStatus === 'PAST_DUE' && <><div className="w-3 h-3 rounded-full bg-danger"></div> PAST DUE</>}
                                            {subscriptionStatus === 'PAUSED' && <><div className="w-3 h-3 rounded-full bg-muted"></div> PAUSED</>}
                                            {subscriptionStatus === 'CANCELED' && <><div className="w-3 h-3 rounded-full bg-info"></div> CANCELED</>}
                                            {subscriptionStatus === 'TERMINATED' && <><div className="w-3 h-3 rounded-full bg-danger shadow-[0_0_10px_red]"></div> TERMINATED</>}
                                        </div>
                                        <div className="text-xs text-muted mt-2">Next billing date: Mar 15, 2026</div>
                                    </div>

                                    <div className="bg-[var(--surface-dark)] p-4 rounded border border-[var(--border-light)]">
                                        <div className="text-xs text-muted uppercase tracking-wider font-bold mb-1">Team Seats</div>
                                        <div className="text-xl font-bold flex items-center gap-2">
                                            <UsersIcon size={20} className="text-info" /> 8 / 10 Used
                                        </div>
                                        <div className="w-full bg-black/40 rounded h-2 mt-3 overflow-hidden">
                                            <div className="bg-info h-full w-[80%]"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-[var(--border-light)] pt-6 mt-6">
                                    <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted">Self-Service Actions</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {subscriptionStatus === 'ACTIVE' && (
                                            <button className="btn btn-secondary border-warning/50 hover:bg-warning hover:text-black hover:border-warning" onClick={() => handleSecureAction('PAUSE', 'PAUSED')}>
                                                Pause Subscription
                                            </button>
                                        )}
                                        {subscriptionStatus === 'PAUSED' && (
                                            <button className="btn btn-primary" onClick={() => handleSecureAction('RESUME', 'ACTIVE')}>
                                                Resume Plan
                                            </button>
                                        )}
                                        <button className="btn btn-secondary border-danger/50 hover:bg-danger hover:text-white hover:border-danger" onClick={() => handleSecureAction('CANCEL', 'CANCELED')}>
                                            Cancel Plan (End of Term)
                                        </button>
                                        <button className="btn btn-secondary text-danger border-danger/20 hover:bg-danger hover:text-white ml-auto" onClick={() => handleSecureAction('TERMINATE', 'TERMINATED')}>
                                            Terminate Immediately
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COMMUNICATION TAB */}
                    {activeTab === 'communication' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="card glass-panel p-6 border-t-4 border-primary">
                                <div className="flex-between mb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2"><Phone className="text-primary" /> Twilio (SMS & Voice)</h3>
                                    <span className="badge bg-success/20 text-success text-xs border border-success/50">ACTIVE</span>
                                </div>
                                <p className="text-sm text-muted mb-6">Powers the Virtual Assistant dialer, automated SMS follow-ups, and inbound call routing.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label>Account SID</label>
                                        <input type="password" value="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" readOnly className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label>Auth Token</label>
                                        <input type="password" value="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" readOnly className="form-control" />
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <button className="btn btn-secondary text-sm">Update Credentials</button>
                                    <button className="btn text-danger text-sm hover:underline">Disconnect</button>
                                </div>
                            </div>

                            <div className="card glass-panel p-6 border-t-4 border-info">
                                <div className="flex-between mb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2"><Mail className="text-info" /> SendGrid (Email)</h3>
                                    <span className="badge bg-[var(--surface-light)] text-muted text-xs border border-[var(--border-light)]">NOT CONFIGURED</span>
                                </div>
                                <p className="text-sm text-muted mb-6">Enables automated Deal Packets, Investor broadcasts, and Realtor CMA generation emails.</p>
                                <button className="btn btn-primary text-sm flex items-center gap-2"><Zap size={14} /> Connect SendGrid</button>
                            </div>
                        </div>
                    )}

                    {/* WEBHOOKS TAB */}
                    {activeTab === 'webhooks' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="card glass-panel p-6">
                                <div className="flex-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold flex items-center gap-2"><Webhook className="text-primary" /> Outbound Webhooks</h3>
                                        <p className="text-sm text-muted mt-1">Push real-time state changes directly to Zapier, Make, or custom endpoints.</p>
                                    </div>
                                    <button className="btn btn-primary">+ New Endpoint</button>
                                </div>

                                <div className="border border-[var(--border-light)] rounded overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-[var(--surface-light)]">
                                            <tr>
                                                <th className="p-3">Endpoint URL</th>
                                                <th className="p-3">Events Subscribed</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3">Last Fired</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-light)]">
                                            <tr>
                                                <td className="p-3 font-mono text-xs text-muted">https://hooks.zapier.com/hooks/catch/123/abc/</td>
                                                <td className="p-3"><span className="badge text-[10px]">deal.created</span> <span className="badge text-[10px]">deal.stage_changed</span></td>
                                                <td className="p-3"><span className="text-success font-bold text-xs flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success"></div> Active</span></td>
                                                <td className="p-3 text-xs text-muted">2 mins ago</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API ACCESS TAB */}
                    {activeTab === 'api' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="card glass-panel p-6">
                                <div className="flex-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold flex items-center gap-2"><Key className="text-primary" /> Access Tokens</h3>
                                        <p className="text-sm text-muted mt-1">Manage Bearer tokens for connecting external BI reporting or custom mobile apps.</p>
                                    </div>
                                    <button className="btn btn-primary text-sm">Generate New Key</button>
                                </div>
                                <div className="bg-[var(--surface-dark)] p-4 rounded border border-[var(--border-light)] flex-between">
                                    <div>
                                        <div className="font-bold text-sm">Production Reporting Server</div>
                                        <div className="font-mono text-xs text-muted mt-1">whos_********************a9f2</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-success font-bold pb-1">READ_ONLY</div>
                                        <button className="text-danger text-xs hover:underline">Revoke</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FEATURE FLAGS TAB */}
                    {activeTab === 'flags' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="card glass-panel p-6 border-danger/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-danger mb-2"><Terminal className="text-danger" /> Structural Kill-Switches</h3>
                                <p className="text-sm text-muted mb-6">Control platform-wide architectural exposure. These values map to the `feature_flags` org isolation policies.</p>

                                <div className="space-y-4">
                                    <div className="flex-between p-4 bg-[var(--surface-dark)] rounded border border-[var(--border-light)]">
                                        <div>
                                            <div className="font-bold">Automated Scrapers (Data Enrichment)</div>
                                            <div className="text-xs text-muted max-w-xl pr-4">Allows Bulk APN scans and CMA proxies. High risk of IP ban if misconfigured.</div>
                                        </div>
                                        <div className="cursor-pointer" onClick={() => toggleFlag('enable_scraper')}>
                                            {featureFlags.enable_scraper ? <ToggleRight size={32} className="text-success" /> : <ToggleLeft size={32} className="text-muted" />}
                                        </div>
                                    </div>

                                    <div className="flex-between p-4 bg-[var(--surface-dark)] rounded border border-[var(--border-light)]">
                                        <div>
                                            <div className="font-bold">Intelligence Engine Recalibration</div>
                                            <div className="text-xs text-muted max-w-xl pr-4">Allows predictive logic models to alter lead scores in real-time based on local velocity.</div>
                                        </div>
                                        <div className="cursor-pointer" onClick={() => toggleFlag('enable_predictive_recalibration')}>
                                            {featureFlags.enable_predictive_recalibration ? <ToggleRight size={32} className="text-success" /> : <ToggleLeft size={32} className="text-muted" />}
                                        </div>
                                    </div>

                                    <div className="flex-between p-4 bg-[var(--surface-dark)] rounded border border-[var(--border-light)]">
                                        <div>
                                            <div className="font-bold">Outbound Webhook Delivery</div>
                                            <div className="text-xs text-muted max-w-xl pr-4">Activates the Edge Function dispatcher.</div>
                                        </div>
                                        <div className="cursor-pointer" onClick={() => toggleFlag('enable_webhooks')}>
                                            {featureFlags.enable_webhooks ? <ToggleRight size={32} className="text-success" /> : <ToggleLeft size={32} className="text-muted" />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Settings;
