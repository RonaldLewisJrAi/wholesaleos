import { foreclosureSources } from './config';
import { scanAndCollectDocuments } from './sourceScanner';
import { processDocumentWithGemini } from './ocrProcessor';
import { generateDealScore } from './leadScorer';

/**
 * Orchestrates the Deal Radar intelligence gathering pipeline.
 */
export async function runForeclosureScanCycle() {
    console.log('[DealRadar Agent] Starting Foreclosure Scan Cycle...');
    const results = [];

    for (const source of foreclosureSources) {
        if (!source.active) continue;
        console.log(`[DealRadar Agent] Scanning source: ${source.name}`);

        try {
            // 1. Playwright Collects Documents
            const documents = await scanAndCollectDocuments(source);

            for (const doc of documents) {
                // 2. Gemini performs OCR & JSON Parsing in single shot
                const parsedLead = await processDocumentWithGemini(doc);

                if (parsedLead) {
                    // 3. Score Lead
                    const score = generateDealScore(parsedLead);
                    parsedLead.deal_score = score;
                    results.push(parsedLead);
                }
            }
        } catch (error) {
            console.error(`[DealRadar Agent] Error processing source ${source.name}:`, error);
        }
    }

    console.log(`[DealRadar Agent] Scan Complete. Discovered ${results.length} valid foreclosure leads.`);
    return results;
}
