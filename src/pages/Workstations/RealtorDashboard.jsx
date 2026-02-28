import React from 'react';
import { Home, Calculator, Users, Inbox } from 'lucide-react';
import RiskMatrix from './Shared/RiskMatrix';
import LiquidityIndex from './Shared/LiquidityIndex';

const RealtorDashboard = () => {
    return (
        <div className="animate-fade-in">
            <div className="page-header mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Home className="text-primary" size={32} />
                    Realtor Workstation
                </h1>
                <p className="text-muted mt-2">Manage inbound referrals, generate CMAs, and track active listings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card glass-panel p-5">
                    <h3 className="text-sm font-bold text-muted uppercase mb-2 flex items-center gap-2"><Inbox size={16} /> Referral Inbox</h3>
                    <div className="text-3xl font-bold text-primary">3</div>
                    <div className="text-xs text-muted mt-2">New leads sent by Wholesalers</div>
                </div>

                <div className="card glass-panel p-5">
                    <h3 className="text-sm font-bold text-muted uppercase mb-2 flex items-center gap-2"><Home size={16} /> Active Listings</h3>
                    <div className="text-3xl font-bold">8</div>
                    <div className="text-xs text-muted mt-2">Closing in next 30 days: 2</div>
                </div>

                <div className="card glass-panel p-5">
                    <h3 className="text-sm font-bold text-muted uppercase mb-2 flex items-center gap-2"><Calculator size={16} /> CMAs Generated</h3>
                    <div className="text-3xl font-bold">14</div>
                    <div className="text-xs text-success mt-2">↑ 5 since last week</div>
                </div>

                <div className="card glass-panel p-5">
                    <h3 className="text-sm font-bold text-muted uppercase mb-2 flex items-center gap-2"><Users size={16} /> Active Buyers</h3>
                    <div className="text-3xl font-bold">24</div>
                    <div className="text-xs text-muted mt-2">Pre-approved: 18</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <RiskMatrix persona="REALTOR" />
                <LiquidityIndex persona="REALTOR" velocityScore={82} />
            </div>

            <div className="mt-8 card glass-panel">
                <div className="p-4 border-b border-[var(--border-light)]">
                    <h3 className="font-bold">Referral Pipeline</h3>
                </div>
                <div className="p-8 text-center text-muted">
                    <Inbox className="mx-auto mb-4 opacity-30" size={48} />
                    <h4 className="text-lg font-bold text-white mb-2">Network with Wholesalers</h4>
                    <p className="max-w-md mx-auto">When wholesalers in your organization flag a lead as "Retail/List", it will appear here for you to claim.</p>
                </div>
            </div>
        </div>
    );
};

export default RealtorDashboard;
