import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign,
    TrendingUp,
    Home,
    Users
} from 'lucide-react';
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
                <div className="card pipeline-overview glass-panel">
                    <div className="card-header">
                        <h3>Pipeline Value</h3>
                        <button className="btn btn-secondary" onClick={() => navigate('/pipeline')}>View Pipeline</button>
                    </div>
                    <div className="pipeline-stages">
                        <div className="stage-item">
                            <div className="stage-info">
                                <span className="stage-name">Lead Intake</span>
                                <span className="stage-count">45</span>
                            </div>
                            <div className="progress-bar"><div className="progress" style={{ width: '80%' }}></div></div>
                        </div>
                        <div className="stage-item">
                            <div className="stage-info">
                                <span className="stage-name">Underwriting</span>
                                <span className="stage-count">12</span>
                            </div>
                            <div className="progress-bar"><div className="progress" style={{ width: '40%' }}></div></div>
                        </div>
                        <div className="stage-item">
                            <div className="stage-info">
                                <span className="stage-name">Under Contract</span>
                                <span className="stage-count">8</span>
                            </div>
                            <div className="progress-bar"><div className="progress" style={{ width: '25%' }}></div></div>
                        </div>
                        <div className="stage-item">
                            <div className="stage-info">
                                <span className="stage-name">Disposition (Marketing)</span>
                                <span className="stage-count">5</span>
                            </div>
                            <div className="progress-bar"><div className="progress" style={{ width: '15%' }}></div></div>
                        </div>
                        <div className="stage-item">
                            <div className="stage-info">
                                <span className="stage-name">Closing</span>
                                <span className="stage-count">3</span>
                            </div>
                            <div className="progress-bar"><div className="progress" style={{ width: '10%' }}></div></div>
                        </div>
                    </div>
                </div>

                <div className="card recent-activity glass-panel">
                    <div className="card-header">
                        <h3>Recent Activity</h3>
                    </div>
                    <div className="activity-list">
                        <div className="activity-item">
                            <div className="activity-icon bg-success">✓</div>
                            <div className="activity-details">
                                <p>Contract signed for <strong>123 Main St</strong></p>
                                <span>2 hours ago</span>
                            </div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-icon bg-primary">📄</div>
                            <div className="activity-details">
                                <p>New Assignment JV generated</p>
                                <span>5 hours ago</span>
                            </div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-icon bg-warning">!</div>
                            <div className="activity-details">
                                <p>Compliance alert: EMD pending for 456 Oak Ave</p>
                                <span>1 day ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
