/**
 * Evaluates the parsed foreclosure lead and assigns an intelligence deal_score.
 */
export function generateDealScore(leadData: any): number {
    let score = 50; // Baseline score for any discovered foreclosure

    console.log(`[Lead Scorer] Evaluating opportunity for Parcel ${leadData.parcel_id}`);

    // Type weightings
    if (leadData.notice_type === 'Notice of Default') {
        score += 25; // Pre-foreclosure, high potential to negotiate
    } else if (leadData.notice_type === 'Substitute Trustee Sale') {
        score += 15; // Approaching auction
    } else if (leadData.notice_type === 'Tax Delinquency') {
        score += 10;
    }

    // Geograhic weightings (Mock examples)
    if (leadData.county === 'Davidson') {
        score += 10; // High demand market
    } else if (leadData.county === 'Williamson') {
        score += 15; // Premium market
    }

    // Cap at 99
    return Math.min(score, 99);
}
