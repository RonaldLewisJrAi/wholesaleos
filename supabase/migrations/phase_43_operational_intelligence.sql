-- ==============================================================================
-- PHASE 43: OPERATIONAL INTELLIGENCE & DETERMINISTIC LOGGING
-- ==============================================================================
-- 1. Governance Table for Intelligence Models
CREATE TABLE IF NOT EXISTS public.intelligence_model_versions (
    version VARCHAR(50) PRIMARY KEY,
    description TEXT NOT NULL,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO public.intelligence_model_versions (version, description, active)
VALUES (
        'v1.0.0',
        'Initial Deterministic Deal Discipline Score (DDS) & MAO Auditing',
        true
    ) ON CONFLICT (version) DO NOTHING;
-- 2. Immutable Ledger for Intelligence Decisions
CREATE TABLE IF NOT EXISTS public.intelligence_decision_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    -- 'lead', 'deal'
    entity_id UUID NOT NULL,
    calculation_type TEXT NOT NULL,
    -- 'MAO', 'DDS', 'RiskFlag', 'OfferSuggestion'
    input_values JSONB NOT NULL,
    output_value JSONB NOT NULL,
    model_version VARCHAR(50) REFERENCES public.intelligence_model_versions(version),
    calculated_by TEXT NOT NULL,
    -- usually the trigger or function name
    calculated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.intelligence_decision_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view org intelligence logs" ON public.intelligence_decision_logs FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
    );
-- 3. Deal Discipline Score (DDS) Additions
ALTER TABLE IF EXISTS public.deals
ADD COLUMN IF NOT EXISTS deal_discipline_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS dds_details JSONB;
-- 4. Deal Trigger: Calculate DDS 
CREATE OR REPLACE FUNCTION compute_deal_discipline_score() RETURNS TRIGGER AS $$
DECLARE v_total_score INTEGER := 0;
v_emd_score INTEGER := 0;
v_price_score INTEGER := 0;
v_fee_score INTEGER := 0;
v_date_score INTEGER := 0;
v_compliance_score INTEGER := 20;
v_active_model VARCHAR(50);
BEGIN
SELECT version INTO v_active_model
FROM public.intelligence_model_versions
WHERE active = true
LIMIT 1;
IF v_active_model IS NULL THEN v_active_model := 'v1.0.0';
END IF;
-- Evaluate EMD
IF NEW.emd_amount IS NOT NULL
AND NEW.emd_amount > 0 THEN v_emd_score := 20;
END IF;
-- Evaluate Contract Price
IF NEW.contract_price IS NOT NULL
AND NEW.contract_price > 0 THEN v_price_score := 20;
END IF;
-- Evaluate Assignment Fee
IF NEW.assignment_fee IS NOT NULL
AND NEW.assignment_fee > 0 THEN v_fee_score := 20;
END IF;
-- Evaluate Close Date (not expired)
IF NEW.close_date IS NOT NULL
AND NEW.close_date >= CURRENT_DATE THEN v_date_score := 20;
END IF;
-- Evaluate Compliance Flags (Are there unresolved High/Critical flags?)
IF EXISTS (
    SELECT 1
    FROM public.deal_intelligence_flags
    WHERE deal_id = NEW.id
        AND resolved = false
        AND severity IN ('High', 'Critical')
) THEN v_compliance_score := 0;
END IF;
v_total_score := v_emd_score + v_price_score + v_fee_score + v_date_score + v_compliance_score;
NEW.deal_discipline_score := v_total_score;
NEW.dds_details := jsonb_build_object(
    'emd_logged',
    v_emd_score = 20,
    'contract_price_logged',
    v_price_score = 20,
    'assignment_fee_logged',
    v_fee_score = 20,
    'close_date_valid',
    v_date_score = 20,
    'no_critical_flags',
    v_compliance_score = 20
);
-- Log the intelligence decision
IF TG_OP = 'INSERT'
OR OLD.deal_discipline_score IS DISTINCT
FROM NEW.deal_discipline_score THEN BEGIN
INSERT INTO public.intelligence_decision_logs (
        organization_id,
        entity_type,
        entity_id,
        calculation_type,
        input_values,
        output_value,
        model_version,
        calculated_by
    )
VALUES (
        NEW.organization_id,
        'deal',
        NEW.id,
        'DDS',
        jsonb_build_object(
            'emd_amount',
            NEW.emd_amount,
            'contract_price',
            NEW.contract_price,
            'assignment_fee',
            NEW.assignment_fee,
            'close_date',
            NEW.close_date
        ),
        jsonb_build_object(
            'score',
            v_total_score,
            'details',
            NEW.dds_details
        ),
        v_active_model,
        'compute_deal_discipline_score'
    );
EXCEPTION
WHEN OTHERS THEN
END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_compute_deal_discipline_score ON public.deals;
CREATE TRIGGER trg_compute_deal_discipline_score BEFORE
INSERT
    OR
UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION compute_deal_discipline_score();
-- 5. Track MAO Calculation in Intelligence Logs
CREATE OR REPLACE FUNCTION process_lead_workflow() RETURNS TRIGGER AS $$
DECLARE v_org_owner uuid;
v_active_model VARCHAR(50);
BEGIN -- Grab Active Model
SELECT version INTO v_active_model
FROM public.intelligence_model_versions
WHERE active = true
LIMIT 1;
IF v_active_model IS NULL THEN v_active_model := 'v1.0.0';
END IF;
-- [A] Auto-Calculate MAO on strictly provided figures
NEW.mao := calculate_mao(NEW.arv, NEW.estimated_repairs, NEW.desired_fee);
-- Record MAO intelligence log if changed
IF TG_OP = 'INSERT'
OR (
    OLD.mao IS DISTINCT
    FROM NEW.mao
) THEN BEGIN
INSERT INTO public.intelligence_decision_logs (
        organization_id,
        entity_type,
        entity_id,
        calculation_type,
        input_values,
        output_value,
        model_version,
        calculated_by
    )
VALUES (
        NEW.organization_id,
        'lead',
        NEW.id,
        'MAO',
        jsonb_build_object(
            'arv',
            NEW.arv,
            'estimated_repairs',
            NEW.estimated_repairs,
            'desired_fee',
            NEW.desired_fee
        ),
        jsonb_build_object('mao', NEW.mao),
        v_active_model,
        'calculate_mao'
    );
EXCEPTION
WHEN OTHERS THEN
END;
END IF;
-- [B] Auto-Assignment Logic (On Insert Only)
IF TG_OP = 'INSERT'
AND NEW.assigned_to IS NULL THEN
SELECT owner_id INTO v_org_owner
FROM public.organizations
WHERE id = NEW.organization_id;
IF v_org_owner IS NOT NULL THEN NEW.assigned_to := v_org_owner;
END IF;
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
WHEN OTHERS THEN
END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;