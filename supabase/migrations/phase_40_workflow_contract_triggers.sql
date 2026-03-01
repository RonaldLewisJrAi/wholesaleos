-- ==============================================================================
-- PHASE 40: WORKFLOW AUTOMATION ENGINE - CONTRACT & ASSIGNMENT TRIGGERS
-- ==============================================================================
-- 1. Function: Process Contract Signed Event
CREATE OR REPLACE FUNCTION process_contract_signed() RETURNS TRIGGER AS $$ BEGIN -- Only trigger if the status changed to 'Under Contract'
    IF NEW.status = 'Under Contract'
    AND (
        OLD.status IS NULL
        OR OLD.status != 'Under Contract'
    ) THEN -- A. Update the Deal Stage seamlessly
UPDATE public.deals
SET current_stage = 'Under Contract',
    updated_at = NOW()
WHERE id = NEW.id;
-- B. Log the major milestone activity
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
        auth.uid(),
        /* Captures the user who triggered the update */
        'contract_signed',
        'deals',
        NEW.id,
        jsonb_build_object('milestone', true, 'timestamp', NOW())
    );
EXCEPTION
WHEN OTHERS THEN -- Ignore log failure
END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Bind the Contract Signed Trigger to Deals Table
DROP TRIGGER IF EXISTS trg_process_contract_signed ON public.deals;
CREATE TRIGGER trg_process_contract_signed
AFTER
UPDATE OF status ON public.deals FOR EACH ROW
    WHEN (NEW.status = 'Under Contract') EXECUTE FUNCTION process_contract_signed();
-- 3. Function: Process Assignment Signed Event
CREATE OR REPLACE FUNCTION process_assignment_signed() RETURNS TRIGGER AS $$ BEGIN -- Only trigger if the status changed to 'Assigned'
    IF NEW.status = 'Assigned'
    AND (
        OLD.status IS NULL
        OR OLD.status != 'Assigned'
    ) THEN -- A. Update the Deal Stage seamlessly
UPDATE public.deals
SET current_stage = 'Assigned',
    updated_at = NOW()
WHERE id = NEW.id;
-- B. Log the major milestone activity
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
        auth.uid(),
        'assignment_signed',
        'deals',
        NEW.id,
        jsonb_build_object(
            'milestone',
            true,
            'buyer_id',
            NEW.assigned_buyer_id,
            'timestamp',
            NOW()
        )
    );
EXCEPTION
WHEN OTHERS THEN -- Ignore log failure
END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. Bind the Assignment Signed Trigger to Deals Table
DROP TRIGGER IF EXISTS trg_process_assignment_signed ON public.deals;
CREATE TRIGGER trg_process_assignment_signed
AFTER
UPDATE OF status ON public.deals FOR EACH ROW
    WHEN (NEW.status = 'Assigned') EXECUTE FUNCTION process_assignment_signed();