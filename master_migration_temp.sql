-- ========================================================================================
-- WHOLESALE OS - MASTER MIGRATION (PHASES 17 TO 32)
-- ========================================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- =======================================================
-- PHASE 17
-- =======================================================
-- Ensure public.users exists to map auth.users securely
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);
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
-- PHASE 30
-- =======================================================
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'BASIC' CHECK (subscription_tier IN ('BASIC', 'PRO', 'SUPER')),
    ADD COLUMN IF NOT EXISTS enabled_personas TEXT [] DEFAULT '{"WHOLESALER"}',
    ADD COLUMN IF NOT EXISTS team_seat_limit INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (
        account_status IN ('active', 'suspended', 'terminated', 'past_due')
    );
ALTER TABLE user_organizations DROP CONSTRAINT IF EXISTS user_organizations_role_check;
ALTER TABLE user_organizations
ADD CONSTRAINT user_organizations_role_check CHECK (role IN ('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'));
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS call_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    caller_user_id UUID REFERENCES auth.users(id) ON DELETE
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
CREATE TABLE IF NOT EXISTS deal_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    investor_user_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        offer_amount NUMERIC(15, 2) NOT NULL,
        contingencies TEXT,
        status TEXT DEFAULT 'pending' CHECK (
            status IN ('pending', 'accepted', 'rejected', 'countered')
        ),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    referred_by_user_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        referred_to_realtor_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        referral_fee_pct NUMERIC(5, 2) DEFAULT 25.0,
        status TEXT DEFAULT 'pending' CHECK (
            status IN ('pending', 'accepted', 'denied', 'closed')
        ),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS assignment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    wholesaler_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        end_buyer_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        gross_assignment_fee NUMERIC(15, 2),
        closing_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =======================================================
-- PHASE 31
-- =======================================================
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
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type integration_type NOT NULL,
    status integration_status DEFAULT 'DISABLED',
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, type)
);
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
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    prefix TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
        permissions TEXT [] DEFAULT '{"read_only"}',
        last_used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    flag_name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, flag_name)
);
-- =======================================================
-- PHASE 31.5
-- =======================================================
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'subscription_status_enum'
) THEN CREATE TYPE subscription_status_enum AS ENUM (
    'ACTIVE',
    'GRACE_PERIOD',
    'PAST_DUE',
    'PAUSED',
    'CANCELED',
    'TERMINATED'
);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'seat_status_enum'
) THEN CREATE TYPE seat_status_enum AS ENUM ('ACTIVE', 'LOCKED');
END IF;
END $$;
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS subscription_status subscription_status_enum NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS pause_requested_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ;
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS seat_status seat_status_enum NOT NULL DEFAULT 'ACTIVE';
-- =======================================================
-- PHASE 32
-- =======================================================
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.stripe_event_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    organization_id UUID,
    payload JSONB NOT NULL,
    error_msg TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS pending_subscription_change BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    log_type TEXT NOT NULL CHECK (
        log_type IN ('INFO', 'WARNING', 'ERROR', 'SECURITY')
    ),
    source TEXT NOT NULL CHECK (
        source IN (
            'STRIPE',
            'WEBHOOK',
            'API',
            'SCRAPER',
            'AUTH',
            'INTEGRATION',
            'SYSTEM_JOB'
        )
    ),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.feature_flag_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    flag_name TEXT NOT NULL,
    old_value BOOLEAN,
    new_value BOOLEAN NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.integration_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL,
    monthly_limit INT NOT NULL DEFAULT 1000,
    current_usage INT NOT NULL DEFAULT 0,
    reset_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT unique_org_integration UNIQUE(organization_id, integration_type)
);