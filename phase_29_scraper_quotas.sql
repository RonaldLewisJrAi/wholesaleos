-- Phase 29: Advanced Scraper Containment & Logging Layer
-- 1. Scraper Usage Tracking Table
CREATE TABLE IF NOT EXISTS public.scraper_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    scrape_type VARCHAR(50) NOT NULL,
    -- e.g., 'courthouse_nod', 'zillow_comps'
    county_target VARCHAR(100),
    -- e.g., 'Rutherford, TN'
    records_extracted INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'success',
    -- 'success', 'failed', 'rate_limited'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: Users can only see their organization's scrape logs
ALTER TABLE public.scraper_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own org scrape logs" ON public.scraper_usage FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.role_permissions
            WHERE user_id = auth.uid()
        )
    );
-- 2. Scraper Module Global Configuration (The Kill Switches)
CREATE TABLE IF NOT EXISTS public.scraper_admin_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_name VARCHAR(100) UNIQUE NOT NULL,
    -- e.g., 'rutherford_title_search'
    is_active BOOLEAN DEFAULT TRUE,
    -- THE GLOBAL KILL SWITCH
    maintenance_message TEXT,
    -- e.g., "County site changed layout, scraper offline for repairs."
    global_rate_limit_per_hour INTEGER DEFAULT 500,
    -- Maximum total scrapes platform-wide to avoid IP bans
    target_url VARCHAR(255),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);
-- Seed initial scraper configurations
INSERT INTO public.scraper_admin_config (
        module_name,
        is_active,
        global_rate_limit_per_hour
    )
VALUES ('rutherford_title_search', true, 200),
    ('zillow_comps_proxy', true, 1000) ON CONFLICT (module_name) DO NOTHING;
-- RLS: Anyone can read if a module is active, only Admins can update
ALTER TABLE public.scraper_admin_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read scraper config" ON public.scraper_admin_config FOR
SELECT USING (true);
CREATE POLICY "Admins can update scraper config" ON public.scraper_admin_config FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.role_permissions
            WHERE user_id = auth.uid()
                AND role = 'Admin'
                AND organization_id IS NULL
        )
    );
-- 3. Extend user profiles with Monthly Scrape Quotas
-- Pro/Super tiers will have higher limits. Basic will be restricted.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS monthly_scrape_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS scrape_limit_override INTEGER DEFAULT NULL;
-- Null means use default tier limit
-- Create function to reset scrape counts monthly (similar to document counts)
-- We will handle this via an Edge Function hook in production, but here is the DB constraint
COMMENT ON COLUMN public.profiles.monthly_scrape_count IS 'Tracks the number of scraper executions this billing cycle.';
-- 4. Create a function to safely check if a user can scrape
CREATE OR REPLACE FUNCTION check_scraper_allowance(
        p_user_id UUID,
        p_module_name VARCHAR
    ) RETURNS BOOLEAN AS $$
DECLARE v_module_active BOOLEAN;
v_user_count INTEGER;
v_user_tier VARCHAR;
v_limit INTEGER;
BEGIN -- 1. Check Global Kill Switch
SELECT is_active INTO v_module_active
FROM public.scraper_admin_config
WHERE module_name = p_module_name;
IF v_module_active IS FALSE THEN RETURN FALSE;
-- Module is globally disabled by Admin
END IF;
-- 2. Check User Usage vs Tier Limits
-- For this prototype, we'll map logic based on basic subscription tier assumptions
-- In a real app, you'd join to the subscriptions table.
-- Assuming a simple fetch for the prototype context
SELECT monthly_scrape_count INTO v_user_count
FROM public.profiles
WHERE id = p_user_id;
-- Placeholder logic: Basic (10), Pro (100), Elite (Unlimited -> 99999)
-- If they have an override, use that.
SELECT COALESCE(scrape_limit_override, 100) INTO v_limit
FROM public.profiles
WHERE id = p_user_id;
IF v_user_count >= v_limit THEN RETURN FALSE;
-- User hit their monthly quota
END IF;
RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;