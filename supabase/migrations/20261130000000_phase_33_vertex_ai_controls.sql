-- migration: phase_33_vertex_ai_controls
-- description: Adds schema for Vertex AI telemetry, caching, and token budget gating.
-- 1. AI Usage Tracking Table
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    -- e.g., 'deal_analysis', 'oscar_chat'
    model TEXT NOT NULL,
    -- e.g., 'gemini-2.0-flash', 'gemini-2.0-pro'
    tokens_input INTEGER NOT NULL DEFAULT 0,
    tokens_output INTEGER NOT NULL DEFAULT 0,
    tokens_total INTEGER NOT NULL DEFAULT 0,
    cost_estimate DECIMAL(10, 6) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Index for fast quota grouping per organization by month
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_date ON public.ai_usage(organization_id, created_at);
-- 2. AI Output Cache Table
CREATE TABLE IF NOT EXISTS public.ai_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key TEXT NOT NULL,
    feature TEXT NOT NULL,
    input_hash TEXT NOT NULL,
    output JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Compound index for rapid cache hits
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_cache_lookup ON public.ai_cache(feature, input_hash);
-- Index for sweep queries purging expired rows
CREATE INDEX IF NOT EXISTS idx_ai_cache_expiration ON public.ai_cache(expires_at);
-- 3. AI Feature Flags
CREATE TABLE IF NOT EXISTS public.ai_feature_flags (
    feature_name TEXT PRIMARY KEY,
    enabled BOOLEAN DEFAULT TRUE,
    tier_required TEXT NOT NULL -- e.g., 'BASIC', 'PRO', 'SUPER'
);
-- Populate default gating mapping
INSERT INTO public.ai_feature_flags (feature_name, enabled, tier_required)
VALUES ('Academy Mentor', true, 'BASIC'),
    ('OSCAR Chat', true, 'BASIC'),
    ('Deal Intelligence', true, 'PRO'),
    ('Document AI', true, 'PRO'),
    ('Radar AI', true, 'PRO'),
    ('Advanced Market Intelligence', true, 'SUPER'),
    ('Bulk AI Processing', true, 'SUPER') ON CONFLICT (feature_name) DO
UPDATE
SET tier_required = EXCLUDED.tier_required;
-- 4. Extend Properties Table to persistently store Deal Analysis Engine metrics
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT NULL;
-- Enable RLS (Service role will bypass these for backend processing, but protecting client reads)
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feature_flags ENABLE ROW LEVEL SECURITY;
-- Allow org members to view their org's usage
CREATE POLICY "View own org ai usage" ON public.ai_usage FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );
-- Features flags are universally readable to construct UI gates
CREATE POLICY "Public read feature flags" ON public.ai_feature_flags FOR
SELECT USING (true);