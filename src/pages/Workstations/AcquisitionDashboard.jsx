import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkstationWireframe from '../../components/WorkstationWireframe';
import { getAcquisitionPrimaryAction } from '../../lib/behavioralLogic';
import { Phone, Mail, FileText, CheckCircle } from 'lucide-react';

const AcquisitionDashboard = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState({ activeOffers: 0, appointments: 0, conversionRate: '0%' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAcquisitionData = async () => {
            try {
                // In a real scenario, this fetches from Supabase using RLS
                // For demonstration, we'll use strong mock data triggering the AI logic
                const mockLeads = [
                    { id: '1', first_name: 'Sarah', last_name: 'Jenkins', property_address: '123 Main St, Nashville, TN', heat_score: 85, status: 'New', phone: '555-0101' },
                    { id: '2', first_name: 'Robert', last_name: 'Pike', property_address: '404 Oak Ln, Austin, TX', heat_score: 40, status: 'Contacted', last_contact_date: '2026-02-15T00:00:00Z', follow_up_interval_days: 7, phone: '555-0102' },
                    { id: '3', first_name: 'Amanda', last_name: 'Cole', property_address: '77 Birch Rd, Atlanta, GA', heat_score: 20, status: 'New', phone: '555-0103' }
                ];

                setLeads(mockLeads);
                setStats({ activeOffers: 4, appointments: 2, conversionRate: '18%' });
            } catch (error) {
                console.error("Error loading acquisition data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAcquisitionData();
    }, []);

    // 1. Calculate Primary Action using AI Logic
    const primaryAction = getAcquisitionPrimaryAction(leads, []);

    // 2. Define Top 3 KPIs
    const kpis = [
        { title: 'Active Offers Out', value: stats.activeOffers, action: () => navigate('/pipeline') },
        { title: 'Appointments This Week', value: stats.appointments },
        { title: 'Lead-to-Contract Rate', value: stats.conversionRate }
    ];

    // 3. Define Automation/Routing rules
    const automationLinks = [
        { label: 'View All Leads', action: () => navigate('/pipeline') },
        { label: 'Run Comps (Analyst)', action: () => alert('Opening Comp Matrix...') },
        { label: 'Send SMS Campaign', action: () => alert('Routing to SMS Center...') }
    ];

    const executePrimaryAction = () => {
        if (primaryAction.actionType === 'GENERATE_OFFER') {
            alert(`Opening Document Generator constraint bounds for ${primaryAction.label}`);
            // navigate(`/contracts/new?lead=${primaryAction.targetId}`)
        } else if (primaryAction.actionType === 'FOLLOW_UP') {
            alert(`Logging call intent for ${primaryAction.label}`);
        } else {
            alert('Loading prospecting dialer...');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">Loading Acquisition Matrix...</div>;

    return (
        <WorkstationWireframe
            personaName="Acquisition"
            immediateAction={primaryAction}
            onPrimaryActionClick={executePrimaryAction}
            kpis={kpis}
            automationLinks={automationLinks}
        >
            {/* EXECUTION ZONE BODY */}
            <div className="space-y-4 pt-2">
                <div className="flex-between mb-4">
                    <h4 className="font-bold text-white tracking-wide">High Priority Queue</h4>
                    <span className="text-xs text-muted badge bg-secondary">Sorted by Heat Score</span>
                </div>

                {leads.sort((a, b) => b.heat_score - a.heat_score).slice(0, 5).map(lead => (
                    <div key={lead.id} className="glass-panel p-4 border border-[var(--border-light)] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${lead.heat_score > 70 ? 'bg-danger' : lead.heat_score > 40 ? 'bg-warning' : 'bg-primary'}`}></span>
                                <h5 className="font-bold text-white">{lead.first_name} {lead.last_name}</h5>
                                <span className="text-xs text-muted font-mono ml-2">Score: {lead.heat_score}</span>
                            </div>
                            <p className="text-sm text-muted">{lead.property_address}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded bg-[rgba(255,255,255,0.05)] text-muted hover:text-primary hover:bg-[rgba(99,102,241,0.1)] transition-colors" title="Call">
                                <Phone size={16} />
                            </button>
                            <button className="p-2 rounded bg-[rgba(255,255,255,0.05)] text-muted hover:text-success hover:bg-[rgba(16,185,129,0.1)] transition-colors" title="SMS">
                                <Mail size={16} />
                            </button>
                            {lead.heat_score > 70 && (
                                <button className="p-2 rounded bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase" title="Draft Contract">
                                    <FileText size={14} /> Offer
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {leads.length === 0 && (
                    <div className="p-8 text-center border border-dashed border-[var(--border-light)] rounded-lg text-muted flex flex-col items-center justify-center">
                        <CheckCircle className="text-success mb-2 opacity-50" size={32} />
                        <p>Inbox zero. All critical tasks cleared.</p>
                    </div>
                )}
            </div>
        </WorkstationWireframe>
    );
};

export default AcquisitionDashboard;
