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
            description: `Lead motivation score indicates immediate action required. Heat: ${hotLeads[0].heat_score}`
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
            description: `Lead requires contact. Overdue by schedule.`
        };
    }

    // Default Fallback
    return {
        label: 'Prospect New Leads',
        actionType: 'PROSPECT',
        urgency: 'normal',
        description: 'No immediate critical actions. Focus on outbound pipeline generation.'
    };
};

// Disposition Persona Logic
export const getDispositionPrimaryAction = (activeDeals) => {
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
            description: `Deal aging > 14 days. Immediate disposition required.`
        };
    }

    // 2. Check for high liquidity matches
    // (Simulated logic: in reality, would cross-reference deal specs with buyer criteria)
    return {
        label: 'Review Buyer Matches',
        actionType: 'MATCHMAKING',
        urgency: 'normal',
        description: 'Review system-suggested connections for active inventory.'
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
            targetId: criticalFlags[0].id,
            description: `High legal risk detected. EMD missing or unsigned disclosures.`
        };
    }

    return {
        label: 'Run System Audit',
        actionType: 'AUDIT',
        urgency: 'normal',
        description: 'All clear. Maintain escrow timelines.'
    };
};
