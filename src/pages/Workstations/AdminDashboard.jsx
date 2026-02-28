import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Server, Building, Handshake, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';

const StatCard = ({ title, value, icon: Icon, loading }) => (
    <div className="stat-card glass-panel" style={{ padding: '24px', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-sm font-bold text-muted uppercase tracking-wider">{title}</h3>
                {loading ? (
                    <div className="h-8 w-24 bg-[rgba(255,255,255,0.1)] rounded animate-pulse mt-2"></div>
                ) : (
                    <p className="text-3xl font-bold mt-1 text-white">{value}</p>
                )}
            </div>
            <div className={`p-3 rounded-lg bg-[rgba(99,102,241,0.1)] text-primary`}>
                {Icon && <Icon size={24} />}
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    const { user } = useAuth(); // Keeping for context usage or future roles
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        activeOrgs: 0,
        totalDeals: 0,
        liveSessions: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTelemetry = async () => {
            if (!supabase) return;
            try {
                // 1. Total Registered Users
                const { count: userCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                // 2. Active Organizations
                const { count: orgCount } = await supabase
                    .from('organizations')
                    .select('*', { count: 'exact', head: true })
                    .eq('account_status', 'active');

                // 3. Total Deals in System
                const { count: dealCount } = await supabase
                    .from('deals')
                    .select('*', { count: 'exact', head: true });

                setMetrics({
                    totalUsers: userCount || 0,
                    activeOrgs: orgCount || 0,
                    totalDeals: dealCount || 0,
                    liveSessions: Math.floor((userCount || 0) * 0.4) // Approximate concurrency
                });
            } catch (err) {
                console.error("Telemetry failed:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTelemetry();
    }, []);

    return (
        <div className="dashboard-container animate-fade-in">
            <div className="page-header border-b border-[var(--border-light)] pb-6 mb-8 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="text-primary" size={28} />
                        <h1 className="page-title mb-0">God-Mode Telemetry</h1>
                        <span className="badge bg-danger/20 text-danger border border-danger/50 ml-2">MASTER ADMIN</span>
                    </div>
                    <p className="page-description">Live aggregate data across the Wholesale OS multi-tenant ecosystem.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Profiles"
                    value={metrics.totalUsers.toLocaleString()}
                    icon={Users}
                    loading={loading}
                />
                <StatCard
                    title="Active Organizations"
                    value={metrics.activeOrgs.toLocaleString()}
                    icon={Building}
                    loading={loading}
                />
                <StatCard
                    title="Total Deal Volume"
                    value={metrics.totalDeals.toLocaleString()}
                    icon={Handshake}
                    loading={loading}
                />
                <StatCard
                    title="Simulated Concurrency"
                    value={metrics.liveSessions.toLocaleString()}
                    icon={Server}
                    loading={loading}
                />
            </div>

            {/* Quick Actions for Admin */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 border border-primary/30 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Zap size={20} className="text-primary" /> System Controls
                    </h3>
                    <div className="space-y-4">
                        <button className="w-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[var(--border-light)] text-left px-4 py-3 rounded-lg transition-colors flex justify-between items-center">
                            <span>Force Global Webhook Resync</span>
                            <span className="text-xs text-muted uppercase tracking-wider">Execute</span>
                        </button>
                        <button className="w-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[var(--border-light)] text-left px-4 py-3 rounded-lg transition-colors flex justify-between items-center">
                            <span>Purge Trial Data Clusters</span>
                            <span className="text-xs text-muted uppercase tracking-wider">Execute</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
