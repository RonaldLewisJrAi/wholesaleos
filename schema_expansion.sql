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
-- 6. RETROFIT EXISTING SINGLE-TENANT TABLES
-- =======================================================
-- The CRM tables already exist from previous phases.
-- CREATE TABLE IF NOT EXISTS does not retroactively add new columns,
-- so we must explicitly add organization_id to all existing tables.
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE buyers
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE buyer_criteria
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE deal_stages
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE compliance_rules
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE repair_estimates
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE marketing_channels
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE kpi_snapshots
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
-- =======================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
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
SELECT USING (organization_id = get_current_user_org());- -   P H A S E   1 6 :   A s s i g n m e n t   A g r e e m e n t ,   T r u s t   S y s t e m ,   a n d   M a r k e t p l a c e   I n t e g r i t y  
 - -   1 .   U p d a t e   D e a l s   T a b l e  
 A L T E R   T A B L E   d e a l s  
 A D D   C O L U M N   c l o s i n g _ c o d e   T E X T ,  
         A D D   C O L U M N   c l a i m _ d e p o s i t _ p a i d   B O O L E A N   D E F A U L T   F A L S E ,  
         A D D   C O L U M N   c l a i m _ d e p o s i t _ u s e r _ i d   U U I D ,  
         A D D   C O L U M N   i n v e s t o r _ i d   U U I D ,  
         - -   T o   t r a c k   w h o   c l a i m e d   t h e   d e a l   f o r   t h e   a s s i g n m e n t  
 A D D   C O L U M N   a s s i g n m e n t _ f e e   N U M E R I C ;  
 - -   T o   t r a c k   t h e   f e e   i n s i d e   t h e   a g r e e m e n t  
 - -   2 .   D e a l   D o c u m e n t s   T a b l e  
 C R E A T E   T A B L E   d e a l _ d o c u m e n t s   (  
         i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
         d e a l _ i d   U U I D   N O T   N U L L   R E F E R E N C E S   d e a l s ( i d )   O N   D E L E T E   C A S C A D E ,  
         d o c u m e n t _ t y p e   T E X T   N O T   N U L L ,  
         - -   e . g . ,   ' A S S I G N M E N T _ A G R E E M E N T ' ,   ' T I T L E _ C O M M I T M E N T '  
         f i l e _ u r l   T E X T ,  
         s i g n e d _ w h o l e s a l e r   B O O L E A N   D E F A U L T   F A L S E ,  
         s i g n e d _ i n v e s t o r   B O O L E A N   D E F A U L T   F A L S E ,  
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( )  
 ) ;  
 - -   3 .   U s e r   T r u s t   S c o r e s   T a b l e  
 C R E A T E   T A B L E   u s e r _ t r u s t _ s c o r e s   (  
         u s e r _ i d   U U I D   P R I M A R Y   K E Y ,  
         - -   M a p s   t o   a u t h . u s e r s   o r   p r o f i l e s  
         t r u s t _ s c o r e   I N T E G E R   D E F A U L T   5 0 ,  
         d e a l s _ c l o s e d   I N T E G E R   D E F A U L T   0 ,  
         d e a l s _ f a i l e d   I N T E G E R   D E F A U L T   0 ,  
         v e r i f i c a t i o n _ r a t e   N U M E R I C   D E F A U L T   0 . 0 ,  
         d i s p u t e _ c o u n t   I N T E G E R   D E F A U L T   0 ,  
         l a s t _ u p d a t e d   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( )  
 ) ;  
 - -   4 .   P l a t f o r m   E v e n t s   T r a c k e r  
 C R E A T E   T A B L E   p l a t f o r m _ e v e n t s   (  
         i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
         e v e n t _ t y p e   T E X T   N O T   N U L L ,  
         - -   e . g . ,   ' D E A L _ P O S T E D ' ,   ' D E A L _ R E Q U E S T E D ' ,   ' A S S I G N M E N T _ G E N E R A T E D ' ,   ' A S S I G N M E N T _ S I G N E D ' ,   ' E S C R O W _ C O N F I R M E D ' ,   ' T I T L E _ V E R I F I E D ' ,   ' D E A L _ C L O S E D '  
         u s e r _ i d   U U I D ,  
         d e a l _ i d   U U I D ,  
         e v e n t _ d a t a   J S O N B ,  
         - -   F l e x i b l e   p a y l o a d   f o r   e v e n t   d e t a i l s  
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( )  
 ) ;  
 - -   R L S   P o l i c i e s   s t r u c t u r e   p l a c e h o l d e r s   ( t o   b e   u p d a t e d   l a t e r   b a s e d   o n   e x a c t   o r g   s c o p i n g )  
 A L T E R   T A B L E   d e a l _ d o c u m e n t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   u s e r _ t r u s t _ s c o r e s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p l a t f o r m _ e v e n t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 - -   T e m p o r a r y   b y p a s s   f o r   M V P   e x e c u t i o n  
 C R E A T E   P O L I C Y   " A l l o w   A L L   D o c u m e n t s "   O N   d e a l _ d o c u m e n t s   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " A l l o w   A L L   T r u s t S c o r e s "   O N   u s e r _ t r u s t _ s c o r e s   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " A l l o w   A L L   E v e n t s "   O N   p l a t f o r m _ e v e n t s   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ;  
 