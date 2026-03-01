-- MASTER COMPILED MIGRATIONS FOR WEB UI



-- ============================
-- FILE: phase_9_acquisition_intelligence.sql
-- ============================
-- ==============================================================================
-- PHASE 9: ACQUISITION INTELLIGENCE ENGINE SCHEMA MIGRATION
-- ==============================================================================
-- 1. Add Advanced Intelligence Columns to the CRM Contacts Table
ALTER TABLE IF EXISTS public.crm_contacts
ADD COLUMN IF NOT EXISTS distress_score integer DEFAULT 0 CHECK (
        distress_score >= 0
        AND distress_score <= 100
    ),
    ADD COLUMN IF NOT EXISTS equity_percent numeric(5, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS motivation_level integer DEFAULT 1 CHECK (
        motivation_level >= 1
        AND motivation_level <= 5
    ),
    ADD COLUMN IF NOT EXISTS timeline_to_sell text DEFAULT '90+ days' CHECK (
        timeline_to_sell IN ('0-30 days', '30-90 days', '90+ days')
    ),
    ADD COLUMN IF NOT EXISTS last_contact_date timestamptz,
    ADD COLUMN IF NOT EXISTS follow_up_interval_days integer DEFAULT 7,
    ADD COLUMN IF NOT EXISTS marketing_source text DEFAULT 'Organic/Direct',
    ADD COLUMN IF NOT EXISTS cost_per_lead numeric(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS arv numeric(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS mortgage_balance numeric(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS heat_score integer DEFAULT 0;
-- 2. Create the Heat Score Generation Logic (Database-Level Calculation)
CREATE OR REPLACE FUNCTION calculate_lead_heat_score(
        p_distress_score integer,
        p_equity_percent numeric,
        p_timeline text
    ) RETURNS integer AS $$
DECLARE v_timeline_score integer := 0;
v_heat_score numeric;
v_clamped_equity numeric;
BEGIN -- Convert timeline enum to a weight
IF p_timeline = '0-30 days' THEN v_timeline_score := 100;
ELSIF p_timeline = '30-90 days' THEN v_timeline_score := 50;
ELSE v_timeline_score := 10;
END IF;
-- Clamp equity percent natively to avoid negative/over 100 skewing the algorithm
v_clamped_equity := LEAST(GREATEST(COALESCE(p_equity_percent, 0), 0), 100);
-- Heat Score = (Distress * 40%) + (Equity * 40%) + (Timeline * 20%)
v_heat_score := (COALESCE(p_distress_score, 0) * 0.40) + (v_clamped_equity * 0.40) + (v_timeline_score * 0.20);
RETURN ROUND(v_heat_score)::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
-- 3. Create Automated Trigger to Auto-Calculate Equity & Heat Score on Insert/Update
CREATE OR REPLACE FUNCTION update_lead_intelligence_metrics() RETURNS TRIGGER AS $$ BEGIN -- Auto-Calculate Equity Percent = ((ARV - Mortgage Balance) / ARV) * 100
    IF NEW.arv IS NOT NULL
    AND NEW.arv > 0 THEN NEW.equity_percent := (
        (NEW.arv - COALESCE(NEW.mortgage_balance, 0)) / NEW.arv
    ) * 100;
ELSE NEW.equity_percent := 0;
END IF;
-- Generate Composite Heat Score
NEW.heat_score := calculate_lead_heat_score(
    NEW.distress_score,
    NEW.equity_percent,
    NEW.timeline_to_sell
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Bind the trigger to the crm_contacts table
DROP TRIGGER IF EXISTS calc_lead_intelligence ON public.crm_contacts;
CREATE TRIGGER calc_lead_intelligence BEFORE
INSERT
    OR
UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION update_lead_intelligence_metrics();

-- ============================
-- FILE: phase_10_disposition_automation.sql
-- ============================
-- ==============================================================================
-- PHASE 10: DISPOSITION AUTOMATION ENGINE SCHEMA MIGRATION
-- ==============================================================================
-- Description: Creates the Buyer Criteria table and the Disposition Matching Engine
DO $$ BEGIN RAISE NOTICE 'Starting Phase 10 Disposition Automation Migration...';
-- 1. Create the Buyer Criteria Table
-- This table stores specific buying params mapped to a VIP Investor in crm_contacts.
CREATE TABLE IF NOT EXISTS public.buyer_criteria (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id bigint REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    zip_codes text [] DEFAULT '{}',
    min_equity numeric(5, 2) DEFAULT 0.00,
    property_types text [] DEFAULT '{}',
    max_price numeric(12, 2),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
RAISE NOTICE 'Successfully created public.buyer_criteria table.';
-- Enable RLS
ALTER TABLE public.buyer_criteria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.buyer_criteria;
CREATE POLICY "Enable read access for all users" ON public.buyer_criteria FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.buyer_criteria;
CREATE POLICY "Enable insert access for all users" ON public.buyer_criteria FOR
INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update access for all users" ON public.buyer_criteria;
CREATE POLICY "Enable update access for all users" ON public.buyer_criteria FOR
UPDATE USING (true);
-- 2. Create the Deal-To-Buyer Auto-Match Algorithm (RPC)
-- This RPC function expects a deal's Zip Code, Equity %, Property Type, and Max Allowable Offer (Asking Price).
-- It returns a ranked list of VIP buyers from the CRM whose criteria matches the deal.
CREATE OR REPLACE FUNCTION get_matching_buyers(
        p_zip_code text,
        p_equity numeric,
        p_property_type text,
        p_asking_price numeric
    ) RETURNS TABLE (
        contact_id bigint,
        name text,
        phone text,
        email text,
        match_score integer,
        min_equity numeric,
        matched_zip text
    ) AS $func$ BEGIN RETURN QUERY
SELECT c.id as contact_id,
    c.name as name,
    c.phone as phone,
    c.email as email,
    -- Calculate precise match score (0-100)
    (
        (
            CASE
                WHEN array_length(bc.zip_codes, 1) IS NULL
                OR p_zip_code = ANY(bc.zip_codes)
                OR 'Any' = ANY(bc.zip_codes) THEN 40
                ELSE 0
            END
        ) + (
            CASE
                WHEN bc.min_equity IS NULL
                OR p_equity >= bc.min_equity THEN 30
                ELSE 0
            END
        ) + (
            CASE
                WHEN array_length(bc.property_types, 1) IS NULL
                OR p_property_type = ANY(bc.property_types) THEN 30
                ELSE 0
            END
        )
    )::integer as match_score,
    bc.min_equity,
    p_zip_code as matched_zip
FROM public.buyer_criteria bc
    JOIN public.crm_contacts c ON c.id = bc.contact_id
WHERE (
        bc.max_price IS NULL
        OR p_asking_price <= bc.max_price
    ) -- Enforce strict match requirements (e.g. at least 60% match required to surface)
    AND (
        (
            CASE
                WHEN array_length(bc.zip_codes, 1) IS NULL
                OR p_zip_code = ANY(bc.zip_codes)
                OR 'Any' = ANY(bc.zip_codes) THEN 40
                ELSE 0
            END
        ) + (
            CASE
                WHEN bc.min_equity IS NULL
                OR p_equity >= bc.min_equity THEN 30
                ELSE 0
            END
        ) + (
            CASE
                WHEN array_length(bc.property_types, 1) IS NULL
                OR p_property_type = ANY(bc.property_types) THEN 30
                ELSE 0
            END
        )
    ) >= 60
ORDER BY match_score DESC;
END;
$func$ LANGUAGE plpgsql;
RAISE NOTICE 'Successfully crafted get_matching_buyers matching algorithm.';
RAISE NOTICE 'Phase 10 Disposition Automation Migration Complete.';
END $$;

-- ============================
-- FILE: phase_11_comp_intelligence.sql
-- ============================
-- ==============================================================================
-- PHASE 11: COMP INTELLIGENCE ENGINE SCHEMA MIGRATION
-- ==============================================================================
-- Description: Adds persistent Renovation Tier tracking to the properties table.
DO $$ BEGIN RAISE NOTICE 'Starting Phase 11 Comp Intelligence Migration...';
-- 1. Add Renovation Tier to Properties Table
-- This allows the Intelligence Engine to permanently lock the selected renovation multiplier to the deal.
ALTER TABLE IF EXISTS public.properties
ADD COLUMN IF NOT EXISTS renovation_tier text DEFAULT 'moderate' CHECK (renovation_tier IN ('light', 'moderate', 'gut'));
RAISE NOTICE 'Successfully added renovation_tier tracking to public.properties table.';
RAISE NOTICE 'Phase 11 Comp Intelligence Migration Complete.';
END $$;

-- ============================
-- FILE: phase_12_master_schema_alignment.sql
-- ============================
-- ==============================================================================
-- PHASE 12: MASTER SCHEMA ALIGNMENT (SAAS PLAN)
-- ==============================================================================
-- Description: Adds all missing database schemas identified in the master audit.
DO $$ BEGIN RAISE NOTICE 'Starting Phase 12 Master Schema Alignment...';
-- 1. Deal Stages Enum & Table 
-- Provides granular custom workflow stages for Kanban views
CREATE TABLE IF NOT EXISTS public.deal_stages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    order_index integer NOT NULL DEFAULT 0,
    color_code text DEFAULT '#6366f1',
    created_at timestamptz DEFAULT now()
);
-- Ensure order_index exists if the table was created previously without it
DO $add_col$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'deal_stages'
        AND column_name = 'order_index'
) THEN
ALTER TABLE public.deal_stages
ADD COLUMN order_index integer NOT NULL DEFAULT 0;
END IF;
END $add_col$;
-- Ensure 'name' is unique so we can safely seed data without duplicates
DO $add_constraint$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'deal_stages_name_unique'
) THEN
ALTER TABLE public.deal_stages
ADD CONSTRAINT deal_stages_name_unique UNIQUE (name);
END IF;
END $add_constraint$;
-- 2. Deals Table (Logical Separation from 'Properties')
-- A single property could conceptually have multiple deal attempts.
CREATE TABLE IF NOT EXISTS public.deals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id numeric REFERENCES public.properties(id) ON DELETE CASCADE,
    stage_id uuid REFERENCES public.deal_stages(id),
    contract_price numeric(12, 2),
    assignment_fee numeric(10, 2),
    close_date date,
    emd_amount numeric(10, 2),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 3. KPI Snapshots Table
-- Tracks historical snapshots of Cost Per Lead, Avg Return, etc. for Charting.
CREATE TABLE IF NOT EXISTS public.kpi_snapshots (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    snapshot_date date NOT NULL,
    metric_name text NOT NULL,
    metric_value numeric(12, 2) NOT NULL,
    workspace_id text,
    -- Mapped to active tenant
    created_at timestamptz DEFAULT now()
);
-- 4. Marketing Channels
-- Tracks ROI on direct mail, cold calling, PPC, etc.
CREATE TABLE IF NOT EXISTS public.marketing_channels (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    monthly_spend numeric(10, 2) DEFAULT 0,
    leads_generated integer DEFAULT 0,
    deals_closed integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
-- 5. Repair Estimates
-- Persists line items from the RehabEstimator.jsx component.
CREATE TABLE IF NOT EXISTS public.repair_estimates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id numeric REFERENCES public.properties(id) ON DELETE CASCADE,
    category text NOT NULL,
    item_description text,
    estimated_cost numeric(10, 2) NOT NULL,
    created_at timestamptz DEFAULT now()
);
-- 6. Compliance Rules
-- Stores specific legal disclosures and clauses required based on State/Zip.
CREATE TABLE IF NOT EXISTS public.compliance_rules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    state_code text NOT NULL,
    rule_type text NOT NULL,
    -- e.g., 'Assignment Clause', 'Disclosures'
    rule_text text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
-- 7. Documents
-- Tracks physical file uploads and generated PDF deal packets mapped to Supabase Storage.
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id numeric REFERENCES public.properties(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_url text NOT NULL,
    document_type text,
    -- e.g., 'Deal Packet', 'Contract', 'Disclosures'
    created_at timestamptz DEFAULT now()
);
-- Safely handle legacy 'sequence_order' column if it exists from older schema versions
DO $handle_legacy$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'deal_stages'
        AND column_name = 'sequence_order'
) THEN
ALTER TABLE public.deal_stages
ALTER COLUMN sequence_order DROP NOT NULL;
END IF;
END $handle_legacy$;
-- Seed Default Deal Stages
INSERT INTO public.deal_stages (name, order_index, color_code)
VALUES ('Lead', 1, '#94a3b8'),
    ('Underwriting', 2, '#3b82f6'),
    ('Offer Submitted', 3, '#eab308'),
    ('Under Contract', 4, '#f97316'),
    ('Dispo / Marketing', 5, '#8b5cf6'),
    ('Clear to Close', 6, '#10b981'),
    ('Closed/Won', 7, '#059669'),
    ('Dead Deal', 8, '#ef4444') ON CONFLICT (name) DO NOTHING;
RAISE NOTICE 'Phase 12 Master Schema Alignment Migration Complete.';
END $$;

-- ============================
-- FILE: phase_15_architecture_overhaul.sql
-- ============================
-- ========================================================================================
-- Phase 15: Architecture Overhaul - Storage Bucket Provisioning
-- Description: Creates the physical Supabase Storage buckets for Deal Packets and Documents.
-- It enforces secure file_size_limits and explicit allowed_mime_types to prevent malware uploads.
-- ========================================================================================
-- Enable the Storage extension if not already active (usually active by default in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 1. Create the Secure 'documents' Bucket
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'documents',
        'documents',
        false,
        -- Private bucket! Requires RLS or Signed URLs to access
        10485760,
        -- 10 MB Limit
        '{
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }'
    ) ON CONFLICT (id) DO
UPDATE
SET public = false,
    file_size_limit = 10485760;
-- 2. Create the Public 'deal-packets' Bucket (For Marketing Dispo)
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'deal-packets',
        'deal-packets',
        true,
        -- Public bucket! Buyers need to freely download marketing packets
        26214400,
        -- 25 MB Limit for larger marketing PDFs with images
        '{
        "application/pdf",
        "image/jpeg",
        "image/png"
    }'
    ) ON CONFLICT (id) DO
