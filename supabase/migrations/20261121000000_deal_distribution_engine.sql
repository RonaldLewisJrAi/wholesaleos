-- Phase 19: Deal Distribution Engine Schema
-- 1. Create investor_preferences table
CREATE TABLE IF NOT EXISTS public.investor_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    states TEXT [] DEFAULT '{}',
    cities TEXT [] DEFAULT '{}',
    min_arv NUMERIC,
    max_arv NUMERIC,
    max_rehab NUMERIC,
    strategy TEXT [] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);
-- RLS Enforcement
ALTER TABLE public.investor_preferences ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Users can view their own preferences" ON public.investor_preferences FOR
SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.investor_preferences FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.investor_preferences FOR
UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- 2. Allow matching engine to read all preferences for background jobs (Super Admin Service Role capability)
-- For the MVP reacting to client-side triggers, we will allow authenticated users to trigger the match query.
CREATE POLICY "System can read all preferences for matching" ON public.investor_preferences FOR
SELECT TO authenticated USING (true);
-- 3. Extend platform_events with distribution tracking (No hard schema change needed for JSONB, just logical convention)
-- Events: DEAL_DISTRIBUTED, DEAL_VIEWED, DEAL_RESERVED