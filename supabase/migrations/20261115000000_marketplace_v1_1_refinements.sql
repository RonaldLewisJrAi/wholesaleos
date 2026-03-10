-- ========================================================================================
-- WHOLESALE OS - MARKETPLACE v1.1 REFINEMENTS
-- ========================================================================================
-- Targeted infrastructure fixes: Moving reputation to Edge Functions, enabling Reverse
-- Matchmaking, enforcing match indexes, and scaffolding the Notification Engine.
-- ========================================================================================
-- Enable pg_net if not already enabled (Required for Webhooks)
CREATE EXTENSION IF NOT EXISTS pg_net;
-- ========================================================================================
-- SECTION 1: MOVE REPUTATION UPDATES OUT OF DATABASE TRIGGERS
-- ========================================================================================
-- 1. Drop any previous reputation-updating PostgreSQL triggers on closing_verifications
-- (Ensuring no sync loops exist that could block transaction commits)
DROP TRIGGER IF EXISTS trigger_update_investor_reputation ON public.closing_verifications;
DROP FUNCTION IF EXISTS update_investor_reputation_sync();
-- 2. Create Async Webhook for Reputation Engine
CREATE OR REPLACE FUNCTION notify_edge_function_update_reputation() RETURNS TRIGGER AS $$
DECLARE endpoint_url TEXT := current_setting('app.settings.edge_function_url', true) || '/update-reputation';
anon_key TEXT := current_setting('app.settings.anon_key', true);
BEGIN PERFORM net.http_post(
    url := endpoint_url,
    headers := jsonb_build_object(
        'Content-Type',
        'application/json',
        'Authorization',
        'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
        'closing_verification_id',
        NEW.id,
        'deal_id',
        NEW.deal_id,
        'title_company_id',
        NEW.title_company_id
    )
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trigger_async_reputation_update ON public.closing_verifications;
CREATE TRIGGER trigger_async_reputation_update
AFTER
INSERT ON public.closing_verifications FOR EACH ROW EXECUTE FUNCTION notify_edge_function_update_reputation();
-- ========================================================================================
-- SECTION 2: REVERSE MATCHMAKING WEBHOOK
-- ========================================================================================
CREATE OR REPLACE FUNCTION notify_edge_function_match_investor() RETURNS TRIGGER AS $$
DECLARE endpoint_url TEXT := current_setting('app.settings.edge_function_url', true) || '/match-investor';
anon_key TEXT := current_setting('app.settings.anon_key', true);
BEGIN PERFORM net.http_post(
    url := endpoint_url,
    headers := jsonb_build_object(
        'Content-Type',
        'application/json',
        'Authorization',
        'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
        'investor_id',
        NEW.investor_id,
        'buy_box_id',
        NEW.id
    )
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trigger_async_reverse_matchmaking ON public.investor_buy_boxes;
CREATE TRIGGER trigger_async_reverse_matchmaking
AFTER
INSERT
    OR
UPDATE ON public.investor_buy_boxes FOR EACH ROW EXECUTE FUNCTION notify_edge_function_match_investor();
-- ========================================================================================
-- SECTION 3: ADD REQUIRED INDEXES FOR MATCHING PERFORMANCE
-- ========================================================================================
-- Investor buy box search (GIN Indexes for array intersections)
ALTER TABLE public.investor_buy_boxes
ADD COLUMN IF NOT EXISTS markets TEXT [] DEFAULT '{}';
ALTER TABLE public.investor_buy_boxes
ADD COLUMN IF NOT EXISTS property_types TEXT [] DEFAULT '{}';
ALTER TABLE public.investor_buy_boxes
ADD COLUMN IF NOT EXISTS rehab_levels TEXT [] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_buy_boxes_markets ON public.investor_buy_boxes USING GIN (markets);
CREATE INDEX IF NOT EXISTS idx_buy_boxes_property_types ON public.investor_buy_boxes USING GIN (property_types);
-- Deal match lookup (B-Tree Indexes for rapid lookups and sorting)
CREATE INDEX IF NOT EXISTS idx_deal_matches_investor_id ON public.deal_matches(investor_id);
CREATE INDEX IF NOT EXISTS idx_deal_matches_deal_id ON public.deal_matches(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_matches_score ON public.deal_matches(match_score DESC);
-- ========================================================================================
-- SECTION 4: NOTIFICATION ENGINE
-- ========================================================================================
-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    -- 'NEW_DEAL_MATCH', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', etc.
    entity_type TEXT NOT NULL,
    -- 'deal', 'offer', 'closing'
    entity_id UUID NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: Users can only read / dismiss their own notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR
SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR
UPDATE USING (user_id = auth.uid());
-- 2. Async Webhook for Notification Processing
CREATE OR REPLACE FUNCTION notify_edge_function_process_notifications() RETURNS TRIGGER AS $$
DECLARE endpoint_url TEXT := current_setting('app.settings.edge_function_url', true) || '/process-notifications';
anon_key TEXT := current_setting('app.settings.anon_key', true);
BEGIN PERFORM net.http_post(
    url := endpoint_url,
    headers := jsonb_build_object(
        'Content-Type',
        'application/json',
        'Authorization',
        'Bearer ' || anon_key
    ),
    body := jsonb_build_object('notification_id', NEW.id)
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trigger_async_process_notifications ON public.notifications;
CREATE TRIGGER trigger_async_process_notifications
AFTER
INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION notify_edge_function_process_notifications();