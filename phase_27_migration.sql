-- ========================================================================================
-- WHOLESALE OS - PHASE 27: PROPERTY EXCLUSIVITY ENGINE & SUPER ADMIN SETUP
-- ========================================================================================
-- 1. EXPAND PROPERTIES TABLE WITH 30-DAY PIPELINE LOCKS
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS exclusive_locked_by UUID REFERENCES auth.users(id) ON DELETE
SET NULL;
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS exclusive_locked_at TIMESTAMPTZ;
-- 2. HARDCODE RONALD LEWIS JR AS SUPER ADMIN & ELITE TIER
DO $$
DECLARE target_user_id UUID;
target_org_id UUID;
BEGIN -- Attempt to find the user by their email
SELECT id INTO target_user_id
FROM auth.users
WHERE email = 'ronald_lewis_jr@live.com'
LIMIT 1;
IF target_user_id IS NOT NULL THEN -- Find their organization
SELECT organization_id INTO target_org_id
FROM user_organizations
WHERE user_id = target_user_id
LIMIT 1;
-- If user somehow has no organization, create a primary one
IF target_org_id IS NULL THEN
INSERT INTO organizations (name)
VALUES ('Wholesale OS Headquarters')
RETURNING id INTO target_org_id;
INSERT INTO user_organizations (user_id, organization_id, role)
VALUES (target_user_id, target_org_id, 'owner');
END IF;
-- Grant Super Admin / Admin role in the role_permissions table
INSERT INTO role_permissions (organization_id, user_id, role_name)
VALUES (target_org_id, target_user_id, 'Admin') ON CONFLICT (organization_id, user_id) DO
UPDATE
SET role_name = 'Admin';
-- Guarantee Elite Subscription so all paywalls drop
INSERT INTO subscriptions (organization_id, tier_name, status)
VALUES (target_org_id, 'Elite', 'active') ON CONFLICT (organization_id) DO
UPDATE
SET tier_name = 'Elite',
    status = 'active';
END IF;
END $$;