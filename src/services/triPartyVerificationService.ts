import { supabase } from '../lib/supabase';

export interface VerificationCode {
    role: string;
    code: string;
    expires_at: string;
}

export const triPartyVerificationService = {
    // Generate a 6-digit random code
    generateCode: () => Math.floor(100000 + Math.random() * 900000).toString(),

    // Initiate verification session (called by Title Company when marking deal ready to close)
    initiateClosingVerification: async (dealId: string, titleCompanyId: string) => {
        try {
            if (!supabase) throw new Error("Supabase client not initialized.");

            // Check if one already exists
            const { data: existing } = await supabase
                .from('deal_verifications')
                .select('id')
                .eq('deal_id', dealId)
                .single();

            if (existing) throw new Error("Verification session already exists for this deal.");

            // Create verification session
            const { data: session, error: sessionErr } = await supabase
                .from('deal_verifications')
                .insert({
                    deal_id: dealId,
                    title_company_id: titleCompanyId,
                    wholesaler_status: 'PENDING',
                    investor_status: 'PENDING',
                    title_status: 'PENDING',
                    overall_status: 'PENDING'
                })
                .select('*')
                .single();

            if (sessionErr) throw sessionErr;

            // Generate 3 codes
            const expiration = new Date();
            expiration.setHours(expiration.getHours() + 72);

            const codes = [
                { role: 'WHOLESALER', code: triPartyVerificationService.generateCode() },
                { role: 'INVESTOR', code: triPartyVerificationService.generateCode() },
                { role: 'TITLE_COMPANY', code: triPartyVerificationService.generateCode() }
            ];

            // In a real system, we'd hash the codes. For MVP, we'll store them directly but use RLS to protect them.
            const codeInserts = codes.map(c => ({
                deal_verification_id: session.id,
                target_role: c.role,
                hashed_code: c.code, // In production: await bcrypt.hash(c.code, 10)
                expires_at: expiration.toISOString(),
                status: 'UNUSED'
            }));

            const { error: codeErr } = await supabase
                .from('verification_codes')
                .insert(codeInserts);

            if (codeErr) throw codeErr;

            return { success: true, session, codes }; // Returning codes so they can be sent via email/SMS mocked service
        } catch (error) {
            console.error("Initiate Verification Error:", error);
            return { success: false, error };
        }
    },

    // Fetch the verification session status for a deal
    getVerificationSession: async (dealId: string) => {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('deal_verifications')
            .select(`
                *,
                verification_codes ( target_role, status, expires_at )
            `)
            .eq('deal_id', dealId)
            .single();

        if (error) return null;
        return data;
    },

    // Submit a verification code
    submitVerificationCode: async (dealId: string, role: string, code: string) => {
        try {
            if (!supabase) throw new Error("Supabase client not initialized.");
            // 1. Get Session
            const { data: session, error: getErr } = await supabase
                .from('deal_verifications')
                .select('id, wholesaler_status, investor_status, title_status')
                .eq('deal_id', dealId)
                .single();

            if (getErr || !session) throw new Error("No active verification session found.");

            // 2. Validate Code (Checking against the unhashed version for now)
            const { data: validCode, error: codeErr } = await supabase
                .from('verification_codes')
                .select('id')
                .eq('deal_verification_id', session.id)
                .eq('target_role', role)
                .eq('hashed_code', code) // Plaintext comparison for MVP
                .eq('status', 'UNUSED')
                .single();

            if (codeErr || !validCode) throw new Error("Invalid or expired code.");

            // 3. Mark Code Used
            await supabase
                .from('verification_codes')
                .update({ status: 'USED', used_at: new Date().toISOString() })
                .eq('id', validCode.id);

            // 4. Update Session Status
            let updates: any = {};
            if (role === 'WHOLESALER') updates.wholesaler_status = 'VERIFIED';
            if (role === 'INVESTOR') updates.investor_status = 'VERIFIED';
            if (role === 'TITLE_COMPANY') updates.title_status = 'VERIFIED';

            // Check if all are verified
            const isAllVerified =
                (role === 'WHOLESALER' ? 'VERIFIED' : session.wholesaler_status) === 'VERIFIED' &&
                (role === 'INVESTOR' ? 'VERIFIED' : session.investor_status) === 'VERIFIED' &&
                (role === 'TITLE_COMPANY' ? 'VERIFIED' : session.title_status) === 'VERIFIED';

            if (isAllVerified) {
                updates.overall_status = 'VERIFIED_CLOSED';
            }

            const { error: updateErr } = await supabase
                .from('deal_verifications')
                .update(updates)
                .eq('id', session.id);

            if (updateErr) throw updateErr;

            // 5. If fully verified, update the main deals table and emit platform event
            if (isAllVerified) {
                await supabase.from('deals').update({ status: 'VERIFIED_CLOSED' }).eq('id', dealId);

                await supabase.from('platform_events').insert({
                    event_type: 'VERIFIED_CLOSED',
                    deal_id: dealId,
                    metadata: { message: "Tri-Party Verification Complete. Deal Officially Closed." }
                });
            }

            return { success: true, isAllVerified };

        } catch (error: any) {
            console.error("Verification Submission Error:", error);
            return { success: false, error: error.message };
        }
    }
};
