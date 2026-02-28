-- WHOLESALE OS - PHASE 33 IDENTITY, THEMING & SECURITY
-- Expands structural schemas to enforce global theming consistency
-- and mandating Stripe legal TOS verification.
-- 1. Profiles (Identity Enforcements)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark'));
-- 2. Organizations (Legal Stripe Lockouts)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS tos_accepted BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS tos_version TEXT DEFAULT 'v1.0.0';
-- Restrictive RLS Check (Super Admin Bypass or Org Admin Action)
-- No changes to specific table RLS needed here physically as long as application-side middleware handles tos validation.
COMMENT ON COLUMN public.profiles.theme_preference IS 'Stores user specific visual UI theme to override system preferences';
COMMENT ON COLUMN public.organizations.tos_accepted IS 'Mandatory gatekeeper constraint before Stripe integrations can process payments';