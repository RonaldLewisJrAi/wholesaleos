import { supabase } from '../lib/supabase';

export const investorActivityService = {
    /**
     * Log an explicit investor action to the telemetry table
     * Allowed types: 'DEAL_VIEWED', 'WATCHLIST_ADDED', 'DEAL_RESERVED', 'DEAL_INTERESTED'
     */
    async logActivity(investorId, activityType, additionalMetadata = {}) {
        try {
            if (!supabase || !investorId) return;

            await supabase.from('investor_activity').insert([{
                investor_id: investorId,
                activity_type: activityType,
                metadata: additionalMetadata
            }]);

            console.log(`[ACTIVITY TELEMETRY] Logged ${activityType} for Investor ${investorId}`);
        } catch (e) {
            console.warn('[ACTIVITY TELEMETRY] Non-fatal logging failure:', e);
        }
    },

    /**
     * Helper specifically for the "I'm Interested" Deal Signal
     */
    async signalInterest(dealId, investorId) {
        if (!supabase) return { success: true }; // Mock success

        await this.logActivity(investorId, 'DEAL_INTERESTED', { deal_id: dealId });

        // Also log a global platform event for the Wholesaler's Trust Score computation
        await supabase.from('platform_events').insert([{
            event_type: 'DEAL_INTERESTED',
            user_id: investorId, // Who performed the action
            deal_id: dealId,
            metadata: { timestamp: new Date().toISOString() }
        }]);

        return { success: true };
    }
};
