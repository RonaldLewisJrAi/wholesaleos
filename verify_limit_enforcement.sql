-- ==============================================================================
-- PHASE 39.1: VERIFICATION SCRIPT (Pure PostgreSQL)
-- Simulates 6 inserts for BASIC tier -> Confirms 6th fails
-- Simulates GLOBAL_SUPER_ADMIN insert -> Confirms bypass
-- ==============================================================================
DO $$
DECLARE v_test_org_id uuid;
v_test_user_id uuid := gen_random_uuid();
i integer;
BEGIN RAISE NOTICE '--- Starting Phase 39.1 Limits Verification ---';
-- 1. Setup Test BASIC Organization
INSERT INTO public.organizations (name, subscription_tier, subscription_status)
VALUES ('Audit Test Org', 'BASIC', 'ACTIVE')
RETURNING id INTO v_test_org_id;
RAISE NOTICE 'Created BASIC Tier Org: %',
v_test_org_id;
-- 2. Simulate 5 allowed Deal Inserts
FOR i IN 1..5 LOOP
INSERT INTO public.deals (organization_id, user_id, status)
VALUES (v_test_org_id, v_test_user_id, 'Underwriting');
RAISE NOTICE 'Inserted Deal % (Allowed)',
i;
END LOOP;
-- 3. Simulate 6th Deal Insert (Expect Failure)
BEGIN
INSERT INTO public.deals (organization_id, user_id, status)
VALUES (v_test_org_id, v_test_user_id, 'Underwriting');
RAISE EXCEPTION '❌ FATAL: 6th deal was allowed! Limit enforcement failed.';
EXCEPTION
WHEN OTHERS THEN IF SQLERRM = 'Subscription limit reached. Upgrade required.' THEN RAISE NOTICE '✅ SUCCESS: 6th deal gracefully blocked by Database Trigger.';
ELSE RAISE EXCEPTION '❌ FATAL: Blocked but for wrong reason: %',
SQLERRM;
END IF;
END;
-- 4. Simulate GLOBAL_SUPER_ADMIN Bypass
RAISE NOTICE '--- Testing GLOBAL_SUPER_ADMIN Bypass ---';
-- Set local session variable mocking the JWT claim
PERFORM set_config(
    'request.jwt.claims',
    '{"system_role": "GLOBAL_SUPER_ADMIN"}',
    true
);
BEGIN
INSERT INTO public.deals (organization_id, user_id, status)
VALUES (v_test_org_id, v_test_user_id, 'Underwriting');
RAISE NOTICE '✅ SUCCESS: 6th deal Allowed under GLOBAL_SUPER_ADMIN exception!';
EXCEPTION
WHEN OTHERS THEN RAISE EXCEPTION '❌ FATAL: GLOBAL_SUPER_ADMIN bypass failed! %',
SQLERRM;
END;
-- 5. Cleanup Test Data
DELETE FROM public.organizations
WHERE id = v_test_org_id;
RAISE NOTICE 'Cleanup complete.';
RAISE NOTICE '--- Verification Passed ---';
END;
$$ LANGUAGE plpgsql;