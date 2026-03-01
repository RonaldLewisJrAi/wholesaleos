-- ==============================================================================
-- PHASE 39: WORKFLOW AUTOMATION ENGINE - LEAD TRIGGERS
-- ==============================================================================
-- 1. MAO (Maximum Allowable Offer) Calculation Function
-- Standard Formula: (ARV * 0.70) - Estimated Repairs - Wholesale Fee
CREATE OR REPLACE FUNCTION calculate_mao(
        p_arv numeric,
        p_estimated_repairs numeric,
        p_desired_fee numeric
    ) RETURNS numeric AS $$
DECLARE v_arv numeric := COALESCE(p_arv, 0);
v_repairs numeric := COALESCE(p_estimated_repairs, 0);
v_fee numeric := COALESCE(p_desired_fee, 0);
v_mao numeric;
BEGIN IF v_arv <= 0 THEN RETURN 0;
END IF;
v_mao := (v_arv * 0.70) - v_repairs - v_fee;
-- Ensure MAO doesn't go negative natively
IF v_mao < 0 THEN RETURN 0;
END IF;
RETURN v_mao;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
-- 2. Add Automation Columns to Leads (if they don't exist from Phase 38)
ALTER TABLE IF EXISTS public.leads
ADD COLUMN IF NOT EXISTS arv numeric(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS estimated_repairs numeric(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS desired_fee numeric(12, 2) DEFAULT 10000.00,
    /* Default target fee */
ADD COLUMN IF NOT EXISTS mao numeric(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id);
-- 3. Workflow Trigger: Pre-Insert/Update Lead Processing
CREATE OR REPLACE FUNCTION process_lead_workflow() RETURNS TRIGGER AS $$
DECLARE v_org_owner uuid;
BEGIN -- [A] Auto-Calculate MAO on strictly provided figures
NEW.mao := calculate_mao(NEW.arv, NEW.estimated_repairs, NEW.desired_fee);
-- [B] Auto-Assignment Logic (On Insert Only)
IF TG_OP = 'INSERT'
AND NEW.assigned_to IS NULL THEN -- Default strategy: Assign to the Organization Owner if nobody else is assigned
SELECT owner_id INTO v_org_owner
FROM public.organizations
WHERE id = NEW.organization_id;
IF v_org_owner IS NOT NULL THEN NEW.assigned_to := v_org_owner;
END IF;
-- Log the auto-assignment activity
-- Note: We wrap this in an exception block so missing activity functionality doesn't crash inserts
BEGIN
INSERT INTO public.activity_logs (
        organization_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        metadata
    )
VALUES (
        NEW.organization_id,
        v_org_owner,
        'lead_auto_assigned',
        'leads',
        NEW.id,
        jsonb_build_object(
            'auto_assign',
            true,
            'reason',
            'System Default Strategy'
        )
    );
EXCEPTION
WHEN OTHERS THEN -- Ignore log failure to preserve the insert
END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. Bind the Workflow Trigger to Leads Table
DROP TRIGGER IF EXISTS trg_process_lead_workflow ON public.leads;
CREATE TRIGGER trg_process_lead_workflow BEFORE
INSERT
    OR
UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION process_lead_workflow();