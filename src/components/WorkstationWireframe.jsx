import React from 'react';
import { AlertCircle, Zap, ArrowRight, Settings } from 'lucide-react';

/**
 * Intelligent Wireframe Layout Engine
 * Enforces the Behavioral Architecture 4-Zone Rule:
 * 1. Immediate Action
 * 2. Decision (KPIs)
 * 3. Execution (Main Content)
 * 4. Automation (Footer Routing)
 */
const WorkstationWireframe = ({
    personaName,
    immediateAction,
    kpis,
    children,
    automationLinks,
    onPrimaryActionClick
}) => {

    // Determine highlight color based on urgency of primary action
    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'critical': return 'border-danger text-danger bg-[rgba(239,68,68,0.1)] shadow-[0_0_15px_rgba(239,68,68,0.2)]';
            case 'high': return 'border-warning text-warning bg-[rgba(245,158,11,0.1)] shadow-[0_0_15px_rgba(245,158,11,0.2)]';
            default: return 'border-primary text-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]';
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 max-w-7xl mx-auto p-4 animate-fade-in">

            {/* ZONE 1: IMMEDIATE ACTION ZONE (Top) */}
            {/* Prescriptive constraint: System detects the most important path forward. */}
            <section className={`glass-panel rounded-xl p-6 border flex flex-col md:flex-row items-center justify-between ${getUrgencyColor(immediateAction?.urgency)} transition-all duration-500`}>
                <div className="flex items-start gap-4 mb-4 md:mb-0">
                    <div className="p-3 bg-black/40 rounded-full border border-white/10 mt-1">
                        {immediateAction?.urgency === 'critical' ? <AlertCircle size={24} /> : <Zap size={24} />}
                    </div>
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">
                            {personaName} • Prescriptive Action
                        </h2>
                        <p className="text-xl md:text-2xl font-semibold text-white">
                            {immediateAction?.label || "No immediate actions required."}
                        </p>
                        {immediateAction?.description && (
                            <p className="text-xs mt-2 opacity-80 max-w-2xl">
                                {immediateAction.description}
                            </p>
                        )}
                    </div>
                </div>

                {immediateAction && (
                    <button
                        onClick={onPrimaryActionClick}
                        className="px-8 py-4 bg-white text-black font-bold uppercase tracking-wider rounded border-none hover:bg-gray-200 transition-colors flex items-center gap-2 flex-shrink-0"
                    >
                        Execute <ArrowRight size={18} />
                    </button>
                )}
            </section>

            {/* ZONE 2: DECISION ZONE (Middle - Max 3 KPIs) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kpis?.slice(0, 3).map((kpi, idx) => (
                    <div key={idx} className="glass-panel p-5 border border-[var(--border-light)] rounded-xl flex justify-between items-center group hover:border-[var(--primary-color)] transition-colors cursor-default">
                        <div>
                            <p className="text-xs text-muted font-bold uppercase tracking-wider mb-1">{kpi.title}</p>
                            <h3 className="text-3xl font-bold text-white tracking-tight">{kpi.value}</h3>
                        </div>
                        {kpi.action && (
                            <button onClick={kpi.action} className="text-muted hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                <Settings size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </section>

            {/* ZONE 3: EXECUTION ZONE (Main Body) */}
            <section className="flex-1 glass-panel border border-[var(--border-light)] rounded-xl p-0 overflow-hidden relative min-h-[400px]">
                {/* Visual architectural indicator */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent opacity-50"></div>

                <div className="p-6 h-full flex flex-col">
                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4 border-b border-[var(--border-light)] pb-2 inline-block">
                        Execution Environment
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {children}
                    </div>
                </div>
            </section>

            {/* ZONE 4: AUTOMATION / NEXT STEP ZONE (Bottom) */}
            <section className="glass-panel border border-[var(--border-light)] rounded-xl p-4 flex gap-4 overflow-x-auto custom-scrollbar">
                <div className="flex items-center text-xs font-bold text-muted uppercase tracking-wider px-2 border-r border-[var(--border-light)] whitespace-nowrap">
                    Workflow Routing
                </div>
                <div className="flex gap-2 w-full">
                    {automationLinks?.map((link, idx) => (
                        <button
                            key={idx}
                            onClick={link.action}
                            className="px-4 py-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded hover:bg-[rgba(255,255,255,0.1)] text-xs text-muted hover:text-white transition-colors flex-shrink-0"
                        >
                            {link.label}
                        </button>
                    ))}
                </div>
            </section>

        </div>
    );
};

export default WorkstationWireframe;
