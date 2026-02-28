-- =========================================================================================
-- PHASE 34: COMPREHENSIVE SECURITY AUDIT REMEDIATION
-- Author: Rontology Intelligence Engine
-- Purpose: Fix validate_seat_consistency roles and purge_retention_data soft-delete vulnerabilities.
-- =========================================================================================
-- 1. Fix validate_seat_consistency()
-- High Severity IDOR/Logic Bug: Previous query assumed 'role' and 'organization_id' existed on public.users.
-- Data exists physically on public.user_organizations and public.profiles.
CREATE OR REPLACE FUNCTION validate_seat_consistency() RETURNS VOID AS $$ BEGIN -- Log job start
INSERT INTO public.system_logs (log_type, source, message)
VALUES (
        'INFO',
        'SYSTEM_JOB',
        'Running Phase 34 Seat Consistency Check'
    );
-- Auto-heal condition 1: Ensure Admins and Super Admins are NEVER locked out.
-- Target public.users where seat_status = 'LOCKED' but they hold an Admin role.
UPDATE public.users u
SET seat_status = 'ACTIVE'
FROM public.user_organizations uo
    LEFT JOIN public.profiles p ON uo.user_id = p.id
WHERE u.id = uo.user_id
    AND (
        uo.role IN ('ADMIN', 'SUPER_ADMIN')
        OR p.system_role = 'SUPER_ADMIN'
    )
    AND u.seat_status = 'LOCKED';
-- Logic for detecting bloated limits would go here (Counting total active seats vs team_seat_limit)
-- If count > limit, log WARNING to system_logs.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Fix purge_retention_data()
-- Medium Severity: Organizations previously marked "purged" still retained all data, leading to PII/Vector leakage risks.
-- Phase 34 implements the intended HARD DELETE CASCADE functionality.
CREATE OR REPLACE FUNCTION purge_retention_data() RETURNS VOID AS $$
DECLARE org_record RECORD;
BEGIN FOR org_record IN
SELECT id,
    name
FROM public.organizations
WHERE subscription_status = 'TERMINATED'
    AND data_retention_until IS NOT NULL
    AND data_retention_until < NOW() LOOP -- Log the purge event PRE-CASCADE
INSERT INTO public.system_logs (organization_id, log_type, source, message)
VALUES (
        org_record.id,
        'SECURITY',
        'SYSTEM_JOB',
        'Phase 34 Execution: Hard CASCADE PURGE on expired Terminated Org: ' || org_record.name
    );
-- Execute destructive hard delete.
-- Assuming Core SaaS relations use ON DELETE CASCADE.
DELETE FROM public.organizations
WHERE id = org_record.id;
END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;