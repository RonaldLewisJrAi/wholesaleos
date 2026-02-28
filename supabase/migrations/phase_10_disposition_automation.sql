-- ==============================================================================
-- PHASE 10: DISPOSITION AUTOMATION ENGINE SCHEMA MIGRATION
-- ==============================================================================
-- Description: Creates the Buyer Criteria table and the Disposition Matching Engine
DO $$ BEGIN RAISE NOTICE 'Starting Phase 10 Disposition Automation Migration...';
-- 1. Create the Buyer Criteria Table
-- This table stores specific buying params mapped to a VIP Investor in crm_contacts.
CREATE TABLE IF NOT EXISTS public.buyer_criteria (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id bigint REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    zip_codes text [] DEFAULT '{}',
    min_equity numeric(5, 2) DEFAULT 0.00,
    property_types text [] DEFAULT '{}',
    max_price numeric(12, 2),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
RAISE NOTICE 'Successfully created public.buyer_criteria table.';
-- Enable RLS
ALTER TABLE public.buyer_criteria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.buyer_criteria;
CREATE POLICY "Enable read access for all users" ON public.buyer_criteria FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.buyer_criteria;
CREATE POLICY "Enable insert access for all users" ON public.buyer_criteria FOR
INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update access for all users" ON public.buyer_criteria;
CREATE POLICY "Enable update access for all users" ON public.buyer_criteria FOR
UPDATE USING (true);
-- 2. Create the Deal-To-Buyer Auto-Match Algorithm (RPC)
-- This RPC function expects a deal's Zip Code, Equity %, Property Type, and Max Allowable Offer (Asking Price).
-- It returns a ranked list of VIP buyers from the CRM whose criteria matches the deal.
CREATE OR REPLACE FUNCTION get_matching_buyers(
        p_zip_code text,
        p_equity numeric,
        p_property_type text,
        p_asking_price numeric
    ) RETURNS TABLE (
        contact_id bigint,
        name text,
        phone text,
        email text,
        match_score integer,
        min_equity numeric,
        matched_zip text
    ) AS $func$ BEGIN RETURN QUERY
SELECT c.id as contact_id,
    c.name as name,
    c.phone as phone,
    c.email as email,
    -- Calculate precise match score (0-100)
    (
        (
            CASE
                WHEN array_length(bc.zip_codes, 1) IS NULL
                OR p_zip_code = ANY(bc.zip_codes)
                OR 'Any' = ANY(bc.zip_codes) THEN 40
                ELSE 0
            END
        ) + (
            CASE
                WHEN bc.min_equity IS NULL
                OR p_equity >= bc.min_equity THEN 30
                ELSE 0
            END
        ) + (
            CASE
                WHEN array_length(bc.property_types, 1) IS NULL
                OR p_property_type = ANY(bc.property_types) THEN 30
                ELSE 0
            END
        )
    )::integer as match_score,
    bc.min_equity,
    p_zip_code as matched_zip
FROM public.buyer_criteria bc
    JOIN public.crm_contacts c ON c.id = bc.contact_id
WHERE (
        bc.max_price IS NULL
        OR p_asking_price <= bc.max_price
    ) -- Enforce strict match requirements (e.g. at least 60% match required to surface)
    AND (
        (
            CASE
                WHEN array_length(bc.zip_codes, 1) IS NULL
                OR p_zip_code = ANY(bc.zip_codes)
                OR 'Any' = ANY(bc.zip_codes) THEN 40
                ELSE 0
            END
        ) + (
            CASE
                WHEN bc.min_equity IS NULL
                OR p_equity >= bc.min_equity THEN 30
                ELSE 0
            END
        ) + (
            CASE
                WHEN array_length(bc.property_types, 1) IS NULL
                OR p_property_type = ANY(bc.property_types) THEN 30
                ELSE 0
            END
        )
    ) >= 60
ORDER BY match_score DESC;
END;
$func$ LANGUAGE plpgsql;
RAISE NOTICE 'Successfully crafted get_matching_buyers matching algorithm.';
RAISE NOTICE 'Phase 10 Disposition Automation Migration Complete.';
END $$;