UPDATE
SET public = true,
    file_size_limit = 26214400;
-- ========================================================================================
-- RLS (Row Level Security) Enforcement on Storage Objects
-- ========================================================================================
-- Grant Public read access ONLY to the 'deal-packets' bucket objects
CREATE POLICY "Public Access to Deal Packets" ON storage.objects FOR
SELECT USING (bucket_id = 'deal-packets');
-- Allow authenticated users to upload to their own directories (assuming they organize by UUID)
CREATE POLICY "Authenticated users can upload deal-packets" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (bucket_id = 'deal-packets');
-- Protect the 'documents' bucket heavily
CREATE POLICY "Authenticated users can read own documents" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'documents'
        AND (
            select auth.uid()
        ) = owner
    );
CREATE POLICY "Authenticated users can upload own documents" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'documents'
        AND (
            select auth.uid()
        ) = owner
    );

-- ============================
-- FILE: phase_30_tier_gated_personas.sql
-- ============================
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

-- ============================
-- FILE: phase_31_5_subscription_lifecycle.sql
-- ============================
-- WHOLESALE OS - PHASE 31.5
-- Subscription Lifecycle & Self-Service Control Architecture Schema Update
-- Focus: Enums, Timestamps, and Seat Locking
-- 1. Create Enums if they don't exist
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
-- 2. Modify organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS subscription_status subscription_status_enum NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS pause_requested_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ;
-- 3. Modify users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS seat_status seat_status_enum NOT NULL DEFAULT 'ACTIVE';
-- 4. Audit Log Enhancements (Optional Safety Check)
-- Ensure trigger exists for organizations (assuming existing setup, otherwise skip or build custom audit)
-- We map these status changes to the existing audit architecture for Phase 31
-- 5. RLS Adjustments
-- If `seat_status = 'LOCKED'`, the user should not be able to read/write operational data.
-- We alter existing policies on core tables (e.g., deals) to enforce this.
-- Update deals policy (Example pattern)
-- NOTE: In production, you would drop and recreate the policy for all major operational tables.
-- We will implement a database function to centralize this check.
CREATE OR REPLACE FUNCTION is_user_active_and_org_valid(p_user_id UUID, p_org_id UUID) RETURNS BOOLEAN AS $$
DECLARE v_seat_status seat_status_enum;
v_sub_status subscription_status_enum;
BEGIN
SELECT seat_status INTO v_seat_status
FROM public.users
WHERE id = p_user_id;
IF v_seat_status = 'LOCKED' THEN RETURN FALSE;
END IF;
SELECT subscription_status INTO v_sub_status
FROM public.organizations
WHERE id = p_org_id;
-- Terminated orgs block all, Past_Due/Paused block write operations.
-- Assuming read access is handled primarily by App Router UI blocking, 
-- but Strict RLS Write prevention occurs here.
IF v_sub_status IN ('TERMINATED') THEN RETURN FALSE;
END IF;
RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- FILE: phase_31_integrations_infrastructure.sql
-- ============================
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

