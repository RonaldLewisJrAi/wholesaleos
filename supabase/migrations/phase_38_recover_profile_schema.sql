-- Phase 38 Post-Deployment Patch: Recover Missing Columns
-- 1. Rebuild the missing organization_id foreign key linkage
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
-- 2. Ensure system_role is present for Administrative identity checks
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS system_role TEXT DEFAULT 'USER';
-- 3. Force the Supabase PostgREST API to flush its cache and recognize the new columns
NOTIFY pgrst,
'reload schema';