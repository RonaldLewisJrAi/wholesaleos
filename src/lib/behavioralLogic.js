/**
 * Behavioral Architecture Engine
 * Purpose: Analyzes current dataset and outputs the SINGLE most important prescriptive action 
 * for the Persona's Immediate Action Zone.
 */

// Acquisition Persona Logic
export const getAcquisitionPrimaryAction = (leads) => {
    // 1. Check for highly motivated, actionable leads first
    const hotLeads = leads?.filter(l => l.heat_score > 75 && l.status === 'New');
    if (hotLeads && hotLeads.length > 0) {
        return {
            label: `Generate Offer: ${hotLeads[0].property_address || 'Hot Lead'}`,
            actionType: 'GENERATE_OFFER',
            urgency: 'critical',
            targetId: hotLeads[0].id,
            description: `Lead motivation score indicates immediate action required. Heat: ${hotLeads[0].heat_score}`,
            reasoning: [
                { category: 'Data Input', detail: `Heat Score = ${hotLeads[0].heat_score} (Threshold > 75)` },
                { category: 'Trigger Source', detail: 'Market Velocity Algorithm' },
                { category: 'Risk Weight', detail: 'Opportunity Loss (High)' }
            ]
        };
    }

    // 2. Check for follow-ups due
    const dueFollowUps = leads?.filter(l => {
        if (!l.last_contact_date) return true;
        const daysSinceContact = (new Date() - new Date(l.last_contact_date)) / (1000 * 60 * 60 * 24);
        return daysSinceContact >= (l.follow_up_interval_days || 7);
    });

    if (dueFollowUps && dueFollowUps.length > 0) {
        return {
            label: `Follow Up: ${dueFollowUps[0].first_name} ${dueFollowUps[0].last_name}`,
            actionType: 'FOLLOW_UP',
            urgency: 'high',
            targetId: dueFollowUps[0].id,
            description: `Lead requires contact. Overdue by schedule.`,
            reasoning: [
                { category: 'Data Input', detail: `Last Contact: ${dueFollowUps[0].last_contact_date || 'Never'}` },
                { category: 'Trigger Source', detail: 'Follow-Up SLA' },
                { category: 'Risk Weight', detail: 'Relationship Decay (Medium)' }
            ]
        };
    }

    // Default Fallback
    return {
        label: 'Prospect New Leads',
        actionType: 'PROSPECT',
        urgency: 'normal',
        description: 'No immediate critical actions. Focus on outbound pipeline generation.',
        reasoning: [
            { category: 'Trigger Source', detail: 'System Default' },
            { category: 'Risk Weight', detail: 'None' }
        ]
    };
};

// Disposition Persona Logic
export const getDispositionPrimaryAction = (activeDeals) => {
    // NEW LOGIC: Priority 1 is Deal Discipline Score (DDS)
    const indisciplinedDeals = activeDeals?.filter(d => d.deal_discipline_score !== null && d.deal_discipline_score !== undefined && d.deal_discipline_score < 60);

    if (indisciplinedDeals && indisciplinedDeals.length > 0) {
        return {
            label: `Fix Operational Discipline: ${indisciplinedDeals[0].property_address || 'Deal'}`,
            actionType: 'FIX_DISCIPLINE',
            urgency: 'critical',
            targetId: indisciplinedDeals[0].id,
            description: `DDS is critically low (${indisciplinedDeals[0].deal_discipline_score}/100).`,
            reasoning: [
                { category: 'Data Input', detail: `Deal Discipline Score = ${indisciplinedDeals[0].deal_discipline_score}` },
                { category: 'Trigger Source', detail: 'Operational Guardrails Engine' },
                { category: 'Risk Weight', detail: 'Legal/Compliance (Critical)' }
            ]
        };
    }

    // 1. Check for aging under-contract deals that need buyers
    const agingDeals = activeDeals?.filter(d => {
        if (d.current_stage !== 'Under Contract') return false;
        const daysInContract = (new Date() - new Date(d.updated_at)) / (1000 * 60 * 60 * 24);
        return daysInContract > 14;
    });

    if (agingDeals && agingDeals.length > 0) {
        return {
            label: `Blast to Buyers: ${agingDeals[0].property_address || 'Aging Deal'}`,
            actionType: 'BLAST',
            urgency: 'critical',
            targetId: agingDeals[0].id,
            description: `Deal aging > 14 days. Immediate disposition required.`,
            reasoning: [
                { category: 'Data Input', detail: `Stage: Under Contract. Updated: ${new Date(agingDeals[0].updated_at).toLocaleDateString()}` },
                { category: 'Trigger Source', detail: 'Asset Liquidity Timer' },
                { category: 'Risk Weight', detail: 'Contract Expiration (High)' }
            ]
        };
    }

    // 2. Check for high liquidity matches
    return {
        label: 'Review Buyer Matches',
        actionType: 'MATCHMAKING',
        urgency: 'normal',
        description: 'Review system-suggested connections for active inventory.',
        reasoning: [
            { category: 'Trigger Source', detail: 'Pattern Matching Engine' }
        ]
    };
};

// Compliance Persona Logic
export const getCompliancePrimaryAction = (flags) => {
    // Determine if there are critical compliance blockers
    const criticalFlags = flags?.filter(f => f.severity === 'Critical' && !f.resolved);

    if (criticalFlags && criticalFlags.length > 0) {
        return {
            label: `Resolve Blockers (${criticalFlags.length})`,
            actionType: 'RESOLVE_FLAGS',
            urgency: 'critical',
            targetId: criticalFlags[0].deal_id,
            description: `High legal risk detected. ${criticalFlags[0].description}`,
            reasoning: [
                { category: 'Data Input', detail: `Unresolved Flag: ${criticalFlags[0].flag_type}` },
                { category: 'Trigger Source', detail: 'Risk Evaluation Engine' },
                { category: 'Risk Weight', detail: 'Legal Hazard (Critical)' }
            ]
        };
    }

    return {
        label: 'Run System Audit',
        actionType: 'AUDIT',
        urgency: 'normal',
        description: 'All clear. Maintain escrow timelines.',
        reasoning: [
            { category: 'Trigger Source', detail: 'System Default' }
        ]
    };
};
