-- Phase 60: Developer Sandbox Security Migration
-- Adds explicit role-based access control directly to the authentication profiles.
-- 1. Add column with default
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
-- 2. Restrict to specific roles
-- We use a DO block to safely add the constraint only if it doesn't already exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
) THEN
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check CHECK (
        role IN ('super_admin', 'admin', 'developer', 'user')
    );
END IF;
END $$;
-- 3. Add performance index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);