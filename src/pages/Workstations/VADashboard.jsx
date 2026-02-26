import React from 'react';
import { Headphones, PhoneCall, ListTodo, CheckSquare } from 'lucide-react';

const VADashboard = () => {
    return (
        <div className="animate-fade-in">
            <div className="page-header mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Headphones className="text-primary" size={32} />
                    Virtual Assistant Workstation
                </h1>
                <p className="text-muted mt-2">Access the dialer, load lead queues, and set appointments for Acqusition Managers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card glass-panel p-6 border-t-4 border-primary">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><ListTodo size={18} /> Pending Follow-ups</h3>
                    <div className="flex-between items-end">
                        <span className="text-4xl font-bold text-white">45</span>
                        <button className="btn btn-primary text-xs py-1">Load Queue</button>
                    </div>
                </div>

                <div className="card glass-panel p-6 border-t-4 border-success">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><CheckSquare size={18} /> Appointments Set (Today)</h3>
                    <div className="flex-between items-end">
                        <span className="text-4xl font-bold text-success">3</span>
                        <span className="text-xs text-muted">Target: 5</span>
                    </div>
                </div>

                <div className="card glass-panel p-6 border-t-4 border-warning">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><PhoneCall size={18} /> Calls Made</h3>
                    <div className="flex-between items-end">
                        <span className="text-4xl font-bold text-warning">112</span>
                        <span className="text-xs text-muted">Avg Dur: 1m 45s</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card glass-panel">
                    <div className="p-4 border-b border-[var(--border-light)] flex-between">
                        <h3 className="font-bold">Active Dialer Queue</h3>
                        <span className="badge bg-primary/20 text-primary border border-primary text-xs">READY</span>
                    </div>
                    <div className="p-12 text-center">
                        <PhoneCall className="mx-auto mb-4 opacity-20 text-white" size={64} />
                        <h4 className="text-xl font-bold text-muted">No active campaign loaded</h4>
                        <p className="text-sm text-muted mt-2">Select a campaign list from the CRM to begin auto-dialing.</p>
                        <button className="btn btn-secondary mt-6">Browse Lead Lists</button>
                    </div>
                </div>

                <div className="card glass-panel flex flex-col">
                    <div className="p-4 border-b border-[var(--border-light)]">
                        <h3 className="font-bold">Quick Scripts</h3>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto space-y-4">
                        <div className="p-3 bg-[var(--surface-dark)] rounded border border-[var(--border-light)] hover:border-primary transition-colors cursor-pointer">
                            <h4 className="font-bold text-sm text-primary">Pre-Foreclosure Intro</h4>
                            <p className="text-xs text-muted mt-1 line-clamp-2">"Hi [Name], I'm calling regarding the notice sent to [Address]. We have an option to help resolve the balance..."</p>
                        </div>
                        <div className="p-3 bg-[var(--surface-dark)] rounded border border-[var(--border-light)] hover:border-primary transition-colors cursor-pointer">
                            <h4 className="font-bold text-sm text-primary">Absentee Owner Outbound</h4>
                            <p className="text-xs text-muted mt-1 line-clamp-2">"Hello [Name], are you considering selling the property at [Address]? We're buying in that neighborhood..."</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VADashboard;