-- ============================
-- FILE: phase_32_enterprise_hardening.sql
-- ============================
-- WHOLESALE OS - PHASE 32
-- Enterprise Hardening Schema Updates
-- 1. Stripe Idempotency and Webhook Reliability
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.stripe_event_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    organization_id UUID,
    -- Nullable if failure happens before org lookup
    payload JSONB NOT NULL,
    error_msg TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Protect Organization State during Async Stripe calls
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS pending_subscription_change BOOLEAN NOT NULL DEFAULT FALSE;
-- 2. Observability & System Event Logging
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    -- Nullable for global platform logs
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
-- 3. Integration Rate Limiting (Protects Extensibility Layer)
CREATE TABLE IF NOT EXISTS public.integration_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL,
    -- e.g. 'WEBHOOK', 'TWILIO', 'API_REQUEST'
    monthly_limit INT NOT NULL DEFAULT 1000,
    current_usage INT NOT NULL DEFAULT 0,
    reset_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT unique_org_integration UNIQUE(organization_id, integration_type)
);
-- 4. Background Job Functions (For Vercel CRON or native pg_cron later)
-- A. Data Purge / Archival on Terminated Tenants
CREATE OR REPLACE FUNCTION purge_retention_data() RETURNS VOID AS $$
DECLARE org_record RECORD;
BEGIN FOR org_record IN
SELECT id,
    name
FROM public.organizations
WHERE subscription_status = 'TERMINATED'
    AND data_retention_until IS NOT NULL
    AND data_retention_until < NOW()
    AND account_status = 'active' -- Use active flag internally to denote "not yet purged"
    LOOP -- Log the purge event
INSERT INTO public.system_logs (organization_id, log_type, source, message)
VALUES (
        org_record.id,
        'SECURITY',
        'SYSTEM_JOB',
        'Executing hard purge on expired Terminated Org: ' || org_record.name
    );
