-- ========================================================================================
-- WHOLESALE OS - PHASE 30 TIER-GATED MULTI-PERSONA ECOSYSTEM
-- ========================================================================================
-- This script evolves the Phase 17 SaaS schema into a Tier-Gated Multi-Persona format.
-- RUN THIS ENTIRE SCRIPT IN THE SUPABASE SQL EDITOR.
-- =======================================================
-- 1. ORGANIZATIONS: TIER ENFORCEMENT & SEATS
-- =======================================================
-- Add new columns to organizations to support Team Seats, Status, and Tiers.
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'BASIC' CHECK (subscription_tier IN ('BASIC', 'PRO', 'SUPER')),
    ADD COLUMN IF NOT EXISTS enabled_personas TEXT [] DEFAULT '{"WHOLESALER"}',
    ADD COLUMN IF NOT EXISTS team_seat_limit INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (
        account_status IN ('active', 'suspended', 'terminated', 'past_due')
    );
-- Note: user_organizations table already exists from Phase 17 for binding auth.users to organizations.
-- We will expand its usage by formally adopting the 'role' column values.
-- Add new constraints to user_organizations to restrict roles
ALTER TABLE user_organizations DROP CONSTRAINT IF EXISTS user_organizations_role_check;
ALTER TABLE user_organizations
ADD CONSTRAINT user_organizations_role_check CHECK (role IN ('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'));
-- =======================================================
-- 2. PROFILES: PERSONA ASSIGNMENT
-- =======================================================
-- Ensure the profiles table is fully updated to the massive Phase 30 schema
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    phone TEXT,
    bio TEXT,
    primary_persona TEXT DEFAULT 'WHOLESALER' CHECK (
        primary_persona IN (
            'WHOLESALER',
            'REALTOR',
            'INVESTOR',
            'VIRTUAL_ASSISTANT'
        )
    ),
    allowed_personas TEXT [] DEFAULT '{"WHOLESALER"}',
    default_workspace TEXT DEFAULT 'dashboard',
    target_markets TEXT,
    max_price NUMERIC(15, 2),
    min_roi NUMERIC(5, 2),
    property_types TEXT DEFAULT 'SFR, Small MFR',
    rehab_level TEXT DEFAULT 'Moderate to Full Gut',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Note: The original generic "role" column in the Profile React component maps to "primary_persona" now.
-- =======================================================
-- 3. NEW OPERATIONAL TABLES (CROSS-PERSONA)
-- =======================================================
-- Call Tracking (For VAs & Wholesalers)
CREATE TABLE IF NOT EXISTS call_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    caller_user_id UUID REFERENCES auth.users (id) ON DELETE
    SET NULL,
        call_timestamp TIMESTAMPTZ DEFAULT NOW(),
        call_outcome TEXT CHECK (
            call_outcome IN (
                'No Answer',
                'Interested',
                'Not Interested',
                'Appointment Set',
                'Follow-Up Needed'
            )
        ),
        notes TEXT,
        recording_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Deal Offers (For Investors submitting to Wholesalers)
CREATE TABLE IF NOT EXISTS deal_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    investor_user_id UUID REFERENCES auth.users (id) ON DELETE
    SET NULL,
        offer_amount NUMERIC(15, 2) NOT NULL,
        contingencies TEXT,
        status TEXT DEFAULT 'pending' CHECK (
            status IN ('pending', 'accepted', 'rejected', 'countered')
        ),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Referrals (For Wholesalers referring to Realtors)
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    referred_by_user_id UUID REFERENCES auth.users (id) ON DELETE
    SET NULL,
        referred_to_realtor_id UUID REFERENCES auth.users (id) ON DELETE
    SET NULL,
        referral_fee_pct NUMERIC(5, 2) DEFAULT 25.0,
        status TEXT DEFAULT 'pending' CHECK (
            status IN ('pending', 'accepted', 'denied', 'closed')
        ),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Assignment History (Cross-Persona Analytics)
CREATE TABLE IF NOT EXISTS assignment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    wholesaler_id UUID REFERENCES auth.users (id) ON DELETE
    SET NULL,
        end_buyer_id UUID REFERENCES auth.users (id) ON DELETE
    SET NULL,
        gross_assignment_fee NUMERIC(15, 2),
        closing_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =======================================================
