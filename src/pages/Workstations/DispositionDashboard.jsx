import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkstationWireframe from '../../components/WorkstationWireframe';
import { getDispositionPrimaryAction } from '../../lib/behavioralLogic';
import { Send, Users, Activity, ExternalLink } from 'lucide-react';

const DispositionDashboard = () => {
    const navigate = useNavigate();
    const [deals, setDeals] = useState([]);
    const [stats, setStats] = useState({ assigned: 0, averageFee: '$0', buyerActivity: 'Low' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDispositionData = async () => {
            try {
                // Mock data that trips the Disposition AI logic (deal > 14 days old)
                const mockDeals = [
                    {
                        id: '101',
                        property_address: '990 Riverside Dr, Memphis, TN',
                        current_stage: 'Under Contract',
                        updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
                        projected_fee: 15000
                    },
                    {
                        id: '102',
                        property_address: '422 Pine St, Atlanta, GA',
                        current_stage: 'Assigned',
                        updated_at: new Date().toISOString(),
                        projected_fee: 22000
                    },
                    {
                        id: '103',
                        property_address: '880 Elm Ave, Charlotte, NC',
                        current_stage: 'Under Contract',
                        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                        projected_fee: 12500
                    }
                ];

                setDeals(mockDeals);
                setStats({ assigned: 1, averageFee: '$18,500', buyerActivity: 'High' });
            } catch (error) {
                console.error("Error loading disposition data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDispositionData();
    }, []);

    // 1. Calculate Primary Action using AI Logic
    const primaryAction = getDispositionPrimaryAction(deals);

    // 2. Define Top 3 KPIs
    const kpis = [
        { title: 'Deals Assigned', value: stats.assigned },
        { title: 'Avg Assignment Fee', value: stats.averageFee },
        { title: 'Buyer Network Heat', value: stats.buyerActivity }
    ];

    // 3. Define Automation/Routing rules
    const automationLinks = [
        { label: 'View Inventory', action: () => navigate('/pipeline') },
        { label: 'Manage Buyers List', action: () => alert('Opening Buyer Database...') },
        { label: 'Email Blast History', action: () => alert('Viewing campaign history...') }
    ];

    const executePrimaryAction = () => {
        if (primaryAction.actionType === 'BLAST') {
            alert(`Opening Email/SMS Campaign builder for ${primaryAction.label}`);
        } else {
            alert('Opening matching engine...');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">Loading Disposition Matrix...</div>;

    return (
        <WorkstationWireframe
            personaName="Disposition"
            immediateAction={primaryAction}
            onPrimaryActionClick={executePrimaryAction}
            kpis={kpis}
            automationLinks={automationLinks}
        >
            {/* EXECUTION ZONE BODY */}
            <div className="space-y-4 pt-2">
                <div className="flex-between mb-4">
                    <h4 className="font-bold text-white tracking-wide">Active Inventory</h4>
                    <span className="text-xs text-muted badge bg-secondary">Needs Assignment</span>
                </div>

                {deals.filter(d => d.current_stage === 'Under Contract').map(deal => {
                    const daysAging = Math.floor((new Date() - new Date(deal.updated_at)) / (1000 * 60 * 60 * 24));
                    const isAging = daysAging > 14;

                    return (
                        <div key={deal.id} className="glass-panel p-4 border border-[var(--border-light)] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-bold text-white">{deal.property_address}</h5>
                                </div>
                                <div className="flex items-center gap-4 text-sm mt-2">
                                    <span className={`badge ${isAging ? 'bg-danger text-white border-danger' : 'bg-primary/20 text-primary border-primary/50'}`}>
                                        Aging: {daysAging} Days
                                    </span>
                                    <span className="text-muted flex items-center gap-1">
                                        Projected: <strong className="text-success">${deal.projected_fee.toLocaleString()}</strong>
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="p-2 rounded bg-[rgba(255,255,255,0.05)] text-muted hover:text-success hover:bg-[rgba(16,185,129,0.1)] transition-colors flex items-center gap-2 text-xs font-bold uppercase" title="Match Buyers">
                                    <Users size={14} /> Match
                                </button>
                                <button className={`p-2 rounded flex items-center gap-2 text-xs font-bold uppercase transition-colors ${isAging ? 'bg-danger/20 text-danger border border-danger/50 hover:bg-danger hover:text-white' : 'bg-[rgba(255,255,255,0.05)] text-muted hover:text-white'}`} title="Blast Inventory">
                                    <Send size={14} /> Blast
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Recently Assigned Section */}
                <div className="mt-8">
                    <h4 className="font-bold text-muted tracking-wide mb-4 text-sm uppercase">Recently Assigned</h4>
                    {deals.filter(d => d.current_stage === 'Assigned').map(deal => (
                        <div key={deal.id} className="p-3 border-l-2 border-success bg-[rgba(16,185,129,0.05)] mb-2 flex justify-between items-center">
                            <span className="text-sm text-white opacity-80">{deal.property_address}</span>
                            <span className="text-xs text-success flex items-center gap-1">
                                <Activity size={12} /> Assigned
                            </span>
                        </div>
                    ))}
                </div>

            </div>
        </WorkstationWireframe>
    );
};

export default DispositionDashboard;
