-- Phase 20: Priority Deal Blast & Investor Telemetry Engine
-- 1. Modify the deals table to allow priority boosting
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS priority BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS blast_sent_at TIMESTAMP WITH TIME ZONE;
-- 2. Create the core investor telemetry ledger
CREATE TABLE IF NOT EXISTS public.investor_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    -- e.g., 'DEAL_VIEWED', 'WATCHLIST_ADDED', 'DEAL_RESERVED', 'DEAL_INTERESTED'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS Enforcement for Activity Ledger
ALTER TABLE public.investor_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investors can insert their own activity" ON public.investor_activity FOR
INSERT TO authenticated WITH CHECK (auth.uid() = investor_id);
CREATE POLICY "Investors can view their own activity" ON public.investor_activity FOR
SELECT TO authenticated USING (auth.uid() = investor_id);
CREATE POLICY "System can read globally to determine Priority Targetting" ON public.investor_activity FOR
SELECT TO authenticated USING (true);
-- In Phase 30, refine strictly to Service_Role, but MVP relies on authenticated Matchmaking calls.
-- 3. Extend platform_events (implicit JSONB/string rules extensions)
-- Adding logical keys: 'DEAL_BLAST_SENT', 'DEAL_INTERESTED'