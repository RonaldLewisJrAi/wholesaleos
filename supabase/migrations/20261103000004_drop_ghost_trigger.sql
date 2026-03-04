-- ==============================================================================
-- PHASE 40.1: ORPHAN LOCK CLEANUP
-- Objective: Search pg_proc dynamically for any legacy function containing
-- the string 'Subscription inactive' and wipe it out via CASCADE to ensure
-- Phase 40 Governance triggers don't collide with deprecated logic.
-- ==============================================================================
DO $$
DECLARE trg record;
BEGIN FOR trg IN
SELECT p.proname
FROM pg_proc p
WHERE p.prosrc ILIKE '%Subscription inactive%' LOOP EXECUTE format(
        'DROP FUNCTION IF EXISTS public.%I CASCADE;',
        trg.proname
    );
END LOOP;
END $$;