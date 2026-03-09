import { supabase } from '../lib/supabase';

export const databaseService = {
    async getDeals() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('deals').select('*');
        if (error) {
            console.error('Error fetching deals grid:', error);
            throw error;
        }
        return data || [];
    },

    async setPropertyVerified(dealId: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('deals')
            .update({
                property_verified: true,
                property_verified_at: new Date().toISOString()
            })
            .eq('id', dealId)
            .select()
            .single();

        if (error) {
            console.error('Error verifying property:', error);
            throw error;
        }
        return data;
    },

    async setEscrowPaid(dealId: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('deals')
            .update({
                escrow_paid: true,
                escrow_paid_at: new Date().toISOString()
            })
            .eq('id', dealId)
            .select()
            .single();

        if (error) {
            console.error('Error setting escrow paid:', error);
            throw error;
        }
        return data;
    },

    async setTitleVerified(dealId: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('deals')
            .update({
                title_verified: true,
                title_verified_at: new Date().toISOString()
            })
            .eq('id', dealId)
            .select()
            .single();

        if (error) {
            console.error('Error verifying title:', error);
            throw error;
        }
        return data;
    }
};
