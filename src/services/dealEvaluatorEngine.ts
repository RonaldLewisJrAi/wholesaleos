import { supabase as supabaseClient } from '../lib/supabase';

const supabase = supabaseClient!;
export interface DealIntelligenceParams {
    property_id?: string;
    lead_id?: string;
    arv: number;
    asking_price: number;
    estimated_repairs: number;
    zip_code: string;
    wholesaler_id?: string;
}

export interface DealIntelligenceReport {
    ai_deal_score: number;
    equity_spread: number;
    arv_confidence: 'High' | 'Medium' | 'Low';
    buyer_demand: 'Strong' | 'Moderate' | 'Weak';
    risk_level: 'Low' | 'Medium' | 'High';
    recommended_offer: number;
    estimated_assignment_fee: number;
    liquidity_signal: 'High' | 'Medium' | 'Low';
}

/**
 * Executes the Phase 56 AI Deal Evaluator Engine.
 * Sources market data and calculates equity spreads to assign risk vectors.
 */
export async function generateDealIntelligence(params: DealIntelligenceParams): Promise<DealIntelligenceReport> {
    const { arv, asking_price, estimated_repairs, zip_code, wholesaler_id } = params;

    // 1. Calculate Absolute Equity & Spread
    const total_cost = asking_price + estimated_repairs;
    const equity_spread = arv - total_cost;
    const equity_percent = arv > 0 ? (equity_spread / arv) * 100 : 0;

    // 2. Fetch Buyer Demand (Liquidity Signal) from RPC
    let liquidity_signal: 'High' | 'Medium' | 'Low' = 'Medium';
    let buyer_demand: 'Strong' | 'Moderate' | 'Weak' = 'Moderate';

    if (zip_code) {
        try {
            const { data, error } = await supabase.rpc('calculate_buyer_demand', { target_zip: zip_code });
            if (!error && data) {
                if (data === 'HIGH') {
                    liquidity_signal = 'High';
                    buyer_demand = 'Strong';
                } else if (data === 'LOW') {
                    liquidity_signal = 'Low';
                    buyer_demand = 'Weak';
                }
            }
        } catch (err) {
            console.error('[DealEvaluator] Error fetching liquidity signal:', err);
        }
    }

    // 3. Obtain Trust Score Multiplier (if sourced by a wholesaler)
    let trust_bonus = 0;
    if (wholesaler_id) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('trust_score')
            .eq('id', wholesaler_id)
            .single();

        if (profile) {
            if (profile.trust_score >= 80) trust_bonus = 10;
            else if (profile.trust_score >= 50) trust_bonus = 5;
            else if (profile.trust_score < 30) trust_bonus = -10;
        }
    }

    // 4. Calculate Risk Level
    let risk_level: 'Low' | 'Medium' | 'High' = 'Medium';
    if (equity_percent >= 35 && liquidity_signal === 'High') risk_level = 'Low';
    else if (equity_percent <= 15 || estimated_repairs > (arv * 0.3)) risk_level = 'High';

    // 5. Generate Base AI Deal Score (Scale 0-100)
    let base_score = 50;

    // Equity contribution (up to 30 pts)
    base_score += Math.min(30, equity_percent);

    // Liquidity contribution
    if (liquidity_signal === 'High') base_score += 15;
    else if (liquidity_signal === 'Low') base_score -= 10;

    // Risk detraction
    if (risk_level === 'Low') base_score += 10;
    else if (risk_level === 'High') base_score -= 15;

    // Apply Wholesaler Trust Bonus
    let ai_deal_score = Math.floor(base_score + trust_bonus);
    ai_deal_score = Math.max(0, Math.min(100, ai_deal_score));

    // 6. Offer Math (70% Rule Adjusted for Risk)
    let mao_multiplier = 0.70;
    if (liquidity_signal === 'High') mao_multiplier = 0.75; // Hot markets compress margins
    if (risk_level === 'High') mao_multiplier = 0.65; // High risk requires deeper discount

    const max_allowable_offer = (arv * mao_multiplier) - estimated_repairs;

    // Calculate targeted assignment fee (typically $10k-$20k or percentage of spread)
    const estimated_assignment_fee = Math.min(20000, Math.max(5000, equity_spread * 0.15));
    const recommended_offer = max_allowable_offer - estimated_assignment_fee;

    // ARV Confidence (Heuristic placeholder -- in prod, this requires variance checks across 3 comps)
    const arv_confidence = arv > 0 ? 'High' : 'Low';

    const report: DealIntelligenceReport = {
        ai_deal_score,
        equity_spread,
        arv_confidence,
        buyer_demand,
        risk_level,
        recommended_offer: Math.floor(Math.max(0, recommended_offer)),
        estimated_assignment_fee: Math.floor(estimated_assignment_fee),
        liquidity_signal
    };

    // 7. Fire Database Appends if valid Lead/Property ID exists
    if (params.property_id || params.lead_id) {
        const table = params.property_id ? 'properties' : 'foreclosure_leads';
        const target_id = params.property_id || params.lead_id;

        await supabase.from(table)
            .update({
                ai_deal_score,
                ai_confidence: arv_confidence,
                risk_level,
                liquidity_signal,
                recommended_offer: report.recommended_offer
            })
            .eq('id', target_id);
    }

    return report;
}
