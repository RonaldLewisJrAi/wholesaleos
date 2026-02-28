import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign,
    TrendingUp,
    Home,
    Users,
    Activity,
    Target,
    Clock,
    Zap
} from 'lucide-react';
import { useSubscription } from '../contexts/useSubscription';
import InvestorDashboard from './Workstations/InvestorDashboard';
import RealtorDashboard from './Workstations/RealtorDashboard';
import VADashboard from './Workstations/VADashboard';
import './Dashboard.css';

const StatCard = ({ title, value, change, icon: Icon, trend }) => (
    <div className="stat-card glass-panel">
        <div className="stat-card-header">
            <div>
                <h3 className="stat-card-title">{title}</h3>
                <p className="stat-card-value">{value}</p>
            </div>
            <div className={`stat-card-icon ${trend === 'up' ? 'text-success' : 'text-primary'}`}>
                {Icon && <Icon size={24} />}
            </div>
        </div>
        <div className="stat-card-footer">
            <span className={`trend-indicator ${trend === 'up' ? 'trend-up' : 'trend-neutral'}`}>
                {trend === 'up' ? '↑' : '→'} {change}
            </span>
            <span className="trend-label">vs last month</span>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const { currentViewPersona } = useSubscription();

    if (currentViewPersona === 'INVESTOR') return <InvestorDashboard />;
    if (currentViewPersona === 'REALTOR') return <RealtorDashboard />;
    if (currentViewPersona === 'VIRTUAL_ASSISTANT') return <VADashboard />;

    return (
        <div className="dashboard-container animate-fade-in">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Dashboard Overview</h1>
                    <p className="page-description">Welcome back, Ronald. Here's what's happening with your deals today.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => alert("Report generation started. A PDF will be downloaded shortly.")}>Download Report</button>
                    <button className="btn btn-primary" onClick={() => navigate('/pipeline')}>+ New Deal</button>
                </div>
            </div>

            <div className="stats-grid">
                <StatCard
                    title="Total Revenue (YTD)"
                    value="$425,000"
                    change="12%"
                    icon={DollarSign}
                    trend="up"
                />
                <StatCard
                    title="Deals Closed"
                    value="24"
                    change="3"
                    icon={TrendingUp}
                    trend="up"
                />
                <StatCard
                    title="Active Properties"
                    value="12"
                    change="2"
                    icon={Home}
                    trend="neutral"
                />
                <StatCard
                    title="New Leads"
                    value="148"
                    change="18%"
                    icon={Users}
                    trend="up"
                />
            </div>

            <div className="dashboard-content-grid">
                {/* Phase 29: Market Velocity Dashboard (Wholesale Intelligence Engine) */}
                <div className="card glass-panel col-span-2 border-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                    <div className="card-header border-b border-[var(--border-light)] pb-4 mb-4">
                        <div className="flex items-center gap-3">
                            <Activity className="text-primary" size={24} />
                            <div>
                                <h3 className="text-xl font-bold">Wholesale Intelligence Engine™</h3>
                                <p className="text-xs text-muted">Real-time macro market velocity aggregated from closed-loop deal outcomes.</p>
                            </div>
                        </div>
                        <span className="badge bg-primary/20 text-primary border border-primary/50">LIVE TELEMETRY</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-[rgba(0,0,0,0.2)] rounded border border-[var(--border-light)]">
                            <div className="flex items-center gap-2 text-muted mb-2">
                                <DollarSign size={16} className="text-success" />
                                <span className="text-sm font-bold uppercase tracking-wider">Avg Assignment</span>
                            </div>
                            <div className="text-2xl font-bold">$18,450</div>
                            <div className="text-xs text-success mt-1">↑ 4% vs last quarter</div>
                        </div>

                        <div className="p-4 bg-[rgba(0,0,0,0.2)] rounded border border-[var(--border-light)]">
                            <div className="flex items-center gap-2 text-muted mb-2">
                                <Clock size={16} className="text-warning" />
                                <span className="text-sm font-bold uppercase tracking-wider">Avg Days to Close</span>
                            </div>
                            <div className="text-2xl font-bold">14.2<span className="text-sm text-muted font-normal ml-1">days</span></div>
                            <div className="text-xs text-success mt-1">↓ 2.1 days faster</div>
                        </div>

                        <div className="p-4 bg-[rgba(0,0,0,0.2)] rounded border border-[var(--border-light)]">
                            <div className="flex items-center gap-2 text-muted mb-2">
                                <Users size={16} className="text-primary" />
                                <span className="text-sm font-bold uppercase tracking-wider">Buyer Density</span>
                            </div>
                            <div className="text-2xl font-bold">8.4<span className="text-sm text-muted font-normal ml-1">offers/deal</span></div>
                            <div className="text-xs text-muted mt-1">Single Family (SFR)</div>
                        </div>

                        <div className="p-4 bg-[rgba(0,0,0,0.2)] rounded border border-[var(--border-light)]">
                            <div className="flex items-center gap-2 text-muted mb-2">
                                <Target size={16} className="text-danger" />
                                <span className="text-sm font-bold uppercase tracking-wider">Close Rate</span>
                            </div>
                            <div className="text-2xl font-bold text-success">68%</div>
                            <div className="text-xs text-muted mt-1">Foreclosure-to-Close</div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 border border-[var(--border-light)] rounded bg-[var(--surface-dark)]">
                        <div className="flex-between mb-2">
                            <h4 className="text-sm font-bold text-muted uppercase">Top Performing Zip Codes (Last 30 Days)</h4>
                            <button className="text-primary text-xs hover:underline">View Full Map</button>
                        </div>
                        <div className="space-y-2">
                            <div className="flex-between text-sm">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-danger"></div> 37206 (East Nashville)</div>
                                <span className="font-mono">$22,500 avg fee <span className="text-muted">| 9 days to close</span></span>
                            </div>
                            <div className="flex-between text-sm">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-warning"></div> 37209 (The Nations)</div>
                                <span className="font-mono">$19,200 avg fee <span className="text-muted">| 12 days to close</span></span>
                            </div>
                            <div className="flex-between text-sm">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary"></div> 37216 (Inglewood)</div>
                                <span className="font-mono">$15,800 avg fee <span className="text-muted">| 15 days to close</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
