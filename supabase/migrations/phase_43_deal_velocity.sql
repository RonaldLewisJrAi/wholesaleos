-- Phase 43 Integration: Deal Velocity Index
-- Appending vital investor engagement velocity metrics to the Master Properties core table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS velocity_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS offer_count INTEGER DEFAULT 0;
-- Establish vital lookup indices for feed performance and real-time sorting
CREATE INDEX IF NOT EXISTS idx_properties_velocity_score ON public.properties(velocity_score);
-- We need a secure incrementing mechanism without triggering standard trigger overhead
-- Creating an RPC to bump counts defensively preventing arbitrary numeric injections
CREATE OR REPLACE FUNCTION increment_deal_velocity(property_uuid UUID, interaction_type TEXT) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN IF interaction_type = 'view' THEN
UPDATE public.properties
SET view_count = view_count + 1
WHERE id = property_uuid;
ELSIF interaction_type = 'save' THEN
UPDATE public.properties
SET save_count = save_count + 1
WHERE id = property_uuid;
ELSIF interaction_type = 'offer' THEN
UPDATE public.properties
SET offer_count = offer_count + 1
WHERE id = property_uuid;
END IF;
-- Recompute the unified velocity algorithm
UPDATE public.properties
SET velocity_score = (view_count * 1) + (save_count * 5) + (offer_count * 25)
WHERE id = property_uuid;
END;
$$;