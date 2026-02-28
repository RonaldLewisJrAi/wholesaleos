-- ========================================================================================
-- WHOLESALE OS - PHASE 33.1: SUPER ADMIN ENFORCEMENT
-- ========================================================================================
-- This script hardens the master admin elevation into the database schema directly.
-- RUN THIS SCRIPT IN THE SUPABASE SQL EDITOR.
-- ========================================================================================
DO $$
DECLARE master_admin_email text := 'ronald_lewis_jr@live.com';
master_admin_id uuid;
BEGIN -- 1. Ensure a global role column exists on profiles to completely avoid auth.users modifications
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
-- 2. Find the User ID
SELECT id INTO master_admin_id
FROM auth.users
WHERE email = master_admin_email;
IF master_admin_id IS NULL THEN RAISE NOTICE 'Skipping Database Elevation: Account % not found in auth.users.',
master_admin_email;
RETURN;
END IF;
-- 3. Elevate User Profile to SUPER_ADMIN natively
UPDATE public.profiles
SET system_role = 'SUPER_ADMIN'
WHERE id = master_admin_id;
-- 4. Overwrite any user_organizations role to SUPER_ADMIN
UPDATE public.user_organizations
SET role = 'SUPER_ADMIN'
WHERE user_id = master_admin_id;
RAISE NOTICE 'Success: Elevated % to strict SUPER_ADMIN role in database.',
master_admin_email;
END $$;