import { supabase } from './supabaseClient';

export interface Referral {
    id: string;
    org_id: string;
    referrer_id: string;
    referred_to_id: string;
    property_id: string;
    referral_status: 'pending' | 'accepted' | 'declined' | 'closed';
    referral_fee_pct: number;
    notes: string;
    target_price: number;
    created_at: string;
    updated_at: string;

    // Joined relations
    property?: any;
    referrer?: any;
    referred_to?: any;
}

/**
 * Creates a new Referral bridging a property to a Realtor
 */
export async function sendReferral(
    propertyId: string,
    referredToId: string,
    feePct: number = 25.0,
    notes: string,
    targetPrice: number
) {
    // Current user context
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    // Tenant context (For RLS)
    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (!profile) throw new Error('Profile resolution failed.');

    const { data, error } = await supabase
        .from('referrals')
        .insert({
            org_id: profile.org_id,
            referrer_id: user.id,
            referred_to_id: referredToId,
            property_id: propertyId,
            referral_fee_pct: feePct,
            notes,
            target_price: targetPrice,
            referral_status: 'pending'
        })
        .select()
        .single();

    if (error) {
        console.error('[ReferralService] sendReferral Error:', error);
        throw error;
    }

    return data;
}

/**
 * Retrieves all outbound referrals sent BY the active user
 */
export async function getOutboundReferrals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('referrals')
        .select(`
            *,
            property:properties(id, address, city, state, zip),
            referred_to:profiles!referrals_referred_to_id_fkey(id, email, first_name, last_name)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[ReferralService] getOutboundReferrals Error:', error);
        return [];
    }

    return data;
}

/**
 * Retrieves all inbound referrals received BY the active user (Realtor view)
 */
export async function getInboundReferrals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('referrals')
        .select(`
            *,
            property:properties(id, address, city, state, zip, beds, baths, sqft, est_value),
            referrer:profiles!referrals_referrer_id_fkey(id, email, first_name, last_name)
        `)
        .eq('referred_to_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[ReferralService] getInboundReferrals Error:', error);
        return [];
    }

    return data;
}

/**
 * Updates the state engine of a referral (accept, decline, etc)
 */
export async function updateReferralStatus(referralId: string, status: 'pending' | 'accepted' | 'declined' | 'closed') {
    const { data, error } = await supabase
        .from('referrals')
        .update({ referral_status: status, updated_at: new Date().toISOString() })
        .eq('id', referralId)
        .select()
        .single();

    if (error) {
        console.error('[ReferralService] updateReferralStatus Error:', error);
        throw error;
    }

    return data;
}
