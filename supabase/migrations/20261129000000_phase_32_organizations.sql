-- Migration: Phase 32 Multi-Role Organization System
-- Expand roles in existing tables or create new ones
-- Assuming user_organizations exists from Phase 31.
-- Let's rename user_organizations to organization_members and update the enum.
-- Rename the table if it exists
DO $$ BEGIN IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'user_organizations'
) THEN
ALTER TABLE public.user_organizations
    RENAME TO organization_members;
END IF;
END $$;
-- Drop constraints that might block enum changes
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS user_organizations_role_check;
-- Add checking for new roles
ALTER TABLE public.organization_members
ADD CONSTRAINT organization_members_role_check CHECK (
        role IN (
            'ADMIN',
            'WHOLESALER',
            'INVESTOR',
            'REALTOR',
            'ACQUISITION',
            'DISPOSITION',
            'VIRTUAL_ASSISTANT',
            'TEAM_MEMBER',
            'TITLE_COMPANY'
        )
    );
-- Ensure organizations table has the required fields
-- It should already have name, subscription_tier.
-- We'll rename subscription_tier to subscription_plan or just keep using tier depending on backend (let's use subscription_plan for alignment).
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'FREE';
UPDATE public.organizations
SET subscription_plan = subscription_tier
WHERE subscription_plan = 'FREE'
    AND subscription_tier IS NOT NULL;
-- Update handle_new_user trigger to adapt to new roles
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE v_first_name TEXT;
v_last_name TEXT;
v_company TEXT;
v_persona TEXT;
v_org_id UUID;
BEGIN v_first_name := new.raw_user_meta_data->>'first_name';
v_last_name := new.raw_user_meta_data->>'last_name';
v_company := COALESCE(
    new.raw_user_meta_data->>'company',
    'Personal Sandbox'
);
v_persona := COALESCE(
    new.raw_user_meta_data->>'primary_persona',
    'WHOLESALER'
);
-- Create default organization
INSERT INTO public.organizations (name, subscription_plan, subscription_tier)
VALUES (v_company, 'FREE', 'BASIC')
RETURNING id INTO v_org_id;
-- Insert into profiles
INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        company,
        primary_persona,
        organization_id,
        tier
    )
VALUES (
        new.id,
        COALESCE(v_first_name, ''),
        COALESCE(v_last_name, ''),
        v_company,
        v_persona,
        v_org_id,
        'none'
    );
-- Insert into organization_members using the persona as the role (or admin if no persona)
INSERT INTO public.organization_members (user_id, organization_id, role)
VALUES (new.id, v_org_id, v_persona);
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;