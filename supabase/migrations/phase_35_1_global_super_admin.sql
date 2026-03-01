-- ========================================================================================
-- WHOLESALE OS - PHASE 35.4: GLOBAL SUPER ADMIN & RLS BYPASS
-- ========================================================================================
-- This script hardens the GLOBAL_SUPER_ADMIN system role and grants global RLS bypasses.
-- RUN THIS SCRIPT IN THE SUPABASE SQL EDITOR.
-- ========================================================================================
DO $$
DECLARE master_admin_email text := 'ronald_lewis_jr@live.com';
master_admin_id uuid;
BEGIN -- 1. Ensure system_role column exists on profiles
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'system_role'
) THEN
ALTER TABLE public.profiles
ADD COLUMN system_role text DEFAULT 'USER';
END IF;
-- 2. Find the User ID for the target Global Super Admin
SELECT id INTO master_admin_id
FROM auth.users
WHERE email = master_admin_email;
IF master_admin_id IS NULL THEN RAISE NOTICE 'Skipping Database Elevation: Account % not found in auth.users.',
master_admin_email;
ELSE -- 3. Elevate User Profile to GLOBAL_SUPER_ADMIN natively
UPDATE public.profiles
SET system_role = 'GLOBAL_SUPER_ADMIN'
WHERE id = master_admin_id;
-- 4. Overwrite any user_organizations role to GLOBAL_SUPER_ADMIN, just in case they are tied to an org
UPDATE public.user_organizations
SET role = 'GLOBAL_SUPER_ADMIN'
WHERE user_id = master_admin_id;
RAISE NOTICE 'Success: Elevated % to strict GLOBAL_SUPER_ADMIN role in database.',
master_admin_email;
END IF;
END $$;
-- 5. Modify RLS Policies to bypass constraints if role == GLOBAL_SUPER_ADMIN
-- We will create a helper function to easily check if the current user is a GLOBAL_SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND system_role = 'GLOBAL_SUPER_ADMIN'
    );
$$;
-- Apply bypasses to organizations
DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;
CREATE POLICY "Users can view their own organizations" ON public.organizations FOR
SELECT USING (
        id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR public.is_super_admin()
    );
-- Apply bypasses to user_organizations
DROP POLICY IF EXISTS "Users can view their own org memberships" ON public.user_organizations;
CREATE POLICY "Users can view their own org memberships" ON public.user_organizations FOR
SELECT USING (
        user_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR public.is_super_admin()
    );
-- Apply bypasses to deals
DROP POLICY IF EXISTS "Users can view their own organization's deals" ON public.deals;
CREATE POLICY "Users can view their own organization's deals" ON public.deals FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR public.is_super_admin()
    );
-- Apply bypasses to leads
DROP POLICY IF EXISTS "Users can view their own organization's leads" ON public.leads;
CREATE POLICY "Users can view their own organization's leads" ON public.leads FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR public.is_super_admin()
    );
-- Apply bypasses to activity_logs
DROP POLICY IF EXISTS "Users can view their org logs" ON public.activity_logs;
CREATE POLICY "Users can view their org logs" ON public.activity_logs FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR public.is_super_admin()
    );
-- 6. Create Super Admin Audit Log Table
CREATE TABLE IF NOT EXISTS public.super_admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES auth.users(id) NOT NULL,
    action_type text NOT NULL,
    target_resource text,
    target_id uuid,
    details jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Only Super Admins can insert into this log, NO ONE can delete or update
ALTER TABLE public.super_admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super Admins can insert audit logs" ON public.super_admin_audit_logs FOR
INSERT WITH CHECK (public.is_super_admin());
CREATE POLICY "Super Admins can view audit logs" ON public.super_admin_audit_logs FOR
SELECT USING (public.is_super_admin());
-- Revoke all update/delete privileges
REVOKE
UPDATE,
    DELETE ON public.super_admin_audit_logs
FROM authenticated,
    anon,
    public;
-- Ensure hard lockout triggers and MFA flags are represented (assumes standard auth.users modifications or app-level handling)
-- 7. Overwrite Persona Immutability Trigger from Phase 36 to remove string-based email check
CREATE OR REPLACE FUNCTION public.enforce_persona_immutability() RETURNS TRIGGER AS $$
DECLARE is_admin BOOLEAN := FALSE;
jwt_role TEXT;
BEGIN -- Only trigger validation if the primary_persona is actually being changed
IF NEW.primary_persona IS DISTINCT
FROM OLD.primary_persona THEN -- Check if it's the service_role (backend bypass)
    BEGIN jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
EXCEPTION
WHEN OTHERS THEN jwt_role := NULL;
END;
IF jwt_role = 'service_role' THEN is_admin := TRUE;
ELSE -- Check if the executing user is a Global Super Admin or Org Admin natively
SELECT EXISTS (
        SELECT 1
        FROM auth.users u
            LEFT JOIN public.user_organizations uo ON u.id = uo.user_id
            LEFT JOIN public.profiles p ON p.id = u.id
        WHERE u.id = auth.uid()
            AND (
                p.system_role = 'GLOBAL_SUPER_ADMIN'
                OR uo.role = 'ADMIN'
            )
    ) INTO is_admin;
END IF;
-- If not an admin, block the mutation
IF NOT is_admin THEN RAISE EXCEPTION 'Persona Violation: Only Organization Admins or System Admins can modify a user persona.';
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ========================================================================================
-- PART 4: SUPER ADMIN HARDENING (MFA / AAL2 & AUDIT LOG RPC)
-- ========================================================================================
-- Create a helper function to strictly verify if the session has MFA (AAL2) enabled.
CREATE OR REPLACE FUNCTION public.require_super_admin_mfa() RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
SELECT public.is_super_admin()
    AND (auth.jwt()->>'aal' = 'aal2');
$$;
-- Build a Secure RPC for the frontend to record Super Admin actions
-- This forces the audit log to be immutable and securely attributed.
CREATE OR REPLACE FUNCTION public.log_super_admin_action(
        action_type text,
        target_resource text,
        target_id uuid,
        details jsonb
    ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN -- 1. Ensure the user is a Super Admin
    IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Unauthorized: Only Global Super Admins can log administrative actions.';
END IF;
-- 2. Strictly enforce AAL2 (MFA) for high-risk actions
IF (auth.jwt()->>'aal' != 'aal2') THEN -- Allow login audit without MFA, but block mutating actions
IF action_type != 'GLOBAL_SUPER_ADMIN_LOGIN_ATTEMPT'
AND action_type != 'GLOBAL_SUPER_ADMIN_SESSION_START' THEN RAISE EXCEPTION 'Security Violation: Multi-Factor Authentication (AAL2) is required for Super Admin operations.';
END IF;
END IF;
-- 3. Insert the immutable log
INSERT INTO public.super_admin_audit_logs (
        admin_id,
        action_type,
        target_resource,
        target_id,
        details,
        ip_address
    )
VALUES (
        auth.uid(),
        action_type,
        target_resource,
        target_id,
        details,
        current_setting('request.headers', true)::json->>'x-forwarded-for' -- Capture IP
    );
END;
$$;