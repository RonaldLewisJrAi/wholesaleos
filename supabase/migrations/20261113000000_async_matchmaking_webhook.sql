-- ========================================================================================
-- WHOLESALE OS - REFACTOR TO ASYNC MATCHMAKING (EDGE FUNCTION WEBHOOK)
-- ========================================================================================
-- 1. DROP THE SYNCHRONOUS BOTTLENECK
DROP TRIGGER IF EXISTS trigger_match_deals_to_investors ON public.deals;
DROP FUNCTION IF EXISTS filter_and_match_investors();
-- 2. CREATE DATABASE WEBHOOK
-- This assumes the HTTP extension is enabled (Supabase standard)
-- It asynchronously fires a POST request to our Edge Function when a deal is inserted or updated.
-- Enable pg_net if not already enabled (Required for Webhooks in modern Supabase setups)
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE OR REPLACE FUNCTION notify_edge_function_matchmaking() RETURNS TRIGGER AS $$
DECLARE endpoint_url TEXT := current_setting('app.settings.edge_function_url', true) || '/match-deal';
anon_key TEXT := current_setting('app.settings.anon_key', true);
BEGIN -- We only send the Deal ID and Property ID to keep the payload light.
-- The Edge function will securely query the rest.
PERFORM net.http_post(
    url := endpoint_url,
    headers := jsonb_build_object(
        'Content-Type',
        'application/json',
        'Authorization',
        'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
        'deal_id',
        NEW.id,
        'property_id',
        NEW.property_id
    )
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. ATTACH THE ASYNCHRONOUS WEBHOOK TRIGGER
CREATE TRIGGER trigger_async_matchmaking
AFTER
INSERT
    OR
UPDATE OF contract_price,
    assignment_fee ON public.deals FOR EACH ROW EXECUTE FUNCTION notify_edge_function_matchmaking();
-- NOTE: The deal_matches table and indexes (idx_deal_matches_deal_id, etc) were successfully 
-- created in the previous migration (20261112000000_deal_matchmaking_engine.sql). They remain unchanged.