import { assistantMessages } from './assistantVoiceTemplates';

/**
 * Assistant Insight Generator
 * Translates structured contexts into human-readable spoken analysis.
 */

export const assistantInsightService = {

    // Page load narriations
    getMarketplaceSummary: (dealCount: number = 12) => {
        return assistantMessages.marketplaceLoaded(dealCount);
    },

    getPipelineSummary: (actionableCount: number = 2) => {
        return assistantMessages.pipelineLoaded(actionableCount);
    },

    getAnalyzerSummary: (profit: number = 23000) => {
        return assistantMessages.analyzerLoaded(profit);
    },

    getTitlePortalSummary: () => {
        return assistantMessages.titlePortalLoaded();
    },

    // Deal Room deep interactions
    getDealRoomSummary: (context: any) => {
        if (!context) return "Deal analysis loaded.";

        let summary = assistantMessages.dealOpened(context.score, context.isVerified);

        if (context.isEscrowConfirmed && !context.isTitleCleared) {
            summary += " Escrow confirmed. Awaiting title verification.";
        } else if (context.isTitleCleared) {
            summary += " Title cleared. Deal is ready for execution.";
        }

        if (context.score < 60) {
            summary += " " + assistantMessages.dealScoreWarning();
        }

        if (context.priority) {
            summary += " This is a priority blast listing.";
        }

        return summary;
    },

    getInvestorActivityInsight: (viewerCount: number) => {
        if (viewerCount > 2) {
            return assistantMessages.investorActivityDetect(viewerCount);
        }
        return null;
    }
};
