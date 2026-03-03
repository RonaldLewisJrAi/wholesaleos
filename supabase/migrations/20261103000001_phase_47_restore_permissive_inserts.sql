-- ==============================================================================
-- PHASE 47: RESTORE PERMISSIVE INSERTS
-- Objective: When moving the tier limit checks to `AS RESTRICTIVE`, the tables
-- might have lost their only `PERMISSIVE` policies (acting as default denying all).
-- We must ensure there is a foundational `PERMISSIVE` grant for users so the
-- restrictive limits can securely act as an `AND` filter on top.
-- ==============================================================================
-- 1. Leads
DROP POLICY IF EXISTS "Users can insert leads for their org" ON leads;
CREATE POLICY "Users can insert leads for their org" ON leads AS PERMISSIVE FOR
INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR organization_id IN (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );
-- 2. Deals
DROP POLICY IF EXISTS "Users can insert deals for their org" ON deals;
CREATE POLICY "Users can insert deals for their org" ON deals AS PERMISSIVE FOR
INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR organization_id IN (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );
-- 3. Staging Lead Imports
DROP POLICY IF EXISTS "Users can insert staging imports" ON staging_lead_imports;
CREATE POLICY "Users can insert staging imports" ON staging_lead_imports AS PERMISSIVE FOR
INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR organization_id IN (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );