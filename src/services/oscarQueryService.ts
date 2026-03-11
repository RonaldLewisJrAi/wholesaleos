import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '../lib/supabase';
import { OSCARIntent } from './oscarIntentParser';
import { calculateDealScore } from './dealIntelligenceEngine';

// @ts-ignore
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const EXTRACTOR_PROMPT = `
You are the OSCAR Query Translator for WholesaleOS.
Your job is to read a natural language query and convert it into a structured JSON filter object for querying a Supabase database of real estate deals and investor activity.

Only output valid JSON with this exact structure (all fields are optional, only include them if the user explicitly mentions them):
{
  "state": "string (optional, 2 letter state code if present)",
  "city": "string (optional, matched city if present)",
  "max_price": "number (optional, top limit of purchase price or ARV if they say 'under X')",
  "min_score": "number (optional, minimum deal score 'above X')",
  "escrow_status": "string (optional, 'cleared', 'pending', etc. if they ask for escrow confirmed)",
  "title_status": "string (optional)",
  "investor_query": "boolean (optional, true if asking about investor rankings or closings)"
}

Example 1: "Show deals in Dallas under 200k"
{"city": "Dallas", "max_price": 200000}

Example 2: "Which deals have escrow confirmed"
{"escrow_status": "cleared"}

Example 3: "Show deals above score 85 in Texas"
{"state": "TX", "min_score": 85}

Example 4: "Which investors closed the most deals this month"
{"investor_query": true}

Output ONLY the JSON object, nothing else.
`;

export async function handleOSCARQuery(intent: OSCARIntent, rawQuery: string) {
    if (!genAI || !supabase) {
        return { success: false, message: "Data Terminal offline. Database or AI capabilities missing.", data: [] };
    }

    try {
        console.log(`[OSCAR Query Service] Intercepted Query Intent: ${intent} | "${rawQuery}"`);

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(`${EXTRACTOR_PROMPT}\n\nQuery: "${rawQuery}"`);
        const responseText = result.response.text();
        const filters = JSON.parse(responseText);

        console.log("[OSCAR Query Service] Extracted API Filters:", filters);

        // -- INVESTOR ACTIVITY QUERIES
        if (filters.investor_query) {
            // For Phase 24 investor activity mock logic
            return {
                success: true,
                message: `Top Investors this month: AlphaCap (12 closed), Beta Funding (8 closed).`,
                data: [], // Returning empty for now as feed expects Deals
            };
        }

        // -- DEAL SEARCH QUERIES
        let query = supabase.from('properties').select('*');

        if (filters.state) {
            query = query.ilike('state', `%${filters.state}%`);
        }
        if (filters.city) {
            query = query.ilike('city', `%${filters.city}%`);
        }
        if (filters.escrow_status) {
            query = query.eq('escrow_status', filters.escrow_status);
        }
        if (filters.title_status) {
            query = query.eq('title_status', filters.title_status);
        }

        const { data, error } = await query;
        if (error) throw error;

        let filteredData = data || [];

        // Apply post-database filtering for complex calculated fields
        if (filters.max_price) {
            filteredData = filteredData.filter(deal => {
                const arvNum = typeof deal.arv === 'number' ? deal.arv : parseInt(String(deal.arv || '').replace(/[^0-9]/g, '')) || 0;
                return arvNum <= filters.max_price;
            });
        }

        if (filters.min_score) {
            filteredData = filteredData.filter(deal => {
                // Determine score. If database score column exists, use it, else calculate.
                const score = deal.score || calculateDealScore({
                    arv: deal.arv || 250000,
                    repairs: deal.rehab || deal.repairs || 35000,
                    purchase_price: typeof deal.arv === 'number' ? deal.arv * 0.7 : 175000,
                    buyerDemand: 7,
                    repairConfidence: deal.poc_verified ? 90 : 50,
                    riskScore: 50,
                    titleVerified: deal.title_status === 'cleared'
                });
                return score >= filters.min_score;
            });
        }

        const msg = filteredData.length > 0
            ? `Query complete. Found ${filteredData.length} records matching your criteria.`
            : `I could not find any active data matching your query criteria.`;

        return {
            success: true,
            message: msg,
            data: filteredData,
            navigationTarget: `/match-feed?queryId=${Date.now()}` // Trigger navigation to feed
        };

    } catch (e) {
        console.error("OSCAR Query Error:", e);
        return {
            success: false,
            message: "Query execution failed due to an error.",
            data: []
        };
    }
}