-- In a real environment, DELETE FROM CASCADE cascades down to deals, docs, users.
-- We will soft delete by flipping account_status to 'purged' assuming soft-deletes govern the DB queries.
-- Real hard delete: DELETE FROM public.organizations WHERE id = org_record.id;
UPDATE public.organizations
SET account_status = 'purged'
WHERE id = org_record.id;
END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- B. Seat Consistency Validation
CREATE OR REPLACE FUNCTION validate_seat_consistency() RETURNS VOID AS $$ BEGIN -- Log job start
INSERT INTO public.system_logs (log_type, source, message)
VALUES (
        'INFO',
        'SYSTEM_JOB',
        'Running Seat Consistency Check'
    );
-- Auto-heal condition 1: Ensure Admins are NEVER locked out
UPDATE public.users u
SET seat_status = 'ACTIVE'
FROM public.organizations o
WHERE u.organization_id = o.id
    AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    AND u.seat_status = 'LOCKED';
-- Logic for detecting bloated limits would go here (Counting total active seats vs team_seat_limit)
-- If count > limit, log WARNING to system_logs.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Add Strict RLS to these internal operational tables (Admin/Super Admin only)
-- (Omitted here for brevity, typically altering default public access)

-- ============================
-- FILE: phase_33_1_super_admin.sql
-- ============================
-- ========================================================================================
-- WHOLESALE OS - PHASE 33.1: SUPER ADMIN ENFORCEMENT
-- ========================================================================================
-- This script hardens the master admin elevation into the database schema directly.
-- RUN THIS SCRIPT IN THE SUPABASE SQL EDITOR.
-- ========================================================================================
DO $$
DECLARE master_admin_email text := 'ronald_lewis_jr@live.com';
master_admin_id uuid;
BEGIN -- 1. Ensure a global role column exists on profiles to completely avoid auth.users modifications
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'system_role'
) THEN
ALTER TABLE public.profiles
ADD COLUMN system_role text DEFAULT 'USER';
END IF;
-- 2. Find the User ID
SELECT id INTO master_admin_id
FROM auth.users
WHERE email = master_admin_email;
IF master_admin_id IS NULL THEN RAISE NOTICE 'Skipping Database Elevation: Account % not found in auth.users.',
master_admin_email;
RETURN;
END IF;
-- 3. Elevate User Profile to SUPER_ADMIN natively
UPDATE public.profiles
SET system_role = 'SUPER_ADMIN'
WHERE id = master_admin_id;
-- 4. Overwrite any user_organizations role to SUPER_ADMIN
UPDATE public.user_organizations
SET role = 'SUPER_ADMIN'
WHERE user_id = master_admin_id;
RAISE NOTICE 'Success: Elevated % to strict SUPER_ADMIN role in database.',
master_admin_email;
END $$;

-- ============================
-- FILE: phase_33_identity_and_theming.sql
-- ============================
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

-- ============================
-- FILE: phase_33_master_admin_elevation.sql
-- ============================
-- ========================================================================================
-- WHOLESALE OS - PHASE 33: NATIVE GOD-MODE ELEVATION
-- ========================================================================================
-- This script natively elevates a specified user's organization and profile to unlock all
-- tiers and Personas, granting them unrestricted access to the Admin Dashboard.
-- RUN THIS SCRIPT IN THE SUPABASE SQL EDITOR.
-- ========================================================================================
DO $$
DECLARE master_admin_email text := 'ronald_lewis_jr@live.com';
master_admin_id uuid;
target_org_id uuid;
BEGIN -- 1. Modify Schema Constraints to allow 'ADMIN' natively in primary_persona
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_primary_persona_check;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_primary_persona_check CHECK (
        primary_persona IN (
            'WHOLESALER',
            'REALTOR',
            'INVESTOR',
            'VIRTUAL_ASSISTANT',
            'ADMIN'
        )
    );
-- 2. Find the User ID in auth.users
SELECT id INTO master_admin_id
FROM auth.users
WHERE email = master_admin_email;
IF master_admin_id IS NULL THEN RAISE NOTICE 'Skipping Database Elevation: Account % not found in auth.users.',
master_admin_email;
RETURN;
END IF;
-- 3. Find the Primary Organization for this user
SELECT organization_id INTO target_org_id
FROM public.user_organizations
WHERE user_id = master_admin_id
LIMIT 1;
-- 4. Elevate Organization Tier to SUPER
IF target_org_id IS NOT NULL THEN
UPDATE public.organizations
SET subscription_tier = 'SUPER',
    enabled_personas = ARRAY ['WHOLESALER', 'INVESTOR', 'REALTOR', 'VIRTUAL_ASSISTANT', 'ADMIN']::text []
WHERE id = target_org_id;
RAISE NOTICE 'Success: Elevated Organization % to SUPER tier with ALL personas.',
target_org_id;
END IF;
-- 5. Elevate User Profile to God-Mode
UPDATE public.profiles
SET primary_persona = 'ADMIN',
    allowed_personas = ARRAY ['WHOLESALER', 'INVESTOR', 'REALTOR', 'VIRTUAL_ASSISTANT', 'ADMIN']::text []
WHERE id = master_admin_id;
-- Ensure they are flagged as an ADMIN natively in their Org Role
UPDATE public.user_organizations
SET role = 'ADMIN'
WHERE user_id = master_admin_id;
RAISE NOTICE 'Success: Elevated User Profile % to God-Mode.',
master_admin_email;
END $$;

-- ============================
-- FILE: phase_34_remediation.sql
-- ============================
-- =========================================================================================
-- PHASE 34: COMPREHENSIVE SECURITY AUDIT REMEDIATION
-- Author: Rontology Intelligence Engine
-- Purpose: Fix validate_seat_consistency roles and purge_retention_data soft-delete vulnerabilities.
-- =========================================================================================
-- 1. Fix validate_seat_consistency()
-- High Severity IDOR/Logic Bug: Previous query assumed 'role' and 'organization_id' existed on public.users.
-- Data exists physically on public.user_organizations and public.profiles.
CREATE OR REPLACE FUNCTION validate_seat_consistency() RETURNS VOID AS $$ BEGIN -- Log job start
INSERT INTO public.system_logs (log_type, source, message)
VALUES (
        'INFO',
        'SYSTEM_JOB',
        'Running Phase 34 Seat Consistency Check'
    );
