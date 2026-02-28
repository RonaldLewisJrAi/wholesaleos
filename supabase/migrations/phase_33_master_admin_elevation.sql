-- ========================================================================================
-- WHOLESALE OS - PHASE 33: NATIVE GOD-MODE ELEVATION
-- ========================================================================================
-- This script natively elevates a specified user's organization and profile to unlock all
-- tiers and Personas, granting them unrestricted access to the Admin Dashboard.
-- RUN THIS SCRIPT IN THE SUPABASE SQL EDITOR.
-- ========================================================================================
DO $$
DECLARE master_admin_email text := 'ronald_lewis_jr@live.com';
master_admin_id uuid;
target_org_id uuid;
BEGIN -- 1. Modify Schema Constraints to allow 'ADMIN' natively in primary_persona
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_primary_persona_check;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_primary_persona_check CHECK (
        primary_persona IN (
            'WHOLESALER',
            'REALTOR',
            'INVESTOR',
            'VIRTUAL_ASSISTANT',
            'ADMIN'
        )
    );
-- 2. Find the User ID in auth.users
SELECT id INTO master_admin_id
FROM auth.users
WHERE email = master_admin_email;
IF master_admin_id IS NULL THEN RAISE NOTICE 'Skipping Database Elevation: Account % not found in auth.users.',
master_admin_email;
RETURN;
END IF;
-- 3. Find the Primary Organization for this user
SELECT organization_id INTO target_org_id
FROM public.user_organizations
WHERE user_id = master_admin_id
LIMIT 1;
-- 4. Elevate Organization Tier to SUPER
IF target_org_id IS NOT NULL THEN
UPDATE public.organizations
SET subscription_tier = 'SUPER',
    enabled_personas = ARRAY ['WHOLESALER', 'INVESTOR', 'REALTOR', 'VIRTUAL_ASSISTANT', 'ADMIN']::text []
WHERE id = target_org_id;
RAISE NOTICE 'Success: Elevated Organization % to SUPER tier with ALL personas.',
target_org_id;
END IF;
-- 5. Elevate User Profile to God-Mode
UPDATE public.profiles
SET primary_persona = 'ADMIN',
    allowed_personas = ARRAY ['WHOLESALER', 'INVESTOR', 'REALTOR', 'VIRTUAL_ASSISTANT', 'ADMIN']::text []
WHERE id = master_admin_id;
-- Ensure they are flagged as an ADMIN natively in their Org Role
UPDATE public.user_organizations
SET role = 'ADMIN'
WHERE user_id = master_admin_id;
RAISE NOTICE 'Success: Elevated User Profile % to God-Mode.',
master_admin_email;
END $$;