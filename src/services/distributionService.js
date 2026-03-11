import { supabase } from '../lib/supabase';

export const distributionService = {
    /**
     * Run the Deal Matching Engine against a newly published deal.
     * Enqueues the deal object into a BullMQ background worker to handle large-scale matchmaking.
     */
    async distributeDeal(deal, wholesalerId) {
        console.log('[DISTRIBUTION ENGINE] Enqueuing Deal for Background Matchmaking:', deal.address);

        try {
            if (!supabase) return { success: false, error: 'No database connection' };

            // Transition from synchronous loops to scalable background architecture (Phase 30)
            // Call the local Next.js / Vercel Serverless Function to dispatch the deal 
            // without locking the UI or crashing Vite's browser bundler.
            const HOST = window.location.origin;
            const res = await fetch(`${HOST}/api/v1/distribution`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deal, wholesalerId })
            });

            if (!res.ok) throw new Error("Matchmaking backend dispatch failed");

            console.log(`[DISTRIBUTION ENGINE] Successfully pushed to Background Queue`);

            // Returns mock match representation so the frontend Alert works seamlessly
            return { success: true, count: 'pending', matches: Array(1).fill('In Queue') };
        } catch (err) {
            console.error('[DISTRIBUTION ENGINE] Fatal Queue Error:', err);
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
