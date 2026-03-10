import { supabase } from '../lib/supabase';

export const titleService = {
    /**
     * Looks up a deal by its secure closing code
     */
    async verifyClosingCode(code) {
        try {
            if (!supabase) return { success: false, error: 'No database connection' };

            // 1. Check if the code exists and is active
            const { data: codeData, error: codeError } = await supabase
                .from('closing_codes')
                .select('*, deals(*)')
                .eq('code', code)
                .eq('status', 'ACTIVE')
                .single();

            if (codeError || !codeData) {
                // Fallback for mock environment if no actual code exists but we want to simulate
                if (code === 'TEST-CLOSING-CODE') {
                    return {
                        success: true,
                        deal: { id: 'mock-deal-id', address: '123 Verified St', escrow_status: 'PENDING', title_status: 'PENDING', status: 'Locked' },
                        codeId: 'mock-code-id'
                    }
                }
                return { success: false, error: 'Invalid or expired closing code.' };
            }

            return { success: true, deal: codeData.deals, codeId: codeData.id };
        } catch (err) {
            console.error('Error verifying closing code:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Title Officer records Escrow as confirmed
     */
    async confirmEscrow(dealId, officerId) {
        try {
            if (!supabase) return { success: true }; // Mock success

            // 1. Update deal status
            const { error: updateError } = await supabase
                .from('deals')
                .update({ escrow_status: 'CONFIRMED' })
                .eq('id', dealId);

            if (updateError) throw updateError;

            // 2. Log platform event
            await supabase.from('platform_events').insert([{
                event_type: 'ESCROW_CONFIRMED',
                user_id: officerId,
                deal_id: dealId,
                metadata: { timestamp: new Date().toISOString() }
            }]);

            return { success: true };
        } catch (err) {
            console.error('Error confirming escrow:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Title Officer verifies Clear Title
     */
    async verifyTitle(dealId, officerId) {
        try {
            if (!supabase) return { success: true };

            // 1. Update deal status
            const { error: updateError } = await supabase
                .from('deals')
                .update({ title_status: 'CLEAR' })
                .eq('id', dealId);

            if (updateError) throw updateError;

            // 2. Log platform event
            await supabase.from('platform_events').insert([{
                event_type: 'TITLE_VERIFIED',
                user_id: officerId,
                deal_id: dealId,
                metadata: { timestamp: new Date().toISOString() }
            }]);

            return { success: true };
        } catch (err) {
            console.error('Error verifying title:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Title Officer marks deal as officially Closed
     */
    async closeDeal(dealId, codeId, officerId) {
        try {
            if (!supabase) return { success: true }; // Mock success

            // 1. Update deal to CLOSED
            const { error: updateError } = await supabase
                .from('deals')
                .update({ status: 'Closed' })
                .eq('id', dealId);

            if (updateError) throw updateError;

            // 2. Mark code as USED
            if (codeId !== 'mock-code-id') {
                await supabase
                    .from('closing_codes')
                    .update({ status: 'USED' })
                    .eq('id', codeId);
            }

            // 3. Log platform event
            await supabase.from('platform_events').insert([{
                event_type: 'DEAL_CLOSED',
                user_id: officerId,
                deal_id: dealId,
                metadata: { timestamp: new Date().toISOString() }
            }]);

            return { success: true };
        } catch (err) {
            console.error('Error closing deal:', err);
            return { success: false, error: err.message };
        }
    }
};
