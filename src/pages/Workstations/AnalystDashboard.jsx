import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkstationWireframe from '../../components/WorkstationWireframe';
import RiskMatrix from './Shared/RiskMatrix';
import LiquidityIndex from './Shared/LiquidityIndex';
import { Map } from 'lucide-react';

const AnalystDashboard = () => {
    const navigate = useNavigate();
    const [stats] = useState({ avgFee: '$18,450', daysToClose: 14.2, closeRate: '68%' });
    const [loading] = useState(false);

    // 1. Primary Action AI Logic
    const primaryAction = {
        label: 'Approve Comp Request: 123 Main St',
        actionType: 'REVIEW_COMP',
        urgency: 'high',
        description: 'Acquisition requires ARV verification on hot lead.'
    };

    // 2. Define Top 3 KPIs
    const kpis = [
        { title: 'Avg Assignment Fee', value: stats.avgFee },
        { title: 'Days to Close (Avg)', value: stats.daysToClose },
        { title: 'Close Rate', value: stats.closeRate }
    ];

    // 3. Define Automation/Routing rules
    const automationLinks = [
        { label: 'Market Heatmap', action: () => alert('Loading Geospatial data...') },
        { label: 'Download Report', action: () => alert('Generating PDF...') },
        { label: 'Adjust Algorithms', action: () => navigate('/settings') }
    ];

    const executePrimaryAction = () => {
        alert('Opening Automated Comp Matrix...');
    };

    if (loading) return <div className="p-8 text-center text-muted">Loading Analyst Data...</div>;

    return (
        <WorkstationWireframe
            personaName="Analyst Lab"
            immediateAction={primaryAction}
            onPrimaryActionClick={executePrimaryAction}
            kpis={kpis}
            automationLinks={automationLinks}
        >
            {/* EXECUTION ZONE BODY */}
            <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RiskMatrix persona="ANALYST" />
                    <LiquidityIndex persona="ANALYST" velocityScore={88} />
                </div>

                <div className="card glass-panel p-6 border border-[var(--border-light)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
                    <div className="flex-between mb-4">
                        <h4 className="font-bold text-white tracking-wide flex items-center gap-2">
                            <Map size={16} className="text-primary" /> Market Velocity Heatmap
                        </h4>
                    </div>
                    <div className="h-64 bg-[var(--surface-dark)] rounded border border-[var(--border-light)] flex items-center justify-center">
                        <p className="text-muted text-sm flex items-center gap-2">
                            Regional Heatmap Module Ready for Geospatial Integration
                        </p>
                    </div>
                </div>
            </div>
        </WorkstationWireframe>
    );
};

export default AnalystDashboard;
