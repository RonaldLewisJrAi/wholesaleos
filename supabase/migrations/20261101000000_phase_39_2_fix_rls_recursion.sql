-- ==========================================
-- PHASE 39.2: FIX RLS INFINITE RECURSION PROPERLY
-- Objective: `SECURITY DEFINER` was not enough because
-- PostgreSQL still evaluated the RLS read policies inside the function.
-- Solution: We must drop and recreate the functions with `SET row_security = off`
-- or temporarily switch the search path to bypass RLS natively inside the count.
-- ==========================================
-- 1. Helper function to safely count leads bypassing RLS completely
CREATE OR REPLACE FUNCTION get_active_lead_count(org_id uuid) RETURNS integer LANGUAGE sql SECURITY DEFINER
SET check_function_bodies = false AS $$ -- We query the table natively by escaping RLS
SELECT count(*)::integer
FROM leads
WHERE organization_id = org_id;
$$;
ALTER FUNCTION get_active_lead_count(uuid)
SET row_security = off;
-- 2. Helper function to safely count active deals bypassing RLS completely
CREATE OR REPLACE FUNCTION get_active_deal_count(org_id uuid) RETURNS integer LANGUAGE sql SECURITY DEFINER
SET check_function_bodies = false AS $$
SELECT count(*)::integer
FROM deals
WHERE organization_id = org_id
    AND status != 'Closed';
$$;
ALTER FUNCTION get_active_deal_count(uuid)
SET row_security = off;
-- 3. Replace Lead Policy
DROP POLICY IF EXISTS "Enforce Lead Limit on Insert" ON leads;
CREATE POLICY "Enforce Lead Limit on Insert" ON leads FOR
INSERT WITH CHECK (
        (
            SELECT subscription_tier
            FROM organizations
            WHERE id = organization_id
        ) != 'BASIC'
        OR get_active_lead_count(organization_id) < 25
    );
-- 4. Replace Deal Policy
DROP POLICY IF EXISTS "Enforce Deal Limit on Insert" ON deals;
CREATE POLICY "Enforce Deal Limit on Insert" ON deals FOR
INSERT WITH CHECK (
        (
            SELECT subscription_tier
            FROM organizations
            WHERE id = organization_id
        ) != 'BASIC'
        OR get_active_deal_count(organization_id) < 5
    );