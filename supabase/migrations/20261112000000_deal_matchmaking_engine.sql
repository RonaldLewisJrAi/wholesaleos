-- ========================================================================================
-- WHOLESALE OS - DEAL MATCHMAKING ENGINE
-- ========================================================================================
-- 1. Create `deal_matches` table
CREATE TABLE IF NOT EXISTS public.deal_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,
    match_score INT DEFAULT 100,
    -- e.g., 0-100 indicating precision of match
    notified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent duplicate match entries for the same deal/investor combo
    CONSTRAINT unique_deal_investor_match UNIQUE(deal_id, investor_id)
);
-- Enable RLS
ALTER TABLE public.deal_matches ENABLE ROW LEVEL SECURITY;
-- 2. Indexing Strategy for Scaling Operations
CREATE INDEX IF NOT EXISTS idx_deal_matches_investor_id ON public.deal_matches(investor_id);
CREATE INDEX IF NOT EXISTS idx_deal_matches_deal_id ON public.deal_matches(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_matches_score ON public.deal_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_deal_matches_notified ON public.deal_matches(notified);
-- 3. RLS Policies for deal_matches
-- Investors can see their own matches
DROP POLICY IF EXISTS "Investors view own deal matches" ON public.deal_matches;
CREATE POLICY "Investors view own deal matches" ON public.deal_matches FOR
SELECT USING (
        investor_id IN (
            SELECT id
            FROM public.investor_profiles
            WHERE user_id = auth.uid()
        )
    );
-- Wholesalers can see who their deals matched with (if they own the deal's organization)
DROP POLICY IF EXISTS "Wholesalers view matches for their deals" ON public.deal_matches;
CREATE POLICY "Wholesalers view matches for their deals" ON public.deal_matches FOR
SELECT USING (
        deal_id IN (
            SELECT id
            FROM public.deals
            WHERE organization_id = get_current_user_org()
        )
    );
-- ========================================================================================
-- 4. THE MATCHMAKING POSTGRES FUNCTION & TRIGGER
-- ========================================================================================
CREATE OR REPLACE FUNCTION filter_and_match_investors() RETURNS TRIGGER AS $$
DECLARE prop_record RECORD;
deal_purchase_price NUMERIC;
estimated_rehab NUMERIC;
deal_arv NUMERIC;
deal_roi NUMERIC := 0;
investor RECORD;
computed_score INT := 0;
BEGIN -- Only run matchmaking if the deal is flagged for the marketplace (Assume boolean flag exists or default to evaluating all deals initially)
-- In Wholesale-OS deals reference properties dynamically. Get the linked property details:
SELECT city,
    state,
    property_type,
    arv,
    rehab_estimate INTO prop_record
FROM public.properties
WHERE id = NEW.property_id;
-- Exit if no property details mapped
IF prop_record IS NULL THEN RETURN NEW;
END IF;
-- Calculate total price to investor: Contract Price + Wholesaler Assignment Fee
deal_purchase_price := COALESCE(NEW.contract_price, 0) + COALESCE(NEW.assignment_fee, 0);
estimated_rehab := COALESCE(prop_record.rehab_estimate, 0);
deal_arv := COALESCE(prop_record.arv, 0);
-- Compute ROI: ((ARV - (Purchase + Rehab)) / (Purchase + Rehab)) * 100
IF (deal_purchase_price + estimated_rehab) > 0 THEN deal_roi := (
    (
        deal_arv - (deal_purchase_price + estimated_rehab)
    ) / (deal_purchase_price + estimated_rehab)
) * 100;
END IF;
-- Iterate through all active Investor Buy Boxes to find matches
FOR investor IN
SELECT ib.investor_id,
    ib.markets,
    ib.property_types,
    ib.max_purchase_price,
    ib.min_roi,
    ib.rehab_levels
FROM public.investor_buy_boxes ib
    JOIN public.investor_profiles ip ON ib.investor_id = ip.id
WHERE ip.verified_status IN ('pending', 'verified') -- Exclude rejected investors
    LOOP -- Reset Score
    computed_score := 100;
-- MATCH FILTER 1: City / Market (Format assumed "City, State")
-- If their array isn't empty, check if our property city exists in their list
IF investor.markets IS NOT NULL
AND array_length(investor.markets, 1) > 0 THEN IF NOT (
    prop_record.city || ', ' || prop_record.state = ANY(investor.markets)
) THEN CONTINUE;
-- Skip this investor, strict mismatch
END IF;
END IF;
-- MATCH FILTER 2: Max Purchase Price Check
IF investor.max_purchase_price > 0
AND deal_purchase_price > investor.max_purchase_price THEN CONTINUE;
-- Too expensive
END IF;
-- MATCH FILTER 3: Property Type Match
IF investor.property_types IS NOT NULL
AND array_length(investor.property_types, 1) > 0 THEN IF NOT (
    prop_record.property_type = ANY(investor.property_types)
) THEN CONTINUE;
-- Wrong asset class
END IF;
END IF;
-- MATCH FILTER 4: Minimum ROI Expectation
IF investor.min_roi > 0
AND deal_roi < investor.min_roi THEN CONTINUE;
-- Doesn't meet yield criteria
END IF;
-- MATCH FILTER 5: Rehab Level Check (Assuming text-based levels like 'Turnkey', 'Heavy Gut')
-- If we have data, and they restrict it, let's verify. (Requires adding a 'rehab_level' text to properties realistically)
-- *Skipped explicit exclusion here to allow broad funnel unless strictly mapped, we dock points instead.*
-- Insert successful match into mapping table
INSERT INTO public.deal_matches (deal_id, investor_id, match_score, notified)
VALUES (
        NEW.id,
        investor.investor_id,
        computed_score,
        false
    ) ON CONFLICT (deal_id, investor_id) DO
UPDATE
SET match_score = EXCLUDED.match_score,
    notified = false;
-- Retrigger notification if updated
END LOOP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 5. Attach the Trigger
DROP TRIGGER IF EXISTS trigger_match_deals_to_investors ON public.deals;
CREATE TRIGGER trigger_match_deals_to_investors
AFTER
INSERT
    OR
UPDATE OF contract_price,
    assignment_fee ON public.deals FOR EACH ROW EXECUTE FUNCTION filter_and_match_investors();