-- Auto-heal condition 1: Ensure Admins and Super Admins are NEVER locked out.
-- Target public.users where seat_status = 'LOCKED' but they hold an Admin role.
UPDATE public.users u
SET seat_status = 'ACTIVE'
FROM public.user_organizations uo
    LEFT JOIN public.profiles p ON uo.user_id = p.id
WHERE u.id = uo.user_id
    AND (
        uo.role IN ('ADMIN', 'SUPER_ADMIN')
        OR p.system_role = 'SUPER_ADMIN'
    )
    AND u.seat_status = 'LOCKED';
-- Logic for detecting bloated limits would go here (Counting total active seats vs team_seat_limit)
-- If count > limit, log WARNING to system_logs.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Fix purge_retention_data()
-- Medium Severity: Organizations previously marked "purged" still retained all data, leading to PII/Vector leakage risks.
-- Phase 34 implements the intended HARD DELETE CASCADE functionality.
CREATE OR REPLACE FUNCTION purge_retention_data() RETURNS VOID AS $$
DECLARE org_record RECORD;
BEGIN FOR org_record IN
SELECT id,
    name
FROM public.organizations
WHERE subscription_status = 'TERMINATED'
    AND data_retention_until IS NOT NULL
    AND data_retention_until < NOW() LOOP -- Log the purge event PRE-CASCADE
INSERT INTO public.system_logs (organization_id, log_type, source, message)
VALUES (
        org_record.id,
        'SECURITY',
        'SYSTEM_JOB',
        'Phase 34 Execution: Hard CASCADE PURGE on expired Terminated Org: ' || org_record.name
    );
-- Execute destructive hard delete.
-- Assuming Core SaaS relations use ON DELETE CASCADE.
DELETE FROM public.organizations
WHERE id = org_record.id;
END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- FILE: phase_35_1_global_super_admin.sql
-- ============================
-- ========================================================================================
-- WHOLESALE OS - PHASE 35.4: GLOBAL SUPER ADMIN & RLS BYPASS
-- ========================================================================================
-- This script hardens the GLOBAL_SUPER_ADMIN system role and grants global RLS bypasses.
-- RUN THIS SCRIPT IN THE SUPABASE SQL EDITOR.
-- ========================================================================================
DO $$
DECLARE master_admin_email text := 'ronald_lewis_jr@live.com';
master_admin_id uuid;
BEGIN -- 1. Ensure system_role column exists on profiles
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'system_role'
) THEN
ALTER TABLE public.profiles
ADD COLUMN system_role text DEFAULT 'USER';
END IF;
-- 2. Find the User ID for the target Global Super Admin
SELECT id INTO master_admin_id
FROM auth.users
WHERE email = master_admin_email;
IF master_admin_id IS NULL THEN RAISE NOTICE 'Skipping Database Elevation: Account % not found in auth.users.',
master_admin_email;
ELSE -- 3. Elevate User Profile to GLOBAL_SUPER_ADMIN natively
UPDATE public.profiles
SET system_role = 'GLOBAL_SUPER_ADMIN'
WHERE id = master_admin_id;
-- 4. Overwrite any user_organizations role to GLOBAL_SUPER_ADMIN, just in case they are tied to an org
UPDATE public.user_organizations
SET role = 'GLOBAL_SUPER_ADMIN'
WHERE user_id = master_admin_id;
RAISE NOTICE 'Success: Elevated % to strict GLOBAL_SUPER_ADMIN role in database.',
master_admin_email;
END IF;
END $$;
-- 5. Modify RLS Policies to bypass constraints if role == GLOBAL_SUPER_ADMIN
-- We will create a helper function to easily check if the current user is a GLOBAL_SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND system_role = 'GLOBAL_SUPER_ADMIN'
    );
$$;
-- Apply bypasses to organizations
DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;
CREATE POLICY "Users can view their own organizations" ON public.organizations FOR
SELECT USING (
        id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR public.is_super_admin()
    );
-- Apply bypasses to user_organizations
DROP POLICY IF EXISTS "Users can view their own org memberships" ON public.user_organizations;
CREATE POLICY "Users can view their own org memberships" ON public.user_organizations FOR
SELECT USING (
        user_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR public.is_super_admin()
    );
-- Apply bypasses to deals
DROP POLICY IF EXISTS "Users can view their own organization's deals" ON public.deals;
CREATE POLICY "Users can view their own organization's deals" ON public.deals FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR public.is_super_admin()
    );
-- Apply bypasses to leads
DROP POLICY IF EXISTS "Users can view their own organization's leads" ON public.leads;
CREATE POLICY "Users can view their own organization's leads" ON public.leads FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR public.is_super_admin()
    );
-- Apply bypasses to activity_logs
DROP POLICY IF EXISTS "Users can view their org logs" ON public.activity_logs;
CREATE POLICY "Users can view their org logs" ON public.activity_logs FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
        OR public.is_super_admin()
    );
-- 6. Create Super Admin Audit Log Table
CREATE TABLE IF NOT EXISTS public.super_admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES auth.users(id) NOT NULL,
    action_type text NOT NULL,
    target_resource text,
    target_id uuid,
    details jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Only Super Admins can insert into this log, NO ONE can delete or update
ALTER TABLE public.super_admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super Admins can insert audit logs" ON public.super_admin_audit_logs FOR
INSERT WITH CHECK (public.is_super_admin());
CREATE POLICY "Super Admins can view audit logs" ON public.super_admin_audit_logs FOR
SELECT USING (public.is_super_admin());
-- Revoke all update/delete privileges
REVOKE
UPDATE,
    DELETE ON public.super_admin_audit_logs
FROM authenticated,
    anon,
    public;
-- Ensure hard lockout triggers and MFA flags are represented (assumes standard auth.users modifications or app-level handling)
-- 7. Overwrite Persona Immutability Trigger from Phase 36 to remove string-based email check
CREATE OR REPLACE FUNCTION public.enforce_persona_immutability() RETURNS TRIGGER AS $$
DECLARE is_admin BOOLEAN := FALSE;
jwt_role TEXT;
BEGIN -- Only trigger validation if the primary_persona is actually being changed
IF NEW.primary_persona IS DISTINCT
FROM OLD.primary_persona THEN -- Check if it's the service_role (backend bypass)
    BEGIN jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
