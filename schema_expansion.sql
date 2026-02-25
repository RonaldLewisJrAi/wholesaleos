-- ========================================================================================
-- WHOLESALE OS - PHASE 17 SAAS READINESS SCHEMA EXPANSION
-- ========================================================================================
-- This script transforms the database from a Single-Tenant CRM into a Multi-Tenant SaaS.
-- RUN THIS ENTIRE SCRIPT IN THE SUPABASE SQL EDITOR.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- =======================================================
-- 1. ORGANIZATIONS & TENANT ISOLATION
-- =======================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Binds auth.users to their respective companies/organizations
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);
-- =======================================================
-- 2. SUBSCRIPTIONS, MONETIZATION & USAGE
-- =======================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    tier_name TEXT NOT NULL CHECK (
        tier_name IN ('Starter', 'Pro', 'Elite', 'Enterprise')
    ),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    scraper_pulls_used INT DEFAULT 0,
    sms_sent INT DEFAULT 0,
    emails_sent INT DEFAULT 0,
    billing_period_start TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
-- =======================================================
-- 3. ROLE PERMISSIONS & AUDITING
-- =======================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL CHECK (
        role_name IN (
            'Admin',
            'Acquisition Manager',
            'Disposition Manager',
            'Transaction Coordinator',
            'Viewer'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        action_type TEXT NOT NULL,
        target_table TEXT,
        target_id UUID,
        old_data JSONB,
        new_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =======================================================
-- 4. CRM CORE EXPANSION
-- =======================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    distress_score INT CHECK (
        distress_score >= 0
        AND distress_score <= 100
    ),
    equity_percent NUMERIC(5, 2),
    motivation_level INT CHECK (
        motivation_level >= 1
        AND motivation_level <= 5
    ),
    timeline_to_sell TEXT,
    marketing_source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS buyers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    phone TEXT,
    email TEXT,
    vip_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS buyer_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    preferred_zip_codes TEXT [],
    property_type TEXT [] DEFAULT '{"Single Family"}',
    min_price NUMERIC(15, 2),
    max_price NUMERIC(15, 2),
    min_equity_pct NUMERIC(5, 2),
    preferred_exit_strategy TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE
    SET NULL,
        address TEXT NOT NULL,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        property_type TEXT,
        bedrooms INT,
        bathrooms NUMERIC(3, 1),
        sqft INT,
        year_built INT,
        estimated_value NUMERIC(15, 2),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS deal_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sequence_order INT NOT NULL,
    color_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES deal_stages(id) ON DELETE
    SET NULL,
        lead_id UUID REFERENCES leads(id) ON DELETE
    SET NULL,
        buyer_id UUID REFERENCES buyers(id) ON DELETE
    SET NULL,
        offer_amount NUMERIC(15, 2),
        contract_price NUMERIC(15, 2),
        assignment_fee NUMERIC(15, 2),
        close_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =======================================================
-- 5. COMPLIANCE, OPERATIONS & KPI
-- =======================================================
CREATE TABLE IF NOT EXISTS compliance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    state_code TEXT NOT NULL,
    assignment_legal BOOLEAN DEFAULT TRUE,
    required_disclosures TEXT [],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    document_type TEXT,
    file_url TEXT,
    signed_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS repair_estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    total_estimate NUMERIC(15, 2),
    roof_condition TEXT,
    hvac_condition TEXT,
    plumbing_condition TEXT,
    electrical_condition TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS marketing_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    channel_name TEXT NOT NULL,
    cost_per_month NUMERIC(10, 2),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS kpi_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    snapshot_date DATE DEFAULT CURRENT_DATE,
    total_leads INT DEFAULT 0,
    deals_closed INT DEFAULT 0,
    total_revenue NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =======================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================
-- Enable RLS on all highly sensitive tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- Create helper function to get current user's organization
CREATE OR REPLACE FUNCTION get_current_user_org() RETURNS UUID AS $$
SELECT organization_id
FROM user_organizations
WHERE user_id = auth.uid()
LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
-- Organization access policy
CREATE POLICY "Users can only see their own organization" ON organizations FOR
SELECT USING (id = get_current_user_org());
-- Multi-tenant separation policies based on organization_id
CREATE POLICY "Tenant Isolation - Leads" ON leads FOR ALL USING (organization_id = get_current_user_org());
CREATE POLICY "Tenant Isolation - Buyers" ON buyers FOR ALL USING (organization_id = get_current_user_org());
CREATE POLICY "Tenant Isolation - Properties" ON properties FOR ALL USING (organization_id = get_current_user_org());
CREATE POLICY "Tenant Isolation - Deals" ON deals FOR ALL USING (organization_id = get_current_user_org());
CREATE POLICY "Tenant Isolation - Documents" ON documents FOR ALL USING (organization_id = get_current_user_org());
CREATE POLICY "Tenant Isolation - Audit Logs" ON audit_logs FOR
SELECT USING (organization_id = get_current_user_org());
CREATE POLICY "Tenant Isolation - Subscriptions" ON subscriptions FOR
SELECT USING (organization_id = get_current_user_org());
CREATE POLICY "Tenant Isolation - Usage" ON usage_tracking FOR
SELECT USING (organization_id = get_current_user_org());