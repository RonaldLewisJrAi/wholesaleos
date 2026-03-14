import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
);

export async function runRadarScan(state: string) {
    console.log(`[RadarEngine] Initiating Foreclosure Scan Sequence for ${state}...`);

    try {
        // MOCK/STUB: In production, this executes the Playwright target scripts
        // and routes HTML to Gemini for parsing. Here we generate valid test data:
        const mockDocuments = [
            {
                address: `${Math.floor(Math.random() * 9999)} Maple Street`,
                city: "Capital City",
                state: state,
                county: "District",
                notice_type: "NOTICE OF SUBSTITUTE TRUSTEE'S SALE",
                auction_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
                default_amount: 142500,
                estimated_arv: 250000,
                radar_score: Math.floor(Math.random() * 50) + 50,
                source_url: "https://example.com/notices"
            },
            {
                address: `${Math.floor(Math.random() * 9999)} Oak Avenue`,
                city: "Rivertown",
                state: state,
                county: "Shelby",
                notice_type: "NOTICE OF DEFAULT",
                auction_date: new Date(Date.now() + 86400000 * 45).toISOString().split('T')[0],
                default_amount: 280000,
                estimated_arv: 350000,
                radar_score: Math.floor(Math.random() * 50) + 50,
                source_url: "https://example.com/notices"
            }
        ];

        let inserted = 0;
        for (const doc of mockDocuments) {
            const { error } = await supabase.from('radar_opportunities').insert({
                address: doc.address,
                city: doc.city,
                state: doc.state,
                county: doc.county,
                auction_date: doc.auction_date,
                source_url: doc.source_url,
                estimated_arv: doc.estimated_arv,
                distress_type: doc.notice_type,
                radar_score: doc.radar_score
            });

            if (error) {
                console.error(`[RadarEngine] Failed to insert ${doc.address}:`, error.message);
            } else {
                inserted++;
            }
        }

        console.log(`[RadarEngine] Successfully completed scan for ${state}. Inserted ${inserted} deals.`);
    } catch (e: any) {
        console.error(`[RadarEngine] Fatal execution error during scan for ${state}:`, e.message);
        throw e;
    }
}
