import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// ==============================================================================
// WHOLESALE OS - EDGE FUNCTION: DEAL MATCHMAKING ENGINE
// ==============================================================================

serve(async (req) => {
  try {
    // Initialize Supabase Client using Service Role to bypass RLS when querying the whole marketplace
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse incoming Webhook payload
    const payload = await req.json();
    const dealId = payload.deal_id;
    const propertyId = payload.property_id;

    if (!dealId || !propertyId) {
      return new Response(JSON.stringify({ error: "Missing deal_id or property_id" }), { status: 400 });
    }

    console.log(`[Matchmaking Engine] Processing Deal: ${dealId}`);

    // 1. Fetch the actual deal and property metrics needed for matching
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
                contract_price, 
                assignment_fee,
                properties!inner(city, state, property_type, rehab_estimate, arv)
            `)
      .eq('id', dealId)
      .single();

    if (dealError || !deal) throw new Error(`Could not locate deal details for ${dealId}`);

    const property = deal.properties;
    if (!property || !property.city) throw new Error(`Property linked to Deal ${dealId} lacks a valid city attribute.`);

    // Compute Match Variables
    const dealPurchasePrice = (Number(deal.contract_price) || 0) + (Number(deal.assignment_fee) || 0);
    const estimatedRehab = Number(property.rehab_estimate) || 0;
    const dealArv = Number(property.arv) || 0;

    // ROI % = ((ARV - (Purchase + Rehab)) / (Purchase + Rehab)) * 100
    const totalInvestment = dealPurchasePrice + estimatedRehab;
    const dealRoi = totalInvestment > 0 ? ((dealArv - totalInvestment) / totalInvestment) * 100 : 0;

    const marketString = `${property.city}, ${property.state}`;

    console.log(`Evaluation Metrics - Market: ${marketString}, Price: $${dealPurchasePrice}, ROI: ${dealRoi.toFixed(2)}%`);

    // 2. Query Investor Buy Boxes natively in Supabase using JSON arrays & filters!
    // We only pull investors where:
    // - Verified status is active
    // - Market array contains our `marketString`
    // - Max Purchase Price accommodates our deal
    // - Min ROI Expectation is met
    // - Property Type matches
    let query = supabase.from('investor_buy_boxes').select(`
            investor_id,
            investor_profiles!inner(verified_status)
        `);

    // Adding exact match filters (Array overlap handles intersection natively)
    query = query.in('investor_profiles.verified_status', ['verified', 'pending']);
    query = query.gte('max_purchase_price', dealPurchasePrice);
    query = query.lte('min_roi', dealRoi);
    query = query.contains('markets', [marketString]);

    if (property.property_type) {
      query = query.contains('property_types', [property.property_type]);
    }

    const { data: matchedBoxes, error: matchError } = await query;
    if (matchError) throw matchError;

    if (!matchedBoxes || matchedBoxes.length === 0) {
      console.log(`[Matchmaking Engine] 0 Matches found for Deal ${dealId}.`);
      return new Response(JSON.stringify({ message: "No matches found.", matchCount: 0 }), { status: 200 });
    }

    // 3. Prepare Bulk Insert Payload
    const matchPayload = matchedBoxes.map(box => ({
      deal_id: dealId,
      investor_id: box.investor_id,
      match_score: 100, // Extend logic here later to deduct points instead of strict filtering
      notified: false
    }));

    // 4. Bulk Insert into deal_matches (Scaling safely!)
    const { error: insertError } = await supabase
      .from('deal_matches')
      .upsert(matchPayload, { onConflict: "deal_id, investor_id" });

    if (insertError) throw insertError;

    console.log(`[Matchmaking Engine] Successfully bridged ${matchPayload.length} external investors to Deal ${dealId}`);

    return new Response(JSON.stringify({
      message: "Matchmaking completed successfully",
      matchCount: matchPayload.length
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Matchmaking Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
});
