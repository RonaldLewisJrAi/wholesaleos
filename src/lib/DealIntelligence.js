import { supabase } from './supabase';

/**
 * Phase 28: Predictive Deal Intelligence Engine
 * A suite of AI-driven mathematical models and database queries to calculate the
 * viability, timeline, and buyer demand for wholesale real estate deals.
 */

// 1. Assignment Fee Range Predictor (AFR)
// Formula: (ARV * 70%) - Repairs - Purchase Price/MAO
export const calculateAssignmentFeeRange = (arv, purchasePrice, repairs) => {
    const numArv = parseFloat(arv) || 0;
    const numPrice = parseFloat(purchasePrice) || 0;
    const numRepairs = parseFloat(repairs) || 0;

    if (numArv === 0) return { min: 0, max: 0, formatted: "N/A" };

    // Standard 70% Rule Margin
    const mao = (numArv * 0.70) - numRepairs;

    // The nominal wholesale fee is the gap between MAO and actual locked Purchase Price
    const baseFee = mao - numPrice;

    // Predict range based on market variance (approx +/- 15%)
    const minFee = Math.max(0, baseFee * 0.85); // Cannot have a negative fee in projection
    const maxFee = Math.max(0, baseFee * 1.15);

    return {
        min: minFee,
        max: maxFee,
        formatted: `$${(minFee / 1000).toFixed(1)}k - $${(maxFee / 1000).toFixed(1)}k`
    };
};

// 2. Buyer Demand Index (BDI)
// Queries the `profiles` table to see how many VIP Investors actively want this Zip/Property Type
export const calculateBuyerDemandIndex = async (zipCode, propertyType) => {
    if (!supabase || !zipCode) return { score: "Cold", matches: 0 };

    try {
        // Query Profiles where role is Investor
        // and target_markets contains the zipCode OR property_types contains the type
        const { data, error } = await supabase
            .from('profiles')
            .select('id, target_markets, property_types')
            .eq('role', 'Investor');

        if (error) throw error;
        if (!data || data.length === 0) return { score: "Cold (0)", matches: 0 };

        let matchCount = 0;
        data.forEach(investor => {
            const markets = (investor.target_markets || "").toLowerCase();
            const types = (investor.property_types || "").toLowerCase();

            // Check for Zip Match or exact Property Type match (e.g. SFR)
            if (markets.includes(zipCode.toString().toLowerCase()) || types.includes("any") || (propertyType && types.includes(propertyType.toLowerCase()))) {
                matchCount++;
            }
        });

        // Dynamic Scoring Matrix based on active platform buyers
        let scoreLabel = "Cold";
        if (matchCount >= 5) scoreLabel = "🔥 INSANE";
        else if (matchCount >= 3) scoreLabel = "HOT";
        else if (matchCount >= 1) scoreLabel = "Warm";

        return { score: `${scoreLabel} (${matchCount})`, matches: matchCount };

    } catch (err) {
        console.error("BDI Calculation Error:", err);
        return { score: "Offline", matches: 0 };
    }
};

// 3. Estimated Time-To-Close (ETTC)
// AI Timeline prediction based on Rehab level and Seller Motivation
export const estimateTimeToClose = (rehabLevel, sellerMotivationIndex) => {
    // Base days to close a standard assignment
    let baseDays = 14;

    // Rehab penalty (heavier rehabs scare off amateur buyers, taking longer to assign)
    if (rehabLevel === "Moderate to Full Gut") baseDays += 10;
    if (rehabLevel === "Land/Tear Down") baseDays += 15;

    // Motivation Acceleration (Highly motivated sellers sign docs instantly)
    // SMI is 1-5. 5 is extremely motivated.
    const smiMultiplier = parseFloat(sellerMotivationIndex) || 3;

    if (smiMultiplier >= 4) baseDays -= 5; // Highly motivated, title clears faster
    if (smiMultiplier <= 2) baseDays += 7; // Unmotivated, drags feet on paperwork

    return Math.max(3, baseDays); // Absolute minimum physically possible to close is 3 days
};

// 4. Deal Probability Score (DPS) 0-100
// Heuristic weighting matrix for closing likelihood
export const calculateDealProbability = (equityPercent, smi, bdiMatches) => {
    let score = 30; // Base baseline

    // Equity is King (up to +40 points)
    // If they have 50% equity, they get 40 points. If 10% equity, they get 8 points.
    const equityVal = parseFloat(equityPercent) || 0;
    score += Math.min(40, (equityVal / 50) * 40);

    // Motivation (up to +20 points)
    const motivationVal = parseFloat(smi) || 3;
    score += (motivationVal / 5) * 20;

    // Buyer Demand (up to +20 points)
    // If we have 4 buyers lined up immediately, max points.
    score += Math.min(20, (bdiMatches / 4) * 20);

    // Cap at 99% (nothing is 100% in real estate)
    return Math.floor(Math.min(99, score));
};
