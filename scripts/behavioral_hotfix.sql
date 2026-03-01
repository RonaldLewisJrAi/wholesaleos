ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS distress_score integer DEFAULT 0 CHECK (
        distress_score >= 0
        AND distress_score <= 100
    ),
    ADD COLUMN IF NOT EXISTS equity_percent numeric(5, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS motivation_level integer DEFAULT 1 CHECK (
        motivation_level >= 1
        AND motivation_level <= 5
    ),
    ADD COLUMN IF NOT EXISTS timeline_to_sell text DEFAULT '90+ days' CHECK (
        timeline_to_sell IN ('0-30 days', '30-90 days', '90+ days')
    ),
    ADD COLUMN IF NOT EXISTS last_contact_date timestamptz,
    ADD COLUMN IF NOT EXISTS follow_up_interval_days integer DEFAULT 7,
    ADD COLUMN IF NOT EXISTS marketing_source text DEFAULT 'Organic/Direct',
    ADD COLUMN IF NOT EXISTS cost_per_lead numeric(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS arv numeric(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS mortgage_balance numeric(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS heat_score integer DEFAULT 0;
DROP TRIGGER IF EXISTS calc_lead_intelligence ON public.leads;
CREATE TRIGGER calc_lead_intelligence BEFORE
INSERT
    OR
UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_lead_intelligence_metrics();