import { Worker } from 'bullmq';
import { connection } from './redisClient.js';
import { supabase } from '../lib/supabase.js';

export const distributionWorker = new Worker('deal-distribution', async job => {
    const { deal, wholesalerId } = job.data;
    console.log(`[WORKER] Processing Deal Distribution ID: ${deal.id}`);

    try {
        if (!supabase) throw new Error("No database connection");

        // 1. Fetch all active investor preferences
        const { data: preferences, error: prefError } = await supabase
            .from('investor_preferences')
            .select('*, profiles(email, full_name)');

        if (prefError) throw prefError;

        // 2. Compute Matches
        const matchedInvestors = preferences.filter(pref => {
            const stateMatch = pref.states.length === 0 || pref.states.includes(deal.state);
            const cityMatch = pref.cities.length === 0 || pref.cities.includes(deal.city);
            if (!stateMatch || !cityMatch) return false;

            const minArvMatch = !pref.min_arv || deal.arv >= pref.min_arv;
            const maxArvMatch = !pref.max_arv || deal.arv <= pref.max_arv;
            const maxRehabMatch = !pref.max_rehab || deal.estimated_repair_cost <= pref.max_rehab;

            return minArvMatch && maxArvMatch && maxRehabMatch;
        });

        console.log(`[WORKER] Found ${matchedInvestors.length} matched investors.`);

        // 3. Dispatch Notifications
        for (const investor of matchedInvestors) {
            // Simulator Output
            const emailObj = {
                to: investor.profiles?.email || 'investor@example.com',
                subject: `New Deal Available in ${deal.city}, ${deal.state}`,
                body: `ARV: $${deal.arv?.toLocaleString()} | Score: ${deal.score}`
            };

            console.group(`[WORKER NOTIFICATION] ➔ ${investor.profiles?.full_name || 'Matched Investor'}`);
            console.log('📧 EMAILED:', emailObj);
            console.groupEnd();

            await supabase.from('platform_events').insert([{
                event_type: 'DEAL_DISTRIBUTED',
                user_id: investor.user_id,
                deal_id: deal.id,
                metadata: { matched_arv: deal.arv, deal_score: deal.score, wholesaler_id: wholesalerId }
            }]);
        }

        return { success: true, count: matchedInvestors.length };
    } catch (err) {
        console.error('[WORKER] Fatal error processing distribution:', err);
        throw err;
    }
}, { connection });

distributionWorker.on('completed', job => {
    console.log(`[WORKER] Completed job ${job.id}`);
});

distributionWorker.on('failed', (job, err) => {
    console.error(`[WORKER] Failed job ${job?.id} with ${err.message}`);
});
