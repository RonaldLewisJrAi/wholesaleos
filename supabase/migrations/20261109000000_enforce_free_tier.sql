-- ========================================================================================
-- WHOLESALE OS - SECURE SAAS GATING MIGRATION
-- Enforces a default 'FREE' tier and 'INACTIVE' status for all new organizations.
-- This guarantees that the 'BASIC' tier is treated as a paid product block.
-- ========================================================================================
BEGIN;
-- 1. Drop the existing text check constraint if it explicitly blocks 'FREE'
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;
-- 2. Add the updated text check constraint to explicitly include 'FREE'
ALTER TABLE public.organizations
ADD CONSTRAINT organizations_subscription_tier_check CHECK (
        subscription_tier IN ('FREE', 'BASIC', 'PRO', 'SUPER')
    );
-- 3. Modify the default values of `subscription_tier` and `subscription_status`
ALTER TABLE public.organizations
ALTER COLUMN subscription_tier
SET DEFAULT 'FREE';
ALTER TABLE public.organizations
ALTER COLUMN subscription_status
SET DEFAULT 'INACTIVE';
COMMIT;