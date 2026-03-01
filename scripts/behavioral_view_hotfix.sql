CREATE OR REPLACE VIEW public.vw_intelligent_offer_suggestions AS
SELECT l.id AS lead_id,
    l.organization_id,
    l.arv,
    l.estimated_repairs,
    l.mao,
    l.heat_score,
    (
        (l.arv * 0.60) - COALESCE(l.estimated_repairs, 0)
    ) AS conservative_offer,
    (
        (l.arv * 0.75) - COALESCE(l.estimated_repairs, 0)
    ) AS aggressive_offer,
    CASE
        WHEN l.heat_score > 75 THEN 'Highly Competitive: Use Aggressive Offer framing.'
        WHEN l.heat_score > 40 THEN 'Standard Play: Open with Conservative Offer, negotiate to MAO.'
        ELSE 'Cold Lead: Anchor extremely low to test motivation.'
    END AS negotiation_strategy
FROM public.leads l;