import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load Node module logic
const { runSkipTrace } = require('../services/skipTraceEngine.cjs');
const { skipTraceLogger } = require('../logging/logger.cjs');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
});

const skipTraceWorker = new Worker(
    'skipTraceQueue',
    async (job) => {
        const { userId, propertyId, ownerName, address, city, state, zip } = job.data;

        skipTraceLogger.info(`[WORKER] Initiating async Skip Trace for property: ${propertyId}`, { userId, ownerName });

        try {
            // Mark property as processing
            await supabaseAdmin.from('properties').update({ skiptrace_status: 'processing' }).eq('id', propertyId);

            // Run entire OSINT waterfall engine natively on persistent Node server (No 10s/60s Vercel timeouts!)
            const results = await runSkipTrace({ ownerName, address, city, state, zip });

            if (!results.phones || (results.phones.length === 0 && results.emails.length === 0)) {
                skipTraceLogger.warn(`[WORKER] No contacts found for property: ${propertyId}`);

                // Mark property as failed / empty
                await supabaseAdmin.from('properties').update({
                    skiptrace_status: 'failed',
                    owner_skip_traced_at: new Date().toISOString()
                }).eq('id', propertyId);
                return;
            }

            const phoneNumber = results.phones.map(p => p.number).join(', ');
            const emailAddress = results.emails.map(e => e.email).join(', ');
            const confidence = results.confidenceAverage || 0;
            const source = results.provider || 'unknown';

            // 1. Save Contacts
            const { error: insertError } = await supabaseAdmin
                .from('owner_contacts')
                .insert({
                    property_id: propertyId,
                    owner_name: ownerName || 'Unknown Owner',
                    phone_number: phoneNumber,
                    email: emailAddress,
                    confidence_score: confidence,
                    source: source
                });

            if (insertError) throw new Error(`Contact Insert Error: ${insertError.message}`);

            // 2. Mark Property as Completed
            await supabaseAdmin.from('properties').update({
                skiptrace_status: 'complete',
                owner_skip_traced_at: new Date().toISOString()
            }).eq('id', propertyId);

            // 3. Log the Background Success
            await supabaseAdmin.from('platform_events').insert({
                user_id: userId,
                event_type: 'OWNER_SKIP_TRACED_ASYNC',
                metadata: {
                    property_id: propertyId,
                    provider_used: source,
                    contacts_found: results.phones.length + results.emails.length,
                    confidence_average: confidence
                }
            });

            skipTraceLogger.info(`[WORKER] Skip Trace Complete pipeline for: ${propertyId}`);

        } catch (err) {
            skipTraceLogger.error(`[WORKER] Critical failure resolving job ${job.id}`, { err: err.message });
            await supabaseAdmin.from('properties').update({
                skiptrace_status: 'failed',
                owner_skip_traced_at: new Date().toISOString()
            }).eq('id', propertyId);
            throw err;
        }
    },
    { connection }
);

skipTraceWorker.on('failed', (job, err) => {
    skipTraceLogger.error(`[WORKER] Job ${job?.id} hard failed:`, err);
});

console.log('👷 Skip Trace Request Worker initialized and waiting for jobs...');
export default skipTraceWorker;
