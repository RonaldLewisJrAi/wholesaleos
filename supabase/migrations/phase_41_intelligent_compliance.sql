-- ==============================================================================
-- PHASE 41: INTELLIGENT SYSTEM BEHAVIOR - COMPLIANCE & INSIGHTS
-- ==============================================================================
-- 1. Create a Table to hold System Insights / Flags
CREATE TABLE IF NOT EXISTS public.deal_intelligence_flags (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    flag_type text NOT NULL CHECK (
        flag_type IN (
            'Risk',
            'Opportunity',
            'Compliance_Warning',
            'Action_Required'
        )
    ),
    severity text NOT NULL CHECK (
        severity IN ('Low', 'Medium', 'High', 'Critical')
    ),
    description text NOT NULL,
    resolved boolean DEFAULT false,
    resolved_by uuid REFERENCES public.profiles(id),
    resolved_at timestamptz,
    created_at timestamptz DEFAULT NOW()
);
-- Enable RLS on Intelligence Flags
ALTER TABLE public.deal_intelligence_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their organization's intelligence flags" ON public.deal_intelligence_flags FOR
SELECT USING (organization_id = get_current_user_org());
CREATE POLICY "Users can resolve their organization's intelligence flags" ON public.deal_intelligence_flags FOR
UPDATE USING (organization_id = get_current_user_org());
-- 2. Intelligent Function: Evaluate Compliance Risk on Deal Update
CREATE OR REPLACE FUNCTION evaluate_deal_compliance() RETURNS TRIGGER AS $$
DECLARE v_days_to_close integer;
BEGIN -- Only evaluate if it's an active deal
IF NEW.status IN ('Dead', 'Closed') THEN RETURN NEW;
END IF;
-- [A] Close Date Urgency Flag
IF NEW.estimated_close_date IS NOT NULL THEN v_days_to_close := NEW.estimated_close_date::date - CURRENT_DATE;
IF v_days_to_close <= 5
AND v_days_to_close > 0
AND NEW.current_stage != 'Clear to Close' THEN -- Check if a High urgency flag already exists to prevent spam
IF NOT EXISTS (
    SELECT 1
    FROM public.deal_intelligence_flags
    WHERE deal_id = NEW.id
        AND flag_type = 'Action_Required'
        AND resolved = false
) THEN
INSERT INTO public.deal_intelligence_flags (
        organization_id,
        deal_id,
        flag_type,
        severity,
        description
    )
VALUES (
        NEW.organization_id,
        NEW.id,
        'Action_Required',
        'High',
        'Deal is closing in under 5 days but is not marked Clear to Close. Immediate attention required.'
    );
END IF;
END IF;
END IF;
-- [B] Financial Risk Flag (EMD Missing)
IF NEW.current_stage = 'Under Contract'
AND (
    OLD.current_stage IS NULL
    OR OLD.current_stage != 'Under Contract'
) THEN IF (NEW.contract_terms->>'emd_amount') IS NULL
OR (NEW.contract_terms->>'emd_amount')::numeric <= 0 THEN
INSERT INTO public.deal_intelligence_flags (
        organization_id,
        deal_id,
        flag_type,
        severity,
        description
    )
VALUES (
        NEW.organization_id,
        NEW.id,
        'Risk',
        'Medium',
        'Deal marked Under Contract but lacks documented Earnest Money Deposit (EMD) terms.'
    );
END IF;
END IF;
-- [C] Compliance Disclosure Missing (State-specific stub via JSON lookup)
IF NEW.current_stage = 'Assigned'
AND (
    OLD.current_stage IS NULL
    OR OLD.current_stage != 'Assigned'
) THEN IF NOT (
    NEW.contract_terms ? 'assignment_disclosure_signed'
) THEN
INSERT INTO public.deal_intelligence_flags (
        organization_id,
        deal_id,
        flag_type,
        severity,
        description
    )
VALUES (
        NEW.organization_id,
        NEW.id,
        'Compliance_Warning',
        'Critical',
        'Deal assigned without verified Assignment Disclosure. High legal risk.'
    );
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Bind the Compliance Trigger
DROP TRIGGER IF EXISTS trg_evaluate_deal_compliance ON public.deals;
CREATE TRIGGER trg_evaluate_deal_compliance
AFTER
INSERT
    OR
UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION evaluate_deal_compliance();
-- 4. Intelligent Function: Offer Suggestion Engine (View)
-- Synthesizes Lead data to suggest starting points for Acq Managers
CREATE OR REPLACE VIEW public.vw_intelligent_offer_suggestions AS
SELECT l.id AS lead_id,
    l.organization_id,
    l.arv,
    l.estimated_repairs,
    l.mao,
    l.heat_score,
    -- Conservative Offer: 60% of ARV minus repairs
    (
        (l.arv * 0.60) - COALESCE(l.estimated_repairs, 0)
    ) AS conservative_offer,
    -- Aggressive Offer (High Heat): 75% of ARV minus repairs (tight margins)
    (
        (l.arv * 0.75) - COALESCE(l.estimated_repairs, 0)
    ) AS aggressive_offer,
    CASE
        WHEN l.heat_score > 75 THEN 'Highly Competitive: Use Aggressive Offer framing.'
        WHEN l.heat_score > 40 THEN 'Standard Play: Open with Conservative Offer, negotiate to MAO.'
        ELSE 'Cold Lead: Anchor extremely low to test motivation.'
    END AS negotiation_strategy
FROM public.leads l;