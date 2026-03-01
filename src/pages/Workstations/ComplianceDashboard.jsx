import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkstationWireframe from '../../components/WorkstationWireframe';
import { getCompliancePrimaryAction } from '../../lib/behavioralLogic';
import { ShieldAlert, CheckCircle, AlertTriangle, Search } from 'lucide-react';

const ComplianceDashboard = () => {
    const navigate = useNavigate();
    const [flags, setFlags] = useState([]);
    const [stats, setStats] = useState({ activeFlags: 0, clearedToday: 0, pendingDisclosures: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComplianceData = async () => {
            try {
                // Mock data that trips the Compliance AI logic (critical flag)
                const mockFlags = [
                    { id: 'f-1', deal_id: 'd-101', property: '123 Main St, Nashville, TN', issue: 'Missing Lead Paint Disclosure', severity: 'Critical', resolved: false, urgency: 'High' },
                    { id: 'f-2', deal_id: 'd-105', property: '456 Oak Ave, Austin, TX', issue: 'Assignment Clause Missing from Contract', severity: 'Medium', resolved: false, urgency: 'Medium' },
                ];

                setFlags(mockFlags);
                setStats({ activeFlags: 2, clearedToday: 14, pendingDisclosures: 8 });
            } catch (error) {
                console.error("Error loading compliance data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchComplianceData();
    }, []);

    // 1. Calculate Primary Action using AI Logic
    const primaryAction = getCompliancePrimaryAction(flags);

    // 2. Define Top 3 KPIs
    const kpis = [
        { title: 'Flagged Deals', value: stats.activeFlags, action: () => alert('Filtering by flags') },
        { title: 'Cleared Today', value: stats.clearedToday },
        { title: 'Pending Disclosures', value: stats.pendingDisclosures }
    ];

    // 3. Define Automation/Routing rules
    const automationLinks = [
        { label: 'View All Deals', action: () => navigate('/pipeline') },
        { label: 'Audit Log', action: () => alert('Opening System Audit Log...') },
        { label: 'Generate Disclosure Docs', action: () => alert('Routing to Document Generator...') }
    ];

    const executePrimaryAction = () => {
        if (primaryAction.actionType === 'RESOLVE_FLAGS') {
            alert(`Opening compliance review module for: ${primaryAction.label}`);
        } else {
            alert('Running full system audit scan...');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">Loading Compliance Matrix...</div>;

    return (
        <WorkstationWireframe
            personaName="Compliance"
            immediateAction={primaryAction}
            onPrimaryActionClick={executePrimaryAction}
            kpis={kpis}
            automationLinks={automationLinks}
        >
            {/* EXECUTION ZONE BODY */}
            <div className="space-y-4 pt-2">
                <div className="flex-between mb-4">
                    <h4 className="font-bold text-white tracking-wide flex items-center gap-2">
                        <Search size={16} /> Deals Requiring Attention
                    </h4>
                    <span className="text-xs text-muted badge bg-secondary">Sorted by Severity</span>
                </div>

                {flags.sort((a) => (a.severity === 'Critical') ? -1 : 1).map((flag) => (
                    <div key={flag.id} className="glass-panel p-4 border border-[var(--border-light)] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-danger/50 transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldAlert size={16} className={flag.severity === 'Critical' ? 'text-danger' : 'text-warning'} />
                                <h5 className="font-bold text-white">{flag.property}</h5>
                            </div>
                            <p className="text-sm text-muted">{flag.issue}</p>
                            <div className="text-xs text-muted font-mono mt-1">Deal ID: {flag.deal_id}</div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className={`badge ${flag.severity === 'Critical' ? 'bg-danger/20 text-danger border border-danger/50' : 'bg-warning/20 text-warning border border-warning/50'}`}>
                                {flag.severity}
                            </span>
                            <button className="px-3 py-1.5 rounded bg-[rgba(255,255,255,0.05)] text-muted hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors text-xs font-bold uppercase" title="Review Flag">
                                Review
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </WorkstationWireframe>
    );
};

export default ComplianceDashboard;
