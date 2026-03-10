import { supabase } from '../lib/supabase';

export const distributionService = {
    /**
     * Run the Deal Matching Engine against a newly published deal.
     * Finds all investors whose targeting parameters match the property context.
     */
    async distributeDeal(deal, wholesalerId, silent = false) {
        console.log('[DISTRIBUTION ENGINE] Running Matching Algorithm for Deal:', deal.address);

        try {
            if (!supabase) return { success: false, error: 'No database connection' };

            // 1. Fetch all active investor preferences
            const { data: preferences, error: prefError } = await supabase
                .from('investor_preferences')
                .select('*, profiles(email, full_name)');

            if (prefError) throw prefError;

            // 2. Local matching logic (Supabase PostgREST array intersects can be complex, doing it locally for PoC)
            const matchedInvestors = preferences.filter(pref => {
                // Location Match (Strict)
                const stateMatch = pref.states.length === 0 || pref.states.includes(deal.state);
                const cityMatch = pref.cities.length === 0 || pref.cities.includes(deal.city);

                if (!stateMatch || !cityMatch) return false;

                // Financial Threshold Match (Bounded)
                const minArvMatch = !pref.min_arv || deal.arv >= pref.min_arv;
                const maxArvMatch = !pref.max_arv || deal.arv <= pref.max_arv;
                const maxRehabMatch = !pref.max_rehab || deal.estimated_repair_cost <= pref.max_rehab;

                if (!minArvMatch || !maxArvMatch || !maxRehabMatch) return false;

                // Note: Strategy matching omitted in PoC as Deal object lacks an explicit strategy field,
                // but could easily check pref.strategy.includes(deal.strategy_type).

                return true;
            });

            console.log(`[DISTRIBUTION ENGINE] Found ${matchedInvestors.length} matched investors.`);

            if (silent) {
                return { success: true, count: matchedInvestors.length, matches: matchedInvestors };
            }

            // 3. Dispatch Notifications & Log Events
            for (const investor of matchedInvestors) {
                // Simulate sending outbound Email/SMS
                this._mockNotificationDispatch(deal, investor);

                // Record the exact distribution on the platform ledger
                await supabase.from('platform_events').insert([{
                    event_type: 'DEAL_DISTRIBUTED',
                    user_id: investor.user_id,
                    deal_id: deal.id,
                    metadata: {
                        matched_arv: deal.arv,
                        deal_score: deal.score,
                        wholesaler_id: wholesalerId
                    }
                }]);
            }

            return { success: true, count: matchedInvestors.length, matches: matchedInvestors };
        } catch (err) {
            console.error('[DISTRIBUTION ENGINE] Fatal Match Error:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Developer Mock Output to simulate standard SMS / SMTP gateway requests
     */
    _mockNotificationDispatch(deal, investorProfile) {
        const emailObj = {
            to: investorProfile.profiles?.email || 'investor@example.com',
            subject: `New Deal Available in ${deal.city}, ${deal.state} `,
            body: `ARV: $${deal.arv?.toLocaleString()} | Assignment Fee: $${deal.assignment_fee?.toLocaleString()} | Deal Score: ${deal.score} `
        };

        const smsObj = {
            to: '***-***-****',
            message: `WholesaleOS Alert: \nNew ${deal.city} deal\nARV ${deal.arv / 1000} k\nScore ${deal.score} \nClick to view`
        };

        console.group(`[OUTBOUND NOTIFICATION] ➔ ${investorProfile.profiles?.full_name || 'Matched Investor'} `);
        console.log('📧 EMAILED:', emailObj);
        console.log('📱 SMS SENT:', smsObj);
        console.groupEnd();
    },

    /**
     * Log an explicit view event to track Investor engagement depth
     */
    async logDealViewed(dealId, investorId) {
        if (!supabase || !investorId) return;
        try {
            await supabase.from('platform_events').insert([{
                event_type: 'DEAL_VIEWED',
                user_id: investorId,
                deal_id: dealId,
                metadata: { timestamp: new Date().toISOString() }
            }]);
        } catch (e) {
            console.warn('Non-fatal event metric failure', e);
        }
    }
};