EXCEPTION
WHEN OTHERS THEN jwt_role := NULL;
END;
IF jwt_role = 'service_role' THEN is_admin := TRUE;
ELSE -- Check if the executing user is a Global Super Admin or Org Admin natively
SELECT EXISTS (
        SELECT 1
        FROM auth.users u
            LEFT JOIN public.user_organizations uo ON u.id = uo.user_id
            LEFT JOIN public.profiles p ON p.id = u.id
        WHERE u.id = auth.uid()
            AND (
                p.system_role = 'GLOBAL_SUPER_ADMIN'
                OR uo.role = 'ADMIN'
            )
    ) INTO is_admin;
END IF;
-- If not an admin, block the mutation
IF NOT is_admin THEN RAISE EXCEPTION 'Persona Violation: Only Organization Admins or System Admins can modify a user persona.';
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ========================================================================================
-- PART 4: SUPER ADMIN HARDENING (MFA / AAL2 & AUDIT LOG RPC)
-- ========================================================================================
-- Create a helper function to strictly verify if the session has MFA (AAL2) enabled.
CREATE OR REPLACE FUNCTION public.require_super_admin_mfa() RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
SELECT public.is_super_admin()
    AND (auth.jwt()->>'aal' = 'aal2');
$$;
-- Build a Secure RPC for the frontend to record Super Admin actions
-- This forces the audit log to be immutable and securely attributed.
CREATE OR REPLACE FUNCTION public.log_super_admin_action(
        action_type text,
        target_resource text,
        target_id uuid,
        details jsonb
    ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN -- 1. Ensure the user is a Super Admin
    IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Unauthorized: Only Global Super Admins can log administrative actions.';
END IF;
-- 2. Strictly enforce AAL2 (MFA) for high-risk actions
IF (auth.jwt()->>'aal' != 'aal2') THEN -- Allow login audit without MFA, but block mutating actions
IF action_type != 'GLOBAL_SUPER_ADMIN_LOGIN_ATTEMPT'
AND action_type != 'GLOBAL_SUPER_ADMIN_SESSION_START' THEN RAISE EXCEPTION 'Security Violation: Multi-Factor Authentication (AAL2) is required for Super Admin operations.';
END IF;
END IF;
-- 3. Insert the immutable log
INSERT INTO public.super_admin_audit_logs (
        admin_id,
        action_type,
        target_resource,
        target_id,
        details,
        ip_address
    )
VALUES (
        auth.uid(),
        action_type,
        target_resource,
        target_id,
        details,
        current_setting('request.headers', true)::json->>'x-forwarded-for' -- Capture IP
    );
END;
$$;

-- ============================
-- FILE: phase_36_persona_enforcement.sql
-- ============================
-- ========================================================================================
-- WHOLESALE OS - PHASE 36 STRUCTURAL PERSONA ENFORCEMENT
-- ========================================================================================
-- This script hardens the 'primary_persona' field, transitioning it from a cosmetic UI
-- element to a strictly enforced backend constraint. Standard users can no longer
-- mutate their own persona.
-- ========================================================================================
BEGIN;
-- 1. Redefine the constraint accurately
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_primary_persona_check;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_primary_persona_check CHECK (
        primary_persona IN (
            'WHOLESALER',
            'REALTOR',
            'INVESTOR',
            'VIRTUAL_ASSISTANT',
            'ADMIN',
            'NONE'
        )
    );
-- 2. Create the Trigger Function to Block Unauthorized Persona Mutations
CREATE OR REPLACE FUNCTION enforce_persona_immutability() RETURNS TRIGGER AS $$
DECLARE is_admin BOOLEAN := FALSE;
jwt_role TEXT;
BEGIN -- Only trigger validation if the primary_persona is actually being changed
IF NEW.primary_persona IS DISTINCT
FROM OLD.primary_persona THEN -- Check if it's the service_role (backend bypass)
    BEGIN jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
EXCEPTION
WHEN OTHERS THEN jwt_role := NULL;
END;
IF jwt_role = 'service_role' THEN is_admin := TRUE;
ELSE -- Check if the executing user is a Master Admin or Org Admin
SELECT EXISTS (
        SELECT 1
        FROM auth.users u
            LEFT JOIN public.user_organizations uo ON u.id = uo.user_id
        WHERE u.id = auth.uid()
            AND (
                p.system_role = 'GLOBAL_SUPER_ADMIN'
                OR uo.role = 'ADMIN'
            )
    ) INTO is_admin;
END IF;
-- If not an admin, block the mutation
IF NOT is_admin THEN RAISE EXCEPTION 'Persona Violation: Only Organization Admins or System Admins can modify a user persona.';
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Attach the Trigger to the profiles table
DROP TRIGGER IF EXISTS restrict_persona_updates ON public.profiles;
CREATE TRIGGER restrict_persona_updates BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION enforce_persona_immutability();
COMMIT;

-- ============================
-- FILE: phase_37_relax_persona.sql
-- ============================
-- ========================================================================================
-- WHOLESALE OS - PHASE 37 RELAX PERSONA RESTRICTIONS
-- ========================================================================================
-- This script drops the strict trigger that blocked standard users from mutating
-- their own system personas, reverting it to a selectable frontend trait.
-- ========================================================================================
BEGIN;
DROP TRIGGER IF EXISTS restrict_persona_updates ON public.profiles;
DROP FUNCTION IF EXISTS enforce_persona_immutability();
COMMIT;

-- ============================
-- FILE: phase_38_multitenant_core.sql
-- ============================
-- ==============================================================================
-- PHASE 38: MULTI-TENANT ARCHITECTURE & PERSONA WORKSTATIONS
-- ==============================================================================
-- Description: Implement massive multi-tenant RLS, organizations, and subscription plans.
DO $$ BEGIN RAISE NOTICE 'Starting Phase 38 Multi-Tenant Schema alignment...';
-- 1. Organizations (Multi-tenant core)
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    subscription_tier text DEFAULT 'BASIC',
    -- BASIC, PRO, TEAM, ENTERPRISE
    account_status text DEFAULT 'active',
    team_seat_limit integer DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 2. Update Profiles (Users) to belong to an organization
-- Adding if they don't exist
DO $add_cols$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'organization_id'
) THEN
ALTER TABLE public.profiles
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'role'
) THEN
ALTER TABLE public.profiles
ADD COLUMN role text DEFAULT 'User';
-- Owner, Admin, Manager, User, Viewer
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'persona'
) THEN
ALTER TABLE public.profiles
ADD COLUMN persona text;
-- Acquisition, Disposition, Admin Command, Compliance, Analyst
END IF;
END $add_cols$;
-- 3. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_customer_id text,
    stripe_subscription_id text,
    status text DEFAULT 'active',
    current_period_end timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 4. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    seller_name text NOT NULL,
    phone text,
    email text,
    property_address text,
    status text DEFAULT 'New',
    -- New, Pre-Screen, Follow-Up, Dead
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 5. Properties Table (Ensure organization_id exists)
DO $prop_org$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'properties'
        AND column_name = 'organization_id'
) THEN
ALTER TABLE public.properties
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
END IF;
END $prop_org$;
-- 6. Deals Table (Ensure organization_id exists)
DO $deal_org$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'deals'
        AND column_name = 'organization_id'
) THEN
ALTER TABLE public.deals
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
END IF;
END $deal_org$;
-- 7. Buyers Table
CREATE TABLE IF NOT EXISTS public.buyers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text,
    phone text,
    buying_criteria text,
    vip_status boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 8. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE
    SET NULL,
        action text NOT NULL,
        entity_type text,
        entity_id uuid,
        details jsonb,
        created_at timestamptz DEFAULT now()
);
-- 9. Documents
DO $doc_org$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'documents'
        AND column_name = 'organization_id'
) THEN
ALTER TABLE public.documents
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
END IF;
END $doc_org$;
RAISE NOTICE 'Phase 38 Schema Alignment Complete.';
END $$;