-- 4. MASTER SUPER ADMIN BYPASS HOOK
-- =======================================================
-- This function identifies the unassailable Master Admin.
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$ BEGIN RETURN auth.jwt()->>'email' = 'ronald_lewis_jr@live.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =======================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================
-- Enable RLS on new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;
-- Helper to check if an org is on a sufficient tier (For PRO/SUPER features)
CREATE OR REPLACE FUNCTION is_tier_pro_or_super() RETURNS BOOLEAN AS $$
DECLARE org_tier TEXT;
BEGIN
SELECT subscription_tier INTO org_tier
FROM organizations
WHERE id = get_current_user_org();
RETURN org_tier IN ('PRO', 'SUPER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Profiles Policy
CREATE POLICY "Super Admins can access all profiles" ON profiles FOR ALL USING (is_super_admin());
CREATE POLICY "Users can access profiles in their organization" ON profiles FOR
SELECT USING (
        id IN (
            SELECT user_id
            FROM user_organizations
            WHERE organization_id = get_current_user_org()
        )
    );
CREATE POLICY "Users can update their own profile" ON profiles FOR
UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON profiles FOR
INSERT WITH CHECK (id = auth.uid());
-- Call Tracking Policy (Isolated to Org)
CREATE POLICY "Super Admins can access all call tracking" ON call_tracking FOR ALL USING (is_super_admin());
CREATE POLICY "Tenant Isolation - Call Tracking" ON call_tracking FOR ALL USING (organization_id = get_current_user_org());
-- Deal Offers Policy (Isolated to Org + Requires PRO/SUPER tier to interact)
CREATE POLICY "Super Admins can access all deal offers" ON deal_offers FOR ALL USING (is_super_admin());
CREATE POLICY "Tenant Isolation - Deal Offers" ON deal_offers FOR
SELECT USING (organization_id = get_current_user_org());
CREATE POLICY "Tenant Action - Deal Offers (PRO/SUPER)" ON deal_offers FOR
INSERT WITH CHECK (
        organization_id = get_current_user_org()
        AND is_tier_pro_or_super()
    );
CREATE POLICY "Tenant Action - Deal Offers Update (PRO/SUPER)" ON deal_offers FOR
UPDATE USING (
        organization_id = get_current_user_org()
        AND is_tier_pro_or_super()
    );
-- Referrals Policy (Isolated to Org + Requires PRO/SUPER tier to interact)
CREATE POLICY "Super Admins can access all referrals" ON referrals FOR ALL USING (is_super_admin());
CREATE POLICY "Tenant Isolation - Referrals" ON referrals FOR
SELECT USING (organization_id = get_current_user_org());
CREATE POLICY "Tenant Action - Referrals (PRO/SUPER)" ON referrals FOR
INSERT WITH CHECK (
        organization_id = get_current_user_org()
        AND is_tier_pro_or_super()
    );
CREATE POLICY "Tenant Action - Referrals Update (PRO/SUPER)" ON referrals FOR
UPDATE USING (
        organization_id = get_current_user_org()
        AND is_tier_pro_or_super()
    );
-- Assignment History Policy (Isolated to Org)
CREATE POLICY "Super Admins can access all assignment history" ON assignment_history FOR ALL USING (is_super_admin());
CREATE POLICY "Tenant Isolation - Assignment History" ON assignment_history FOR ALL USING (organization_id = get_current_user_org());
-- Update Existing RLS to allow Super Admin bypass
-- (Assuming get_current_user_org() logic from Phase 17 remains active, we prepend the Super Admin check)
-- Organizations
DROP POLICY IF EXISTS "Users can only see their own organization" ON organizations;
CREATE POLICY "Organizations Access" ON organizations FOR ALL USING (
    is_super_admin()
    OR id = get_current_user_org()
);
-- Leads
DROP POLICY IF EXISTS "Tenant Isolation - Leads" ON leads;
CREATE POLICY "Leads Access" ON leads FOR ALL USING (
    is_super_admin()
    OR organization_id = get_current_user_org()
);
-- Buyers
DROP POLICY IF EXISTS "Tenant Isolation - Buyers" ON buyers;
CREATE POLICY "Buyers Access" ON buyers FOR ALL USING (
    is_super_admin()
    OR organization_id = get_current_user_org()
);
-- Properties
DROP POLICY IF EXISTS "Tenant Isolation - Properties" ON properties;
CREATE POLICY "Properties Access" ON properties FOR ALL USING (
    is_super_admin()
    OR organization_id = get_current_user_org()
);
-- Deals
DROP POLICY IF EXISTS "Tenant Isolation - Deals" ON deals;
CREATE POLICY "Deals Access" ON deals FOR ALL USING (
    is_super_admin()
    OR organization_id = get_current_user_org()
);
-- Documents
DROP POLICY IF EXISTS "Tenant Isolation - Documents" ON documents;
CREATE POLICY "Documents Access" ON documents FOR ALL USING (
    is_super_admin()
    OR organization_id = get_current_user_org()
);
-- Subscriptions
DROP POLICY IF EXISTS "Tenant Isolation - Subscriptions" ON subscriptions;
CREATE POLICY "Subscriptions Access" ON subscriptions FOR ALL USING (
    is_super_admin()
    OR organization_id = get_current_user_org()
);
-- Usage Tracking
DROP POLICY IF EXISTS "Tenant Isolation - Usage" ON usage_tracking;
CREATE POLICY "Usage Tracking Access" ON usage_tracking FOR ALL USING (
    is_super_admin()
    OR organization_id = get_current_user_org()
);