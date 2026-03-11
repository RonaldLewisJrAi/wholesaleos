export interface LiquidityInvestor {
    id: string;
    name: string;
    market: string;
    maxPrice: number;
    propertyType: string[];
    avgCloseDays: number;
    trustScore?: number;
}

export interface LiquidityDeal {
    id: string;
    market: string; // e.g. "Dallas, TX" or just "Dallas" 
    purchase_price: number;
    property_type: string;
    dealScore: number;
}

export interface MatchResult {
    investorId: string;
    investorName: string;
    matchScore: number;
    reasons: string[];
}

/**
 * Evaluates a deal against an array of investor profiles and returns them ranked by match probability.
 */
export function matchDealToInvestors(deal: LiquidityDeal, investors: LiquidityInvestor[]): MatchResult[] {
    return investors.map((investor) => {
        let score = 0;
        const reasons: string[] = [];

        // Location Check
        if (investor.market && deal.market && investor.market.toLowerCase() === deal.market.toLowerCase()) {
            score += 30;
            reasons.push("Market Match");
        } else if (investor.market && deal.market && deal.market.toLowerCase().includes(investor.market.toLowerCase())) {
            // Partial match (e.g. "TX" matches "Dallas, TX")
            score += 15;
            reasons.push("Partial Market Match");
        }

        // Price Check
        if (investor.maxPrice >= deal.purchase_price) {
            score += 20;
            reasons.push("Within Budget");
        }

        // Property Type Check
        if (investor.propertyType && investor.propertyType.includes(deal.property_type)) {
            score += 20;
            reasons.push("Asset Type Match");
        } else if (!investor.propertyType || investor.propertyType.length === 0 || investor.propertyType.includes('Any')) {
            // If investor is agnostic
            score += 10;
        }

        // Execution Speed
        if (investor.avgCloseDays < 21) {
            score += 10;
            reasons.push("Fast Closer (<21 Days)");
        }

        // Deal Quality Override
        if (deal.dealScore > 85) {
            score += 20;
            reasons.push("High Deal Score Override");
        }

        // Cap at 100%
        const finalScore = Math.min(score, 100);

        return {
            investorId: investor.id,
            investorName: investor.name,
            matchScore: finalScore,
            reasons
        };
    }).sort((a, b) => b.matchScore - a.matchScore);
}

// Mock Investors for Phase 27 demonstrations
export const mockLiquidityInvestors: LiquidityInvestor[] = [
    { id: 'inv-1', name: 'AlphaCap Investments', market: 'Dallas', maxPrice: 500000, propertyType: ['Single Family', 'Multi Family'], avgCloseDays: 14, trustScore: 92 },
    { id: 'inv-2', name: 'Texas Rental Portfolio', market: 'Austin', maxPrice: 300000, propertyType: ['Single Family'], avgCloseDays: 25, trustScore: 85 },
    { id: 'inv-3', name: 'National Hedge Fund Buyer', market: 'Any', maxPrice: 1500000, propertyType: ['Single Family', 'Multi Family', 'Commercial'], avgCloseDays: 10, trustScore: 99 },
    { id: 'inv-4', name: 'Rapid Flip LLC', market: 'Miami', maxPrice: 200000, propertyType: ['Single Family'], avgCloseDays: 30, trustScore: 75 },
    { id: 'inv-5', name: 'Emerald Capital', market: 'Seattle', maxPrice: 800000, propertyType: ['Multi Family'], avgCloseDays: 18, trustScore: 88 },
];
