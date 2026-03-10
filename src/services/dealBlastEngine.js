import { supabase } from '../lib/supabase';
import { distributionService } from './distributionService';

export const dealBlastEngine = {
    /**
     * Pushes a deal beyond standard matchmaking by injecting High Trust
     * and Recently Active investors into the distribution array.
     */
    async executePriorityBlast(deal, wholesalerId) {
        if (!deal || !deal.id) return { success: false, error: 'Invalid Deal Payload' };

        console.log('[BLAST ENGINE] 🔥 Initiating Priority Sequence for:', deal.address);

        try {
            // 1. Verify Wholesaler Quota
            const canBlast = await this._verifyDailyQuota(wholesalerId);
            if (!canBlast) {
                return { success: false, error: 'Daily Limit Reached: Maximum 3 Priority Blasts per 24 hours.' };
            }

            // 2. Fetch Base Matched Investors (Standard Distribution)
            const baseMatchesResult = await distributionService.distributeDeal(deal, wholesalerId, true); // true = silent, don't execute dispatch yet
            const baseInvestorsArray = baseMatchesResult?.success ? baseMatchesResult.matches : [];
            console.log(`[BLAST ENGINE] Phase 1: Found ${baseInvestorsArray.length} base criteria matches.`);

            // 3. Fetch High Trust Investors
            const highTrustInvestors = await this._fetchHighTrustInvestors();
            console.log(`[BLAST ENGINE] Phase 2: Found ${highTrustInvestors.length} High-Trust Elite Investors.`);

            // 4. Fetch Recently Active Investors (7 Day Rolling Window)
            const recentActiveInvestors = await this._fetchRecentActiveInvestors();
            console.log(`[BLAST ENGINE] Phase 3: Found ${recentActiveInvestors.length} Recently Engaged Investors.`);

            // 5. Merge and Deduplicate Lists
            // Construct a single unified Map to deduplicate based on `user_id`
            const mergedMap = new Map();

            const processArray = (arr, label) => {
                arr.forEach(investor => {
                    const uid = investor.user_id || investor.id; // handle struct variations
                    if (!mergedMap.has(uid)) {
                        mergedMap.set(uid, {
                            ...investor,
                            user_id: uid,
                            sourceTracker: [label]
                        });
                    } else {
                        mergedMap.get(uid).sourceTracker.push(label);
                    }
                });
            };

            processArray(baseInvestorsArray, 'MATCHED_CRITERIA');
            processArray(highTrustInvestors, 'HIGH_TRUST_SCORE');
            processArray(recentActiveInvestors, 'RECENT_UX_ACTIVITY');

            const finalBlastList = Array.from(mergedMap.values());
            console.log(`🔥 [BLAST ENGINE] Deduped Result: Broadcasting to ${finalBlastList.length} Unique Investors.`);

            // 6. Execute Massive Dispatch
            for (const investor of finalBlastList) {
                // Reuse phase 19 logic
                distributionService._mockNotificationDispatch(deal, { profiles: investor });
            }

            // 7. Track the Action
            await supabase.from('platform_events').insert([{
                event_type: 'DEAL_BLAST_SENT',
                deal_id: deal.id,
                user_id: wholesalerId,
                metadata: {
                    total_investors_reached: finalBlastList.length,
                    breakdowns: finalBlastList.map(i => i.sourceTracker)
                }
            }]);

            return { success: true, count: finalBlastList.length };

        } catch (err) {
            console.error('[BLAST ENGINE] Fatal Execution Error:', err);
            return { success: false, error: err.message };
        }
    },

    async _verifyDailyQuota(wholesalerId) {
        if (!supabase) return true; // mock allow
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('platform_events')
            .select('id')
            .eq('event_type', 'DEAL_BLAST_SENT')
            .eq('user_id', wholesalerId)
            .gte('created_at', twentyFourHoursAgo);

        if (error) console.error("Quota Check Error", error);
        return (data || []).length < 3;
    },

    async _fetchHighTrustInvestors() {
        if (!supabase) return [];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            // MVP logic targeting role
            // Need to explicitly pull investors. Assuming trust_score column exists via earlier phase
            .gte('trust_score', 80)
            .limit(200);

        return profiles || [];
    },

    async _fetchRecentActiveInvestors() {
        if (!supabase) return [];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: activities } = await supabase
            .from('investor_activity')
            .select('investor_id')
            .gte('created_at', sevenDaysAgo)
            .order('created_at', { ascending: false })
            .limit(200);

        // Filter distinct UUIDs mapped back to generic objects tracking profiles
        const distinctIds = [...new Set((activities || []).map(a => a.investor_id))];

        // Simulate mapping them directly back into flat array
        return distinctIds.map(id => ({ user_id: id }));
    }
};
