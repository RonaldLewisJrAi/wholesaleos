import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkstationWireframe from '../../components/WorkstationWireframe';
import { supabase } from '../../lib/supabase';
import { Users, Server, ShieldCheck, Zap } from 'lucide-react';

const AdminDashboard = () => {
    const [metrics, setMetrics] = useState({ totalUsers: 0, activeOrgs: 0, totalDeals: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTelemetry = async () => {
            if (!supabase) return;
            try {
                // Mock robust data for God-Mode
                setMetrics({
                    totalUsers: 1420,
                    activeOrgs: 85,
                    totalDeals: 3450
                });
            } catch (err) {
                console.error("Telemetry failed:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTelemetry();
    }, []);

    // 1. Primary Action AI Logic
    const primaryAction = {
        label: 'System Health Nominal',
        actionType: 'AUDIT',
        urgency: 'normal',
        description: 'No active multi-tenant alerts. Cluster capacity at 42%.'
    };

    // 2. Define Top 3 KPIs
    const kpis = [
        { title: 'Total Profiles', value: metrics.totalUsers.toLocaleString() },
        { title: 'Active Organizations', value: metrics.activeOrgs.toLocaleString() },
        { title: 'Total Deal Volume', value: metrics.totalDeals.toLocaleString() }
    ];

    // 3. Define Automation/Routing rules
    const automationLinks = [
        { label: 'Manage Organizations', action: () => alert('Routing to Org Manager...') },
        { label: 'View Billing Status', action: () => alert('Opening Stripe Console...') },
        { label: 'System Logs', action: () => alert('Viewing system logs...') }
    ];

    const executePrimaryAction = () => {
        alert('Initiating full system diagnostic...');
    };

    if (loading) return <div className="p-8 text-center text-muted">Loading God-Mode Telemetry...</div>;

    return (
        <WorkstationWireframe
            personaName="Master Admin"
            immediateAction={primaryAction}
            onPrimaryActionClick={executePrimaryAction}
            kpis={kpis}
            automationLinks={automationLinks}
        >
            {/* EXECUTION ZONE BODY */}
            <div className="space-y-4 pt-2">
                <div className="flex-between mb-4">
                    <h4 className="font-bold text-white tracking-wide flex items-center gap-2">
                        <ShieldCheck size={16} className="text-primary" /> System Controls
                    </h4>
                    <span className="text-xs text-danger badge bg-danger/20 border border-danger/50">Restricted Operations</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="glass-panel p-4 border border-[var(--border-light)] rounded-lg flex flex-col items-start gap-4 hover:border-primary/50 transition-colors text-left group">
                        <div className="p-2 rounded bg-[rgba(255,255,255,0.05)] text-primary">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h5 className="font-bold text-white group-hover:text-primary transition-colors">Force Global Webhook Resync</h5>
                            <p className="text-xs text-muted mt-1">Manually triggers synchronization of all remote Zapier endpoints.</p>
                        </div>
                    </button>

                    <button className="glass-panel p-4 border border-[var(--border-light)] rounded-lg flex flex-col items-start gap-4 hover:border-danger/50 transition-colors text-left group">
                        <div className="p-2 rounded bg-danger/10 text-danger">
                            <Server size={20} />
                        </div>
                        <div>
                            <h5 className="font-bold text-white group-hover:text-danger transition-colors">Purge Trial Data Clusters</h5>
                            <p className="text-xs text-muted mt-1">Irreversibly cleans up expired trial organization data schemas.</p>
                        </div>
                    </button>

                    <button className="glass-panel p-4 border border-[var(--border-light)] rounded-lg flex flex-col items-start gap-4 hover:border-success/50 transition-colors text-left group">
                        <div className="p-2 rounded bg-success/10 text-success">
                            <Users size={20} />
                        </div>
                        <div>
                            <h5 className="font-bold text-white group-hover:text-success transition-colors">Audit Organization Roles</h5>
                            <p className="text-xs text-muted mt-1">Scan for orphaned accounts and invalid persona allocations.</p>
                        </div>
                    </button>
                </div>
            </div>
        </WorkstationWireframe>
    );
};

export default AdminDashboard;
