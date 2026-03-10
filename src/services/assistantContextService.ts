/**
 * Assistant Context Engine 
 * Reads current React Router window locations and Deal States to determine context.
 */

export const assistantContextService = {
    getCurrentPageContext: (pathname: string) => {
        if (pathname === '/marketplace') return 'MarketplaceFeed';
        if (pathname.includes('/deal/')) return 'DealRoom';
        if (pathname === '/pipeline') return 'PipelineBoard';
        if (pathname === '/analyzer') return 'DealAnalyzer';
        if (pathname === '/title-portal') return 'TitlePortal';
        if (pathname === '/investor') return 'InvestorDashboard';
        return 'Unknown';
    },

    getDealContext: (deal: any, role: string) => {
        if (!deal) return null;

        return {
            dealId: deal.id,
            status: deal.status,
            priority: deal.priority,
            daysOnMarket: deal.days || 0,
            viewerCount: deal.viewerCount || 0, // Mocked telemetry 
            isVerified: deal.poc_verified || false,
            isEscrowConfirmed: deal.escrow_paid || false,
            isTitleCleared: deal.title_verified || false,
            score: typeof deal.deal_discipline_score === 'number' ? deal.deal_discipline_score
                : (deal.bdiScore ? 85 : 75), // Fallback map
            projectedProfit: deal.projectedProfit || 25000,
            role: role
        };
    }
};
