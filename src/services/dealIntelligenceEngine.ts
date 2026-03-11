export interface IntelligenceDealData {
    arv?: number;
    purchase_price?: number;
    repairs?: number;
    buyerDemand?: number; // scale 0-10
    repairConfidence?: number; // scale 0-100
    riskScore?: number; // scale 0-100 (in this context, higher is a better risk profile)
    escrowStatus?: string;
    titleVerified?: boolean;
    locationDemand?: number; // scale 0-100
    historicalCloseRate?: number; // scale 0-100
}

/**
 * Normalizes a value between a min and max to a 0-100 scale.
 */
function normalize(value: number, min: number, max: number): number {
    if (value <= min) return 0;
    if (value >= max) return 100;
    return ((value - min) / (max - min)) * 100;
}

/**
 * AI Deal Score
 * Answers: How strong is this deal overall?
 * Range: 0 - 100
 */
export function calculateDealScore(deal: IntelligenceDealData): number {
    const arv = deal.arv || 250000;
    const purchase = deal.purchase_price || 180000;
    const repairs = deal.repairs || 25000;

    const spread = arv - purchase - repairs;
    // A spread of $50k+ is considered perfect (100) for this baseline
    const spreadScore = normalize(spread, 0, 50000);

    // Default to a medium demand (5 * 10 = 50) if missing
    const liquidityScore = (deal.buyerDemand ?? 5) * 10;

    const repairConfidence = deal.repairConfidence ?? 70;

    // In this equation, a higher riskScore implies higher safety/confidence
    const riskScore = deal.riskScore ?? 80;

    const finalScore = Math.round(
        (spreadScore * 0.4) +
        (liquidityScore * 0.3) +
        (repairConfidence * 0.2) +
        (riskScore * 0.1)
    );

    return Math.min(100, Math.max(0, finalScore));
}

export interface LiquidityResult {
    score: number;
    label: 'HIGH' | 'MODERATE' | 'LOW';
}

/**
 * Liquidity Signal
 * Answers: How easily will this deal sell?
 * Range: 0 - 100 mapped to HIGH, MODERATE, LOW
 */
export function calculateLiquiditySignal(deal: IntelligenceDealData): LiquidityResult {
    const investorActivity = normalize((deal.buyerDemand ?? 5) * 10, 0, 100);
    const locationDemand = deal.locationDemand ?? 60;

    // Blend investor activity and historical location demand
    const score = Math.round((investorActivity * 0.6) + (locationDemand * 0.4));

    let label: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    if (score >= 80) label = 'HIGH';
    else if (score >= 50) label = 'MODERATE';

    return { score, label };
}

/**
 * Close Probability
 * Answers: How likely this deal will actually close.
 * Range: 0 - 100%
 */
export function calculateCloseProbability(deal: IntelligenceDealData): number {
    const dealScore = calculateDealScore(deal);
    const liquidity = calculateLiquiditySignal(deal).score;

    // Baseline probability from the pure deal metrics
    let baseProb = (dealScore * 0.5) + (liquidity * 0.3);

    // Escrow Status Boost
    const escrowActive = deal.escrowStatus === 'CLEARED' || deal.escrowStatus === 'ACTIVE' || deal.escrowStatus === 'OPEN';
    if (escrowActive) {
        baseProb += 10;
    }

    // Title Verification Boost
    if (deal.titleVerified) {
        baseProb += 10;
    }

    const historical = deal.historicalCloseRate ?? 70;

    // Final blend incorporates real-world historical closing averages
    const finalProb = Math.round((baseProb * 0.8) + (historical * 0.2));

    return Math.min(100, Math.max(0, finalProb));
}
