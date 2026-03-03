-- Phase 38 Post-Deployment Patch: Recover Missing 'role' Column
-- 1. Add the role column for organizational hierarchy (Owner, Admin, Member, etc).
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'MEMBER';
-- 2. Force the Supabase PostgREST API to flush its cache and recognize the new column
NOTIFY pgrst,
'reload schema';