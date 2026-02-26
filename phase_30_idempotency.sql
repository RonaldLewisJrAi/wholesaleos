-- Phase 30: Stripe Webhook Idempotency Engine
-- Create a ledger to track processed Stripe events to prevent double-crediting
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);
-- Protect the idempotency ledger via RLS (Only accessible via backend service_role key)
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;
-- Deny all read/write from authenticated frontend clients
CREATE POLICY "Strict Backend Only Access" ON public.processed_stripe_events FOR ALL USING (false);
-- Note: The Supabase Service Role Key bypasses all RLS policies natively, 
-- allowing the Vercel Serverless Webhook to query and insert freely without exposing the ledger.