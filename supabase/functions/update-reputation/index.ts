// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// ==============================================================================
// EDGE FUNCTION: UPDATE REPUTATION
// Description: Triggered asynchronously when a Title Company verifies a closing.
// ==============================================================================

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    const dealId = payload.deal_id;
    const titleCompanyId = payload.title_company_id;

    if (!dealId) {
      return new Response(JSON.stringify({ error: "Missing deal_id" }), { status: 400 });
    }

    console.log(`[Reputation Engine] Processing Closing Verification for Deal: ${dealId}`);

    // 1. Identify the investor who successfully closed this deal
    // We look for the transacting party where payment succeeded and the deal matches
    const { data: transaction, error: txError } = await supabase
      .from('deal_transactions')
      .select('investor_id')
      .eq('deal_id', dealId)
      // Optionally enforce status: .eq('payment_status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (txError || !transaction?.investor_id) {
      console.error(`Could not locate investor transaction for Deal ${dealId}`);
      return new Response(JSON.stringify({ error: "No matching investor transaction found." }), { status: 404 });
    }

    const investorId = transaction.investor_id;

    // 2. Compute the score
    // Base closing gives +10 Trust Score points.
    const trustScoreBoost = 10;

    // Let's call RPC to safely increment counters or use a generic update if not concurrent.
    // For reliability without RPC, we first fetch, then update, but RPC is better.
    // Doing standard fetch/update here for simplicity:
    const { data: profile, error: profError } = await supabase
      .from('investor_profiles')
      .select('deals_closed, trust_score')
      .eq('id', investorId)
      .single();

    if (profError || !profile) throw new Error("Could not find investor profile.");

    const updates = {
      deals_closed: (profile.deals_closed || 0) + 1,
      trust_score: (profile.trust_score || 50) + trustScoreBoost
    };

    // If a valid registered Title Company verified it, optionally grant title_verified status
    if (titleCompanyId) {
      updates['title_verified'] = true;
    }

    const { error: updateError } = await supabase
      .from('investor_profiles')
      .update(updates)
      .eq('id', investorId);

    if (updateError) throw updateError;

    console.log(`[Reputation Engine] Investor ${investorId} reputation updated. New Score: ${updates.trust_score}`);

    return new Response(JSON.stringify({
      message: "Reputation updated successfully",
      investor_id: investorId
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Reputation Engine Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
