-- ==============================================================================
-- PHASE 11: COMP INTELLIGENCE ENGINE SCHEMA MIGRATION
-- ==============================================================================
-- Description: Adds persistent Renovation Tier tracking to the properties table.
DO $$ BEGIN RAISE NOTICE 'Starting Phase 11 Comp Intelligence Migration...';
-- 1. Add Renovation Tier to Properties Table
-- This allows the Intelligence Engine to permanently lock the selected renovation multiplier to the deal.
ALTER TABLE IF EXISTS public.properties
ADD COLUMN IF NOT EXISTS renovation_tier text DEFAULT 'moderate' CHECK (renovation_tier IN ('light', 'moderate', 'gut'));
RAISE NOTICE 'Successfully added renovation_tier tracking to public.properties table.';
RAISE NOTICE 'Phase 11 Comp Intelligence Migration Complete.';
END $$;