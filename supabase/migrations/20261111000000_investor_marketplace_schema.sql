-- ========================================================================================
-- WHOLESALE OS - GLOBAL INVESTOR MARKETPLACE SCHEMA
-- ========================================================================================
-- 1. Ensure `account_type` exists on the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'wholesaler';
-- Retroactively sync any existing INVESTOR personas
UPDATE public.profiles
SET account_type = 'investor'
WHERE primary_persona = 'INVESTOR';
-- 2. Create `investor_profiles` table (Independent of organizations)
CREATE TABLE IF NOT EXISTS public.investor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    investor_name TEXT,
    company_name TEXT,
    phone TEXT,
    budget_min NUMERIC(15, 2) DEFAULT 0,
    budget_max NUMERIC(15, 2) DEFAULT 0,
    deal_capacity_per_month INT DEFAULT 1,
    verified_status TEXT DEFAULT 'pending' CHECK (
        verified_status IN ('pending', 'verified', 'rejected')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_investor_user UNIQUE(user_id)
);
-- Enable RLS on investor_profiles
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
-- 3. Create `investor_buy_boxes` table
CREATE TABLE IF NOT EXISTS public.investor_buy_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,
    markets TEXT [],
    -- e.g., '{"Nashville, TN", "Atlanta, GA"}'
    property_types TEXT [],
    -- e.g., '{"SFR", "Multi-Family"}'
    max_purchase_price NUMERIC(15, 2) DEFAULT 0,
    min_roi NUMERIC(5, 2) DEFAULT 0,
    rehab_levels TEXT [],
    -- e.g., '{"Turnkey", "Heavy Gut"}'
    hold_strategy TEXT,
    -- e.g., 'Fix & Flip', 'Buy & Hold'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS on investor_buy_boxes
ALTER TABLE public.investor_buy_boxes ENABLE ROW LEVEL SECURITY;
-- ========================================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================================
-- A. Policies for `investor_profiles`
-- Investors can select/view their own profile
CREATE POLICY "Investors can view their own profile" ON public.investor_profiles FOR
SELECT USING (user_id = auth.uid());
-- Investors can update their own profile
CREATE POLICY "Investors can update their own profile" ON public.investor_profiles FOR
UPDATE USING (user_id = auth.uid());
-- Investors can insert their own profile
CREATE POLICY "Investors can insert their own profile" ON public.investor_profiles FOR
INSERT WITH CHECK (user_id = auth.uid());
-- Note: Because there is NO policy referencing `get_current_user_org()` or `user_organizations`, 
-- internal organizations inherently CANNOT view, update, or delete `investor_profiles` unless 
-- expressly granted in a future policy matching a marketplace handshake.
-- B. Policies for `investor_buy_boxes`
-- Investors can view their own buy boxes
CREATE POLICY "Investors can view their own buy boxes" ON public.investor_buy_boxes FOR
SELECT USING (
        investor_id IN (
            SELECT id
            FROM public.investor_profiles
            WHERE user_id = auth.uid()
        )
    );
-- Investors can insert their own buy boxes
CREATE POLICY "Investors can insert their own buy boxes" ON public.investor_buy_boxes FOR
INSERT WITH CHECK (
        investor_id IN (
            SELECT id
            FROM public.investor_profiles
            WHERE user_id = auth.uid()
        )
    );
-- Investors can update their own buy boxes
CREATE POLICY "Investors can update their own buy boxes" ON public.investor_buy_boxes FOR
UPDATE USING (
        investor_id IN (
            SELECT id
            FROM public.investor_profiles
            WHERE user_id = auth.uid()
        )
    );
-- Investors can delete their own buy boxes
CREATE POLICY "Investors can delete their own buy boxes" ON public.investor_buy_boxes FOR DELETE USING (
    investor_id IN (
        SELECT id
        FROM public.investor_profiles
        WHERE user_id = auth.uid()
    )
);