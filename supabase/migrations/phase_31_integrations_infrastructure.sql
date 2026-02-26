-- ========================================================================================
-- WHOLESALE OS - PHASE 31 INTEGRATION & EXTENSIBILITY INFRASTRUCTURE
-- ========================================================================================
-- This script prepares the Wholesale OS database for extensive third-party integration,
-- outbound webhooks, Open API access, and granular feature flags.
-- RUN THIS ENTIRE SCRIPT IN THE SUPABASE SQL EDITOR.
-- =======================================================
-- 1. ENUMS FOR STANDARDIZATION
-- =======================================================
-- Define specific types of acceptable integrations to prevent garbage data
DO $$ BEGIN CREATE TYPE integration_type AS ENUM (
    'TWILIO',
    'SENDGRID',
    'ZAPIER',
    'WEBHOOK',
    'STRIPE_EXTENDED',
    'SLACK',
    'DIALER',
    'MLS',
    'CUSTOM_API'
);
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN CREATE TYPE integration_status AS ENUM ('ACTIVE', 'DISABLED', 'ERROR');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- =======================================================
-- 2. CORE INTEGRATION REGISTRY
-- =======================================================
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type integration_type NOT NULL,
    status integration_status DEFAULT 'DISABLED',
    config JSONB,
    -- Secure configuration (tokens, webhooks, auth parameters)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, type) -- Typically only 1 integration type active per org
);
-- Logging table for integration events (e.g. webhook payloads sent out)
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload_snapshot JSONB,
    status TEXT CHECK (status IN ('SUCCESS', 'FAILED')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =======================================================
-- 3. OPEN API CREDENTIALS
-- =======================================================
-- We let node/vercel handle the hashing before inserting to keep DB simple.
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    prefix TEXT,
    -- First few chars for UI identification e.g. "whos_abc..."
    created_by UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
        permissions TEXT [] DEFAULT '{"read_only"}',
        last_used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =======================================================
-- 4. FEATURE FLAGS (SCRAPER ISOLATION & GLOBAL TOGGLES)
-- =======================================================
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    flag_name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, flag_name)
);
-- Seed universal flags across Orgs (Disabled for BASIC by default, logic handled at runtime)
-- enable_scraper
-- enable_webhooks
-- enable_api
-- =======================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
-- Helper Function Re-declared for context
CREATE OR REPLACE FUNCTION get_current_user_org() RETURNS UUID AS $$
SELECT organization_id
FROM user_organizations
WHERE user_id = auth.uid()
LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
-- Roles Helper Function
CREATE OR REPLACE FUNCTION is_org_admin() RETURNS BOOLEAN AS $$
DECLARE user_role TEXT;
BEGIN
SELECT role INTO user_role
FROM user_organizations
WHERE user_id = auth.uid()
    AND organization_id = get_current_user_org();
RETURN user_role = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Integrations Policy (Super Admins, or Org Admins)
CREATE POLICY "Super Admins can access all integrations" ON integrations FOR ALL USING (is_super_admin());
CREATE POLICY "Org Admins can view configurations" ON integrations FOR
SELECT USING (
        organization_id = get_current_user_org()
        AND is_org_admin()
    );
CREATE POLICY "Org Admins can manage configurations" ON integrations FOR ALL USING (
    organization_id = get_current_user_org()
    AND is_org_admin()
);
-- Integration Logs Policy (Isolated to Org)
CREATE POLICY "Super Admins can access all logs" ON integration_logs FOR ALL USING (is_super_admin());
CREATE POLICY "Tenant Isolation - Integration Logs" ON integration_logs FOR
SELECT USING (
        organization_id = get_current_user_org()
        AND is_org_admin()
    );
-- System should insert, but if done client-side, restrict to Orgs
CREATE POLICY "Tenant Action - Integration Logs" ON integration_logs FOR
INSERT WITH CHECK (organization_id = get_current_user_org());
-- API Keys Policy (Super Admins, or Org Admins)
CREATE POLICY "Super Admins can access all api keys" ON api_keys FOR ALL USING (is_super_admin());
CREATE POLICY "Org Admins can view keys" ON api_keys FOR
SELECT USING (
        organization_id = get_current_user_org()
        AND is_org_admin()
    );
CREATE POLICY "Org Admins can manage keys" ON api_keys FOR ALL USING (
    organization_id = get_current_user_org()
    AND is_org_admin()
);
-- Feature Flags Policy (Super Admins overwrite, Org Admins read)
CREATE POLICY "Super Admins can access all feature flags" ON feature_flags FOR ALL USING (is_super_admin());
CREATE POLICY "Users can view feature flags" ON feature_flags FOR
SELECT USING (organization_id = get_current_user_org());
-- ONLY Super Admins can toggle structural feature flags to protect infrastructure
CREATE POLICY "Only Super Admins can update feature flags" ON feature_flags FOR
UPDATE USING (is_super_admin());
CREATE POLICY "Only Super Admins can insert feature flags" ON feature_flags FOR
INSERT WITH CHECK (is_super_admin());