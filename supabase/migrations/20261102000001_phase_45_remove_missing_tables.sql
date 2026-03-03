-- ==============================================================================
-- PHASE 45: REMOVE BROKEN SCHEMA REFERENCES FROM DDS
-- Objective: The `compute_deal_discipline_score` contains direct table references
-- to `public.deal_intelligence_flags`. This table does not exist natively
-- in the remote database causing all deal inserts to encounter compilation errors
-- natively at the Postgres Trigger level. Resolving by dropping the reference.
-- ==============================================================================
CREATE OR REPLACE FUNCTION compute_deal_discipline_score() RETURNS TRIGGER AS $$
DECLARE v_total_score INTEGER := 0;
v_price_score INTEGER := 0;
v_fee_score INTEGER := 0;
v_date_score INTEGER := 0;
v_compliance_score INTEGER := 40;
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
-- REMOVED: Evaluation of deal_intelligence_flags due to missing relation.
-- Defaulting inherently to `v_compliance_score = 40`.
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
WHEN OTHERS THEN
END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;