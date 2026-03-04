-- ==============================================================================
-- PHASE 39.1: HARD DATABASE LIMIT ENFORCEMENT (ENTERPRISE LOCK)
-- Objective: Mathematically seal record limits at the PostgreSQL layer
-- using BEFORE INSERT triggers to prevent frontend/API bypass or RLS OR-logic failures.
-- ==============================================================================
-- 1. Hard Trigger Function for LEADS
CREATE OR REPLACE FUNCTION enforce_lead_limit() RETURNS TRIGGER AS $$
DECLARE v_tier text;
v_status text;
v_lead_count integer;
v_jwt_claims jsonb;
v_system_role text;
BEGIN -- [A] Global Super Admin Bypass via JWT Claims
-- Attempt to read claims (will be null if called via service_role without auth impersonation)
v_jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
IF v_jwt_claims IS NOT NULL THEN -- Safely extract system_role whether it is root, app_metadata, or user_metadata
v_system_role := COALESCE(
    v_jwt_claims->>'system_role',
    v_jwt_claims->'app_metadata'->>'system_role',
    v_jwt_claims->'user_metadata'->>'system_role'
);
IF v_system_role = 'GLOBAL_SUPER_ADMIN' THEN RETURN NEW;
-- Immediate Bypass
END IF;
END IF;
-- [B] Fetch Organization Tier
SELECT subscription_tier,
    subscription_status INTO v_tier,
    v_status
FROM public.organizations
WHERE id = NEW.organization_id;
-- If no organization found, or tier is SUPER, they are unlimited.
IF v_tier IS NULL
OR v_tier = 'SUPER' THEN RETURN NEW;
END IF;
-- [C] Transaction-Safe Count (Using explicit lock or standard MVCC BEFORE INSERT)
-- Counting total non-deleted/matching leads for the organization
SELECT count(*) INTO v_lead_count
FROM public.leads
WHERE organization_id = NEW.organization_id;
-- [D] Tier Enforcement Matrix
IF v_tier = 'DEMO' THEN IF v_lead_count >= 25 THEN RAISE EXCEPTION 'Subscription limit reached. Upgrade required.';
END IF;
ELSIF v_tier = 'BASIC' THEN IF v_lead_count >= 50 THEN RAISE EXCEPTION 'Subscription limit reached. Upgrade required.';
END IF;
ELSIF v_tier = 'PRO' THEN IF v_lead_count >= 5000 THEN RAISE EXCEPTION 'Subscription limit reached. Upgrade required.';
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Bind Trigger to Leads
DROP TRIGGER IF EXISTS trg_enforce_lead_limit_strict ON public.leads;
CREATE TRIGGER trg_enforce_lead_limit_strict BEFORE
INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION enforce_lead_limit();
-- 2. Hard Trigger Function for DEALS
CREATE OR REPLACE FUNCTION enforce_deal_limit() RETURNS TRIGGER AS $$
DECLARE v_tier text;
v_status text;
v_deal_count integer;
v_jwt_claims jsonb;
v_system_role text;
BEGIN -- [A] Global Super Admin Bypass via JWT Claims
v_jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
IF v_jwt_claims IS NOT NULL THEN v_system_role := COALESCE(
    v_jwt_claims->>'system_role',
    v_jwt_claims->'app_metadata'->>'system_role',
    v_jwt_claims->'user_metadata'->>'system_role'
);
IF v_system_role = 'GLOBAL_SUPER_ADMIN'
OR public.is_super_admin() THEN RETURN NEW;
-- Immediate Bypass
END IF;
END IF;
-- [B] Fetch Organization Tier
SELECT subscription_tier,
    subscription_status INTO v_tier,
    v_status
FROM public.organizations
WHERE id = NEW.organization_id;
IF v_tier IS NULL
OR v_tier = 'SUPER' THEN RETURN NEW;
END IF;
-- [C] Transaction-Safe Count
SELECT count(*) INTO v_deal_count
FROM public.deals
WHERE organization_id = NEW.organization_id
    AND status != 'Closed';
IF NEW.status != 'Closed' THEN -- [D] Tier Enforcement Matrix
IF v_tier = 'DEMO' THEN IF v_deal_count >= 3 THEN RAISE EXCEPTION 'Subscription limit reached. Upgrade required.';
END IF;
ELSIF v_tier = 'BASIC' THEN IF v_deal_count >= 5 THEN RAISE EXCEPTION 'Subscription limit reached. Upgrade required.';
END IF;
ELSIF v_tier = 'PRO' THEN IF v_deal_count >= 100 THEN RAISE EXCEPTION 'Subscription limit reached. Upgrade required.';
END IF;
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Bind Trigger to Deals
DROP TRIGGER IF EXISTS trg_enforce_deal_limit_strict ON public.deals;
CREATE TRIGGER trg_enforce_deal_limit_strict BEFORE
INSERT ON public.deals FOR EACH ROW EXECUTE FUNCTION enforce_deal_limit();
-- ==============================================================================
-- 3. REMOVE OLD RLS-BASED RECORD LIMITS
-- The hard counts are now strictly enforced via the transaction triggers.
-- Keeping the restrictive RLS constraints breaks the GLOBAL_SUPER_ADMIN bypass.
-- ==============================================================================
DROP POLICY IF EXISTS "Enforce Lead Limit on Insert" ON public.leads;
DROP POLICY IF EXISTS "Enforce Deal Limit on Insert" ON public.deals;
-- Note: "Enforce Spreadsheet Limit on Insert" on staging_lead_imports remains native RLS for now.