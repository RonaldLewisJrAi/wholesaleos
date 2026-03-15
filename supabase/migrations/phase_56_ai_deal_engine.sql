-- Add AI Intelligence Fields to `properties` table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS ai_deal_score integer,
    ADD COLUMN IF NOT EXISTS ai_confidence text,
    ADD COLUMN IF NOT EXISTS risk_level text,
    ADD COLUMN IF NOT EXISTS liquidity_signal text,
    ADD COLUMN IF NOT EXISTS recommended_offer numeric;
-- Add AI Intelligence Fields to `foreclosure_leads` table
ALTER TABLE public.foreclosure_leads
ADD COLUMN IF NOT EXISTS ai_deal_score integer,
    ADD COLUMN IF NOT EXISTS ai_confidence text,
    ADD COLUMN IF NOT EXISTS risk_level text,
    ADD COLUMN IF NOT EXISTS liquidity_signal text,
    ADD COLUMN IF NOT EXISTS recommended_offer numeric;
-- Index for AI Score to enable rapid sorting in Deal Radar / Match Feed
CREATE INDEX IF NOT EXISTS idx_properties_ai_deal_score ON public.properties(ai_deal_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_foreclosure_leads_ai_deal_score ON public.foreclosure_leads(ai_deal_score DESC NULLS LAST);
-- Buyer Demand Engine: Simple RPC to compute Liquidity Signal based on trailing 90-day cash closes
-- Note: This is a foundational function that can be expanded with real MLS data later.
CREATE OR REPLACE FUNCTION public.calculate_buyer_demand(target_zip text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE recent_transactions int;
signal text;
BEGIN -- This simulates checking a closed_deals table or similar for regional activity.
-- For Vanguard phase, we'll count how many users or properties exist in this zip as a proxy
-- OR map a static proxy based on system activity.
-- Let's use property density in the same zip code as a proxy for "hot" markets.
SELECT count(*) INTO recent_transactions
FROM public.properties
WHERE zip_code = target_zip
    AND created_at >= now() - interval '90 days';
IF recent_transactions >= 20 THEN signal := 'HIGH';
ELSIF recent_transactions >= 5 THEN signal := 'MEDIUM';
ELSE signal := 'LOW';
END IF;
RETURN signal;
END;
$$;