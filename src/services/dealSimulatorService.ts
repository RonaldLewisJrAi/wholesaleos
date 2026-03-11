export const dealSimulatorService = {
    generateMockLead: () => {
        return {
            id: `sim_${Date.now()}`,
            address: '123 Fake St, Dallas, TX',
            seller: 'John Doe',
            motivation: 'Inherited out of state property, cannot afford high property taxes. House needs work.',
            timeline: 'Wants to sell within 30 days',
            askPrice: 150000,
            trueARV: 240000,
            trueRepairs: 45000,
            optimalMAO: 108000 // (240k * .7) - 45k - 15k targeted fee
        };
    },

    evaluateAnalysis: (lead: any, userArv: number, userRepairs: number, userOffer: number) => {
        let score = 100;
        let feedback = [];

        // Check ARV accuracy (within $5k)
        if (Math.abs(userArv - lead.trueARV) > 5000) {
            score -= 20;
            feedback.push(`Your ARV ($${userArv}) is inaccurate. The true ARV based on exact 0.5mi comps is $${lead.trueARV}.`);
        } else {
            feedback.push(`Excellent ARV calculation! Spot on.`);
        }

        // Check Repairs (within $5k)
        if (Math.abs(userRepairs - lead.trueRepairs) > 5000) {
            score -= 20;
            feedback.push(`Your repair estimate ($${userRepairs}) is inaccurate. Standard rehab for this footage/condition is $${lead.trueRepairs}.`);
        } else {
            feedback.push(`Good repair estimation.`);
        }

        // Check Offer / MAO limits
        if (userOffer > lead.optimalMAO) {
            score -= 30;
            feedback.push(`Your offer ($${userOffer}) exceeds the Maximum Allowable Offer ($${lead.optimalMAO}). You will likely struggle to find an investor for this, or you will make zero assignment fee.`);
        } else if (userOffer < lead.optimalMAO - 20000) {
            feedback.push(`Your offer ($${userOffer}) is very low. Great if the seller accepts, but high risk of losing the deal to competitors.`);
        } else {
            feedback.push(`Your offer is perfectly calibrated for a solid assignment fee.`);
        }

        // Negotiation aspect (seller asked for 150k)
        if (userOffer >= lead.askPrice) {
            feedback.push(`You offered their asking price or higher. The seller accepted immediately, but this is a bad deal!`);
        } else {
            feedback.push(`You successfully negotiated the price down from $${lead.askPrice} based on the property condition.`);
        }

        if (score < 0) score = 0;

        return {
            passed: score >= 70,
            score,
            feedback
        };
    }
};
