-- ========================================================================================
-- WHOLESALE OS - GLOBAL MARKETPLACE INFRASTRUCTURE v1
-- ========================================================================================
-- This migration expands the CRM into a multi-sided marketplace connecting 
-- Wholesalers, Investors, and Title Companies using Stripe Connect & Reputation Logic.
-- ========================================================================================
-- 1. DEAL VISIBILITY SYSTEM
-- ========================================================================================
-- Add visibility controls to deals. Only MARKETPLACE deals are globally discoverable.
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS visibility_level TEXT DEFAULT 'PRIVATE' CHECK (
        visibility_level IN ('PRIVATE', 'VERIFIED_INVESTORS', 'MARKETPLACE')
    );
-- Update existing RLS policies on deals to allow Marketplace discovery
-- Wholesalers keep their existing `get_current_user_org()` isolated policy.
-- Adding a secondary READ policy for external investors:
CREATE POLICY "Investors view marketplace deals" ON public.deals FOR
SELECT USING (
        visibility_level = 'MARKETPLACE'
        AND (
            SELECT primary_persona
            FROM public.profiles
            WHERE id = auth.uid()
        ) = 'INVESTOR'
    );
-- Note: VERIFIED_INVESTORS level might require joining against investors with a verified POF.
-- 2. REPUTATION SYSTEMS (INVESTOR CREDIBILITY)
-- ========================================================================================
ALTER TABLE public.investor_profiles
ADD COLUMN IF NOT EXISTS trust_score INT DEFAULT 50,
    -- Starting base score
ADD COLUMN IF NOT EXISTS deals_closed INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pof_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS title_verified BOOLEAN DEFAULT false;
-- 3. TITLE COMPANY NETWORK
-- ========================================================================================
-- Global directory for title companies (Available to all users)
CREATE TABLE IF NOT EXISTS public.title_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    services TEXT [],
    -- e.g., '{"Escrow", "Double Close", "Blind Settlement"}'
    investor_friendly BOOLEAN DEFAULT false,
    avg_closing_days INT,
    verification_score INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: Title Companies are globally visible to authenticated users
ALTER TABLE public.title_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to title companies" ON public.title_companies FOR
SELECT TO authenticated USING (true);
-- 4. TRANSACTION LAYER (STRIPE CONNECT)
-- ========================================================================================
-- Tracks deposits and assignment fees tied to Stripe Connect.
CREATE TABLE IF NOT EXISTS public.deal_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES public.investor_profiles(id) ON DELETE RESTRICT,
    deposit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (
        payment_status IN (
            'pending',
            'processing',
            'succeeded',
            'failed',
            'refunded'
        )
    ),
    stripe_payment_intent TEXT,
    -- Maps to Stripe Intent ID
    platform_fee NUMERIC(15, 2) DEFAULT 0,
    -- Revenue for Wholesale OS
    closing_status TEXT DEFAULT 'open' CHECK (
        closing_status IN ('open', 'in_escrow', 'cleared', 'cancelled')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: Transacting Parties Isolation
ALTER TABLE public.deal_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wholesalers view their own deal transactions" ON public.deal_transactions FOR
SELECT USING (
        deal_id IN (
            SELECT id
            FROM public.deals
            WHERE organization_id = get_current_user_org()
        )
    );
CREATE POLICY "Investors view their own deal transactions" ON public.deal_transactions FOR
SELECT USING (
        investor_id IN (
            SELECT id
            FROM public.investor_profiles
            WHERE user_id = auth.uid()
        )
    );
-- 5. CLOSING VERIFICATION SYSTEM
-- ========================================================================================
-- Title companies verify deal completions here, generating reputation boosts.
CREATE TABLE IF NOT EXISTS public.closing_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    closing_code TEXT NOT NULL UNIQUE,
    -- E.g., WOS-1234-TOKEN
    title_company_id UUID NOT NULL REFERENCES public.title_companies(id),
    officer_name TEXT NOT NULL,
    closing_date DATE NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS on Closing Verifications
ALTER TABLE public.closing_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wholesalers view their own deal closings" ON public.closing_verifications FOR
SELECT USING (
        deal_id IN (
            SELECT id
            FROM public.deals
            WHERE organization_id = get_current_user_org()
        )
    );
-- We allow an unauthenticated/public verification endpoint to read using a Service Role Edge Function, 
-- or we can create an explicit policy for Title Companies if they are authenticated entity users.