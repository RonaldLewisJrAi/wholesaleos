import React from 'react';
import { Target, Search, FolderHeart, Briefcase } from 'lucide-react';

const InvestorDashboard = () => {
    return (
        <div className="animate-fade-in">
            <div className="page-header mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Target className="text-primary" size={32} />
                    Investor Workstation
                </h1>
                <p className="text-muted mt-2">Manage your buying criteria, review deal matches, and track submitted offers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card glass-panel p-6 border-l-4 border-primary">
                    <div className="flex-between mb-4">
                        <h3 className="font-bold flex items-center gap-2"><Target size={18} /> New Matches</h3>
                        <span className="text-2xl font-bold text-primary">12</span>
                    </div>
                    <p className="text-sm text-muted">Properties matching your exact buy box criteria.</p>
                </div>

                <div className="card glass-panel p-6 border-l-4 border-success">
                    <div className="flex-between mb-4">
                        <h3 className="font-bold flex items-center gap-2"><Briefcase size={18} /> Accepted Offers</h3>
                        <span className="text-2xl font-bold text-success">2</span>
                    </div>
                    <p className="text-sm text-muted">Awaiting EMD deposit and assignment signing.</p>
                </div>

                <div className="card glass-panel p-6 border-l-4 border-warning">
                    <div className="flex-between mb-4">
                        <h3 className="font-bold flex items-center gap-2"><Search size={18} /> Pending Underwriting</h3>
                        <span className="text-2xl font-bold text-warning">5</span>
                    </div>
                    <p className="text-sm text-muted">Saved deals you marked for deeper review.</p>
                </div>
            </div>

            <div className="mt-8 card glass-panel">
                <div className="p-4 border-b border-[var(--border-light)]">
                    <h3 className="font-bold">Latest Wholesaler Broadcasts</h3>
                </div>
                <div className="p-4 text-center text-muted">
                    <FolderHeart className="mx-auto mb-2 opacity-50" size={32} />
                    <p>No new deal broadcasts match your strict criteria today.</p>
                    <button className="btn btn-secondary mt-4 text-sm">Review Buy Box</button>
                </div>
            </div>
        </div>
    );
};

export default InvestorDashboard;
