import { foreclosureSources } from './config';
import { scanAndCollectDocuments } from './sourceScanner';
import { processDocumentWithGemini } from './ocrProcessor';
import { generateDealScore } from './leadScorer';
import { supabase } from '../../lib/supabase';

// Generate a source hash safely
function generateHash(address: string, date: string, county: string) {
    const raw = `${address}-${date}-${county}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i);
        hash |= 0;
    }
    return `hash_${Math.abs(hash)}`;
}

let currentStateIndex = 0;

/**
 * Orchestrates the Deal Radar intelligence gathering pipeline.
 */
export async function runForeclosureScanCycle() {
    console.log('[DealRadar Agent] Starting Hourly Foreclosure Scan Cycle...');
    const results: any[] = [];

    if (foreclosureSources.length === 0) return results;

    // Pick only 1 state progressively (alphabetical order) based on the hourly tick
    const source = foreclosureSources[currentStateIndex];
    if (!source.active) {
        // Auto-skip logic if inactive
        currentStateIndex = (currentStateIndex + 1) % foreclosureSources.length;
        return results;
    }

    console.log(`[DealRadar Agent] Scanning 1 Source (Hourly rotation): ${source.name}`);

    try {
        // 1. Playwright Collects Documents
        const documents = await scanAndCollectDocuments(source);

        // Process up to the 3 most recent availability per instructions
        const docsToProcess = documents.slice(0, 3);

        for (const doc of docsToProcess) {
            // 2. Gemini performs OCR & JSON Parsing in single shot
            const parsedLead: any = await processDocumentWithGemini(doc);

            if (parsedLead) {
                // 3. Deduplication Check via Cooldown Cache
                const sourceHash = generateHash(parsedLead.address || '', parsedLead.auction_date || '', parsedLead.county || '');

                const { data: existingSignal } = await supabase!
                    .from('foreclosure_signals')
                    .select('id')
                    .eq('source_hash', sourceHash)
                    .single();

                if (existingSignal) {
                    console.log(`[DealRadar Agent] Skipping duplicate signal (Hash: ${sourceHash}): ${parsedLead.address}`);
                    continue; // Skip insertion
                }

                // 4. Score Lead
                const score = generateDealScore(parsedLead);
                parsedLead.deal_score = score;

                // 5. Save Signal to Cooldown Cache immediately
                await supabase!.from('foreclosure_signals').insert({
                    source_hash: sourceHash,
                    address: parsedLead.address,
                    city: parsedLead.city,
                    state: source.state,
                    county: parsedLead.county,
                    filing_date: parsedLead.auction_date
                });

                results.push(parsedLead);
            }
        }
    } catch (error) {
        console.error(`[DealRadar Agent] Error processing source ${source.name}:`, error);
    }

    console.log(`[DealRadar Agent] Scan Complete. Discovered ${results.length} valid foreclosure leads in ${source.state}.`);

    // Increment rotation index for the next hour
    currentStateIndex = (currentStateIndex + 1) % foreclosureSources.length;

    return results;
}
