/**
 * Bloomberg-Style Voice Templates
 * Designed for concise, data-focused situational awareness.
 */

export const assistantMessages = {
    // Marketplace & Overviews
    marketplaceLoaded: (count: number) =>
        `Marketplace active. ${count} deals match your investment profile.`,

    pipelineLoaded: (actionableCount: number) =>
        `Pipeline loaded. ${actionableCount} deals awaiting your attention.`,

    // Component Interactions
    analyzerLoaded: (projectedProfit: number) =>
        `Analyzer complete. Projected profit $${projectedProfit.toLocaleString()}.`,

    titlePortalLoaded: () =>
        "Title portal active. Awaiting closing code verification.",

    // Specific Deal Details
    dealOpened: (score: number, isVerified: boolean) =>
        `Deal analysis loaded. Deal score ${score}. ${isVerified ? 'Property verified.' : 'Verification pending.'}`,

    investorActivityDetect: (count: number) =>
        `Investor activity detected. ${count} users viewed this property recently.`,

    dealScoreWarning: () =>
        "Deal score below platform average. Additional underwriting recommended.",

    // Transaction Events
    dealReserved: () =>
        "Reservation successful. Escrow deposit required within twenty four hours.",

    escrowConfirmed: () =>
        "Escrow confirmed. Awaiting title verification.",

    titleCleared: () =>
        "Title verification complete. This deal is ready for immediate closing.",

    dealPublished: () =>
        "Deal active. Priority blast routed to targeted investors.",

    documentVerified: () =>
        "Proof of control verified. Deal integrity secured."
};
