import { supabase } from '../lib/supabase';

export interface SellerDistressParams {
    tax_delinquent?: boolean;
    code_violations?: boolean;
    vacancy_indicator?: boolean;
    auction_date?: string | null;
}

export interface DistressReport {
    distress_score: number;
    distress_level: 'Critical' | 'High' | 'Moderate' | 'Low';
    primary_vector: string;
}

/**
 * Phase 57: Motivated Seller OSINT Engine
 * Calculates a 0-100 distress score based on compiled trailing indicators.
 */
export function calculateSellerDistress(params: SellerDistressParams): DistressReport {
    let score = 0;
    let vectors: string[] = [];

    // 1. Imminent Auction Danger (Highest Weight)
    if (params.auction_date) {
        const auctionDate = new Date(params.auction_date);
        const daysUntilAuction = (auctionDate.getTime() - Date.now()) / (1000 * 3600 * 24);

        if (daysUntilAuction > 0 && daysUntilAuction <= 30) {
            score += 50;
            vectors.push('Imminent Auction (< 30d)');
        } else if (daysUntilAuction > 30 && daysUntilAuction <= 90) {
            score += 30;
            vectors.push('Pending Auction (< 90d)');
        }
    }

    // 2. Financial Distress (High Weight)
    if (params.tax_delinquent) {
        score += 35;
        vectors.push('Tax Delinquent');
    }

    // 3. Property Neglect / Municipal Action (Medium Weight)
    if (params.code_violations) {
        score += 20;
        vectors.push('Code Violations');
    }

    // 4. Abandonment Risk (Medium Weight)
    if (params.vacancy_indicator) {
        score += 25;
        vectors.push('Vacant Property');
    }

    // Cap the distress score at 100
    const finalScore = Math.min(100, score);

    // Determine semantic severity
    let level: DistressReport['distress_level'] = 'Low';
    if (finalScore >= 75) level = 'Critical';
    else if (finalScore >= 50) level = 'High';
    else if (finalScore >= 25) level = 'Moderate';

    return {
        distress_score: finalScore,
        distress_level: level,
        primary_vector: vectors.length > 0 ? vectors[0] : 'None'
    };
}
