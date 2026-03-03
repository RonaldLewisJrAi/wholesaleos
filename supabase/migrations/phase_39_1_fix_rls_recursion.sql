-- ==========================================
-- PHASE 39.1: FIX RLS INFINITE RECURSION
-- Objective: The previous implementation (Phase 38.5)
-- used RLS `WITH CHECK` clauses that queried `SELECT COUNT(*) FROM leads`
-- which triggered infinite recursion because reading `leads` 
-- invokes the RLS read policies recursively during an insert.
-- Fix: Using a SECURITY DEFINER function to bypass RLS for the count check.
-- ==========================================
-- 1. Helper function to safely count leads bypassing RLS
CREATE OR REPLACE FUNCTION get_active_lead_count(org_id uuid) RETURNS integer LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
SELECT count(*)::integer
FROM leads
WHERE organization_id = org_id;
$$;
-- 2. Helper function to safely count active deals bypassing RLS
CREATE OR REPLACE FUNCTION get_active_deal_count(org_id uuid) RETURNS integer LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
SELECT count(*)::integer
FROM deals
WHERE organization_id = org_id
    AND status != 'Closed';
$$;
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