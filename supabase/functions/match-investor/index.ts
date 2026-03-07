// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// ==============================================================================
// EDGE FUNCTION: REVERSE MATCHMAKING (MATCH INVESTOR)
// Description: Triggered asynchronously when an investor creates or updates
// their buy box. Immediately matches them to all active MARKETPLACE deals.
// ==============================================================================

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    const investorId = payload.investor_id;
    const buyBoxId = payload.buy_box_id;

    if (!investorId || !buyBoxId) {
      return new Response(JSON.stringify({ error: "Missing investor_id or buy_box_id" }), { status: 400 });
    }

    console.log(`[Reverse Matchmaking] Processing Buy Box ${buyBoxId} for Investor ${investorId}`);

    // 1. Fetch the Buy Box criteria
    const { data: buyBox, error: boxError } = await supabase
      .from('investor_buy_boxes')
      .select('*')
      .eq('id', buyBoxId)
      .single();

    if (boxError || !buyBox) throw new Error(`Could not locate Buy Box details for ${buyBoxId}`);

    // Extract Arrays properly
    const markets = buyBox.markets || [];
    const propertyTypes = buyBox.property_types || [];
    const maxPurchasePrice = Number(buyBox.max_purchase_price) || 0;
    const minRoi = Number(buyBox.min_roi) || 0;

    // 2. Query available MARKETPLACE deals safely intersecting the arrays over properties
    let query = supabase.from('deals').select(`
            id,
            contract_price,
            assignment_fee,
            properties!inner(city, state, property_type, rehab_estimate, arv)
        `);

    // Mandatory RLS equivalent bypass filter for the global pipeline
    query = query.eq('visibility_level', 'MARKETPLACE');

    const { data: globalDeals, error: dealsError } = await query;
    if (dealsError) throw dealsError;

    if (!globalDeals || globalDeals.length === 0) {
      return new Response(JSON.stringify({ message: "No active marketplace deals found.", matchCount: 0 }), { status: 200 });
    }

    const matchPayload = [];

    // 3. Iterate over the deals and evaluate match
    for (const deal of globalDeals) {
      const property = deal.properties;
      if (!property || !property.city) continue;

      const marketString = `${property.city}, ${property.state}`;
      const dealPurchasePrice = (Number(deal.contract_price) || 0) + (Number(deal.assignment_fee) || 0);
      const estimatedRehab = Number(property.rehab_estimate) || 0;
      const dealArv = Number(property.arv) || 0;

      // ROI % = ((ARV - (Purchase + Rehab)) / (Purchase + Rehab)) * 100
      const totalInvestment = dealPurchasePrice + estimatedRehab;
      const dealRoi = totalInvestment > 0 ? ((dealArv - totalInvestment) / totalInvestment) * 100 : 0;

      let isMatch = true;

      // Evaluating the inverted conditions inside Deno instead of raw SQL since the deal list is finite (10k deals vs 100k investors).
      // A reverse SQL intersect is mathematically heavy, but JavaScript maps are negligible at 10k items.

      // Market check
      if (markets.length > 0 && !markets.includes(marketString)) isMatch = false;

      // Price Check
      if (maxPurchasePrice > 0 && dealPurchasePrice > maxPurchasePrice) isMatch = false;

      // Property Type Check
      if (propertyTypes.length > 0 && property.property_type && !propertyTypes.includes(property.property_type)) isMatch = false;

      // ROI Check
      if (minRoi > 0 && dealRoi < minRoi) isMatch = false;

      if (isMatch) {
        // Determine a basic match score. (Can be sophisticated later).
        matchPayload.push({
          deal_id: deal.id,
          investor_id: investorId,
          match_score: 100,
          notified: false
        });
      }
    }

    if (matchPayload.length === 0) {
      return new Response(JSON.stringify({ message: "Iterated deals, 0 matched buy box criteria.", matchCount: 0 }), { status: 200 });
    }

    // 4. Bulk Upsert the matched deals
    const { error: insertError } = await supabase
      .from('deal_matches')
      .upsert(matchPayload, { onConflict: "deal_id, investor_id" });

    if (insertError) throw insertError;

    console.log(`[Reverse Matchmaking] Successfully matched Investor ${investorId} to ${matchPayload.length} Deals`);

    return new Response(JSON.stringify({
      message: "Reverse Matchmaking completed successfully",
      matchCount: matchPayload.length
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Reverse Matchmaking Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
});
