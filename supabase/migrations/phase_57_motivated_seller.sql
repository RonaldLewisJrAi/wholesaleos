-- Add Motivated Seller / Distress Indicators to `foreclosure_leads` table
ALTER TABLE public.foreclosure_leads
ADD COLUMN IF NOT EXISTS tax_delinquent boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS code_violations boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS vacancy_indicator boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS auction_date timestamp with time zone,
    ADD COLUMN IF NOT EXISTS distress_score integer DEFAULT 0;
-- Optional: Add same metrics to the `properties` table since deals migrate upward to Marketplace
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS tax_delinquent boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS code_violations boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS vacancy_indicator boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS auction_date timestamp with time zone,
    ADD COLUMN IF NOT EXISTS distress_score integer DEFAULT 0;
-- Indexes for rapid sorting / querying of highly distressed leads
CREATE INDEX IF NOT EXISTS idx_leads_distress_score ON public.foreclosure_leads(distress_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_properties_distress_score ON public.properties(distress_score DESC NULLS LAST);