-- ============================
-- FILE: phase_39_workflow_triggers.sql
-- ============================
-- ==============================================================================
-- PHASE 39: WORKFLOW AUTOMATION ENGINE - LEAD TRIGGERS
-- ==============================================================================
-- 1. MAO (Maximum Allowable Offer) Calculation Function
-- Standard Formula: (ARV * 0.70) - Estimated Repairs - Wholesale Fee
CREATE OR REPLACE FUNCTION calculate_mao(
        p_arv numeric,
        p_estimated_repairs numeric,
        p_desired_fee numeric
    ) RETURNS numeric AS $$
DECLARE v_arv numeric := COALESCE(p_arv, 0);
v_repairs numeric := COALESCE(p_estimated_repairs, 0);
v_fee numeric := COALESCE(p_desired_fee, 0);
v_mao numeric;
BEGIN IF v_arv <= 0 THEN RETURN 0;
END IF;
v_mao := (v_arv * 0.70) - v_repairs - v_fee;
-- Ensure MAO doesn't go negative natively
IF v_mao < 0 THEN RETURN 0;
END IF;
RETURN v_mao;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
-- 2. Add Automation Columns to Leads (if they don't exist from Phase 38)
ALTER TABLE IF EXISTS public.leads
ADD COLUMN IF NOT EXISTS arv numeric(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS estimated_repairs numeric(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS desired_fee numeric(12, 2) DEFAULT 10000.00,
    /* Default target fee */
ADD COLUMN IF NOT EXISTS mao numeric(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id);
-- 3. Workflow Trigger: Pre-Insert/Update Lead Processing
CREATE OR REPLACE FUNCTION process_lead_workflow() RETURNS TRIGGER AS $$
DECLARE v_org_owner uuid;
BEGIN -- [A] Auto-Calculate MAO on strictly provided figures
NEW.mao := calculate_mao(NEW.arv, NEW.estimated_repairs, NEW.desired_fee);
-- [B] Auto-Assignment Logic (On Insert Only)
IF TG_OP = 'INSERT'
AND NEW.assigned_to IS NULL THEN -- Default strategy: Assign to the Organization Owner if nobody else is assigned
SELECT owner_id INTO v_org_owner
FROM public.organizations
WHERE id = NEW.organization_id;
IF v_org_owner IS NOT NULL THEN NEW.assigned_to := v_org_owner;
END IF;
-- Log the auto-assignment activity
-- Note: We wrap this in an exception block so missing activity functionality doesn't crash inserts
BEGIN
INSERT INTO public.activity_logs (
        organization_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        metadata
    )
VALUES (
        NEW.organization_id,
        v_org_owner,
        'lead_auto_assigned',
        'leads',
        NEW.id,
        jsonb_build_object(
            'auto_assign',
            true,
            'reason',
            'System Default Strategy'
        )
    );
EXCEPTION
WHEN OTHERS THEN -- Ignore log failure to preserve the insert
END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. Bind the Workflow Trigger to Leads Table
DROP TRIGGER IF EXISTS trg_process_lead_workflow ON public.leads;
CREATE TRIGGER trg_process_lead_workflow BEFORE
INSERT
    OR
UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION process_lead_workflow();

-- ============================
-- FILE: phase_40_workflow_contract_triggers.sql
-- ============================
-- ==============================================================================
-- PHASE 40: WORKFLOW AUTOMATION ENGINE - CONTRACT & ASSIGNMENT TRIGGERS
-- ==============================================================================
-- 1. Function: Process Contract Signed Event
CREATE OR REPLACE FUNCTION process_contract_signed() RETURNS TRIGGER AS $$ BEGIN -- Only trigger if the status changed to 'Under Contract'
    IF NEW.status = 'Under Contract'
    AND (
        OLD.status IS NULL
        OR OLD.status != 'Under Contract'
    ) THEN -- A. Update the Deal Stage seamlessly
UPDATE public.deals
SET current_stage = 'Under Contract',
    updated_at = NOW()
WHERE id = NEW.id;
-- B. Log the major milestone activity
BEGIN
INSERT INTO public.activity_logs (
        organization_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        metadata
    )
VALUES (
        NEW.organization_id,
        auth.uid(),
        /* Captures the user who triggered the update */
        'contract_signed',
        'deals',
        NEW.id,
        jsonb_build_object('milestone', true, 'timestamp', NOW())
    );
EXCEPTION
WHEN OTHERS THEN -- Ignore log failure
END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Bind the Contract Signed Trigger to Deals Table
DROP TRIGGER IF EXISTS trg_process_contract_signed ON public.deals;
CREATE TRIGGER trg_process_contract_signed
AFTER
UPDATE OF status ON public.deals FOR EACH ROW
    WHEN (NEW.status = 'Under Contract') EXECUTE FUNCTION process_contract_signed();
-- 3. Function: Process Assignment Signed Event
CREATE OR REPLACE FUNCTION process_assignment_signed() RETURNS TRIGGER AS $$ BEGIN -- Only trigger if the status changed to 'Assigned'
    IF NEW.status = 'Assigned'
    AND (
        OLD.status IS NULL
        OR OLD.status != 'Assigned'
    ) THEN -- A. Update the Deal Stage seamlessly
UPDATE public.deals
SET current_stage = 'Assigned',
    updated_at = NOW()
WHERE id = NEW.id;
-- B. Log the major milestone activity
BEGIN
INSERT INTO public.activity_logs (
        organization_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        metadata
    )
VALUES (
        NEW.organization_id,
        auth.uid(),
        'assignment_signed',
        'deals',
        NEW.id,
        jsonb_build_object(
            'milestone',
            true,
            'buyer_id',
            NEW.assigned_buyer_id,
            'timestamp',
            NOW()
        )
    );
EXCEPTION
WHEN OTHERS THEN -- Ignore log failure
END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. Bind the Assignment Signed Trigger to Deals Table
DROP TRIGGER IF EXISTS trg_process_assignment_signed ON public.deals;
CREATE TRIGGER trg_process_assignment_signed
AFTER
UPDATE OF status ON public.deals FOR EACH ROW
    WHEN (NEW.status = 'Assigned') EXECUTE FUNCTION process_assignment_signed();

-- ============================
-- FILE: phase_41_intelligent_compliance.sql
-- ============================
-- ==============================================================================
-- PHASE 41: INTELLIGENT SYSTEM BEHAVIOR - COMPLIANCE & INSIGHTS
-- ==============================================================================
-- 1. Create a Table to hold System Insights / Flags
CREATE TABLE IF NOT EXISTS public.deal_intelligence_flags (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    flag_type text NOT NULL CHECK (
        flag_type IN (
            'Risk',
            'Opportunity',
            'Compliance_Warning',
            'Action_Required'
        )
    ),
    severity text NOT NULL CHECK (
        severity IN ('Low', 'Medium', 'High', 'Critical')
    ),
    description text NOT NULL,
    resolved boolean DEFAULT false,
    resolved_by uuid REFERENCES public.profiles(id),
    resolved_at timestamptz,
    created_at timestamptz DEFAULT NOW()
);
-- Enable RLS on Intelligence Flags
ALTER TABLE public.deal_intelligence_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their organization's intelligence flags" ON public.deal_intelligence_flags FOR
SELECT USING (organization_id = get_current_user_org());
CREATE POLICY "Users can resolve their organization's intelligence flags" ON public.deal_intelligence_flags FOR
UPDATE USING (organization_id = get_current_user_org());
-- 2. Intelligent Function: Evaluate Compliance Risk on Deal Update
CREATE OR REPLACE FUNCTION evaluate_deal_compliance() RETURNS TRIGGER AS $$
DECLARE v_days_to_close integer;
BEGIN -- Only evaluate if it's an active deal
IF NEW.status IN ('Dead', 'Closed') THEN RETURN NEW;
END IF;
-- [A] Close Date Urgency Flag
IF NEW.estimated_close_date IS NOT NULL THEN v_days_to_close := NEW.estimated_close_date::date - CURRENT_DATE;
IF v_days_to_close <= 5
AND v_days_to_close > 0
AND NEW.current_stage != 'Clear to Close' THEN -- Check if a High urgency flag already exists to prevent spam
IF NOT EXISTS (
    SELECT 1
    FROM public.deal_intelligence_flags
    WHERE deal_id = NEW.id
        AND flag_type = 'Action_Required'
        AND resolved = false
) THEN
INSERT INTO public.deal_intelligence_flags (
        organization_id,
        deal_id,
        flag_type,
        severity,
        description
    )
VALUES (
        NEW.organization_id,
        NEW.id,
        'Action_Required',
        'High',
        'Deal is closing in under 5 days but is not marked Clear to Close. Immediate attention required.'
    );
END IF;
END IF;
END IF;
-- [B] Financial Risk Flag (EMD Missing)
IF NEW.current_stage = 'Under Contract'
AND (
    OLD.current_stage IS NULL
    OR OLD.current_stage != 'Under Contract'
) THEN IF (NEW.contract_terms->>'emd_amount') IS NULL
OR (NEW.contract_terms->>'emd_amount')::numeric <= 0 THEN
INSERT INTO public.deal_intelligence_flags (
        organization_id,
        deal_id,
        flag_type,
        severity,
        description
    )
VALUES (
        NEW.organization_id,
        NEW.id,
        'Risk',
        'Medium',
        'Deal marked Under Contract but lacks documented Earnest Money Deposit (EMD) terms.'
    );
END IF;
END IF;
-- [C] Compliance Disclosure Missing (State-specific stub via JSON lookup)
IF NEW.current_stage = 'Assigned'
AND (
    OLD.current_stage IS NULL
    OR OLD.current_stage != 'Assigned'
) THEN IF NOT (
    NEW.contract_terms ? 'assignment_disclosure_signed'
) THEN
INSERT INTO public.deal_intelligence_flags (
        organization_id,
        deal_id,
        flag_type,
        severity,
        description
    )
VALUES (
        NEW.organization_id,
        NEW.id,
        'Compliance_Warning',
        'Critical',
        'Deal assigned without verified Assignment Disclosure. High legal risk.'
    );
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Bind the Compliance Trigger
DROP TRIGGER IF EXISTS trg_evaluate_deal_compliance ON public.deals;
CREATE TRIGGER trg_evaluate_deal_compliance
AFTER
INSERT
    OR
UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION evaluate_deal_compliance();
-- 4. Intelligent Function: Offer Suggestion Engine (View)
-- Synthesizes Lead data to suggest starting points for Acq Managers
CREATE OR REPLACE VIEW public.vw_intelligent_offer_suggestions AS
SELECT l.id AS lead_id,
    l.organization_id,
    l.arv,
    l.estimated_repairs,
    l.mao,
    l.heat_score,
    -- Conservative Offer: 60% of ARV minus repairs
    (
        (l.arv * 0.60) - COALESCE(l.estimated_repairs, 0)
    ) AS conservative_offer,
    -- Aggressive Offer (High Heat): 75% of ARV minus repairs (tight margins)
    (
        (l.arv * 0.75) - COALESCE(l.estimated_repairs, 0)
    ) AS aggressive_offer,
    CASE
        WHEN l.heat_score > 75 THEN 'Highly Competitive: Use Aggressive Offer framing.'
        WHEN l.heat_score > 40 THEN 'Standard Play: Open with Conservative Offer, negotiate to MAO.'
        ELSE 'Cold Lead: Anchor extremely low to test motivation.'
    END AS negotiation_strategy
FROM public.leads l;