-- ==============================================================================
-- PHASE 44: ALIGN DDS TRIGGER WITH DEALS SCHEMA
-- Objective: The `compute_deal_discipline_score` trigger in Phase 43 evaluates
-- `NEW.emd_amount` and `NEW.close_date`, but the active `deals` schema
-- lacks `emd_amount` and instead uses `expected_close_date` and `actual_close_date`.
-- This causes all deal inserts to crash with `record "new" has no field`.
-- Fix: Replacing the function to match the live schema gracefully.
-- ==============================================================================
CREATE OR REPLACE FUNCTION compute_deal_discipline_score() RETURNS TRIGGER AS $$
DECLARE v_total_score INTEGER := 0;
v_price_score INTEGER := 0;
v_fee_score INTEGER := 0;
v_date_score INTEGER := 0;
v_compliance_score INTEGER := 40;
-- Distributing the missing 20 points from EMD here
v_active_model VARCHAR(50);
BEGIN
SELECT version INTO v_active_model
FROM public.intelligence_model_versions
WHERE active = true
LIMIT 1;
IF v_active_model IS NULL THEN v_active_model := 'v1.0.0';
END IF;
-- Evaluate Contract Price
IF NEW.contract_price IS NOT NULL
AND NEW.contract_price > 0 THEN v_price_score := 20;
END IF;
-- Evaluate Assignment Fee
IF NEW.assignment_fee IS NOT NULL
AND NEW.assignment_fee > 0 THEN v_fee_score := 20;
END IF;
-- Evaluate Close Date (not expired) using expected_close_date
IF NEW.expected_close_date IS NOT NULL
AND NEW.expected_close_date >= CURRENT_DATE THEN v_date_score := 20;
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
v_total_score := v_price_score + v_fee_score + v_date_score + v_compliance_score;
NEW.deal_discipline_score := v_total_score;
NEW.dds_details := jsonb_build_object(
    'contract_price_logged',
    v_price_score = 20,
    'assignment_fee_logged',
    v_fee_score = 20,
    'close_date_valid',
    v_date_score = 20,
    'no_critical_flags',
    v_compliance_score = 40
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
            'contract_price',
            NEW.contract_price,
            'assignment_fee',
            NEW.assignment_fee,
            'expected_close_date',
            NEW.expected_close_date
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
WHEN OTHERS THEN -- Fail silently if logging fails to not break inserts further
END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;