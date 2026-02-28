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
    order_index integer NOT NULL,
    color_code text DEFAULT '#6366f1',
    created_at timestamptz DEFAULT now()
);
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
-- Seed Default Deal Stages
INSERT INTO public.deal_stages (name, order_index, color_code)
VALUES ('Lead', 1, '#94a3b8'),
    ('Underwriting', 2, '#3b82f6'),
    ('Offer Submitted', 3, '#eab308'),
    ('Under Contract', 4, '#f97316'),
    ('Dispo / Marketing', 5, '#8b5cf6'),
    ('Clear to Close', 6, '#10b981'),
    ('Closed/Won', 7, '#059669'),
    ('Dead Deal', 8, '#ef4444') ON CONFLICT DO NOTHING;
RAISE NOTICE 'Phase 12 Master Schema Alignment Migration Complete.';
END $$;