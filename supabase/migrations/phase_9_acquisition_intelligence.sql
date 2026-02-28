-- ==============================================================================
-- PHASE 9: ACQUISITION INTELLIGENCE ENGINE SCHEMA MIGRATION
-- ==============================================================================
-- 1. Add Advanced Intelligence Columns to the CRM Contacts Table
ALTER TABLE IF EXISTS public.crm_contacts
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
-- 2. Create the Heat Score Generation Logic (Database-Level Calculation)
CREATE OR REPLACE FUNCTION calculate_lead_heat_score(
        p_distress_score integer,
        p_equity_percent numeric,
        p_timeline text
    ) RETURNS integer AS $$
DECLARE v_timeline_score integer := 0;
v_heat_score numeric;
v_clamped_equity numeric;
BEGIN -- Convert timeline enum to a weight
IF p_timeline = '0-30 days' THEN v_timeline_score := 100;
ELSIF p_timeline = '30-90 days' THEN v_timeline_score := 50;
ELSE v_timeline_score := 10;
END IF;
-- Clamp equity percent natively to avoid negative/over 100 skewing the algorithm
v_clamped_equity := LEAST(GREATEST(COALESCE(p_equity_percent, 0), 0), 100);
-- Heat Score = (Distress * 40%) + (Equity * 40%) + (Timeline * 20%)
v_heat_score := (COALESCE(p_distress_score, 0) * 0.40) + (v_clamped_equity * 0.40) + (v_timeline_score * 0.20);
RETURN ROUND(v_heat_score)::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
-- 3. Create Automated Trigger to Auto-Calculate Equity & Heat Score on Insert/Update
CREATE OR REPLACE FUNCTION update_lead_intelligence_metrics() RETURNS TRIGGER AS $$ BEGIN -- Auto-Calculate Equity Percent = ((ARV - Mortgage Balance) / ARV) * 100
    IF NEW.arv IS NOT NULL
    AND NEW.arv > 0 THEN NEW.equity_percent := (
        (NEW.arv - COALESCE(NEW.mortgage_balance, 0)) / NEW.arv
    ) * 100;
ELSE NEW.equity_percent := 0;
END IF;
-- Generate Composite Heat Score
NEW.heat_score := calculate_lead_heat_score(
    NEW.distress_score,
    NEW.equity_percent,
    NEW.timeline_to_sell
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Bind the trigger to the crm_contacts table
DROP TRIGGER IF EXISTS calc_lead_intelligence ON public.crm_contacts;
CREATE TRIGGER calc_lead_intelligence BEFORE
INSERT
    OR
UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION update_lead_intelligence_metrics();