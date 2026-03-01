-- ========================================================================================
-- WHOLESALE OS - PHASE 37 RELAX PERSONA RESTRICTIONS
-- ========================================================================================
-- This script drops the strict trigger that blocked standard users from mutating
-- their own system personas, reverting it to a selectable frontend trait.
-- ========================================================================================
BEGIN;
DROP TRIGGER IF EXISTS restrict_persona_updates ON public.profiles;
DROP FUNCTION IF EXISTS enforce_persona_immutability();
COMMIT;