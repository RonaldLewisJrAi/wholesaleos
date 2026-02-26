-- Phase 29: Closed-Loop Learning Engine & Performance Analytics
-- 1. The Deal Outcomes Ledger (The Engine's Truth Data)
-- This table receives the final pulse when a deal is closed (or lost).
-- The data here is aggregated globally to re-weight the Deal Probability Engine.
CREATE TABLE IF NOT EXISTS public.deal_outcomes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    deal_ref_id VARCHAR(100),
    -- Native CRM/Pipeline deal ID
    zip_code VARCHAR(20) NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    -- Predicted Metrics (What the AI guessed)
    predicted_dps DECIMAL(5, 2),
    predicted_afr_min NUMERIC,
    predicted_afr_max NUMERIC,
    predicted_ettc_days INTEGER,
    -- Actual Realized Metrics (What actually happened)
    was_closed BOOLEAN NOT NULL,
    -- True: Deal Won, False: Deal Lost
    actual_assignment_fee NUMERIC,
    -- Only relevant if was_closed = true
    actual_days_to_close INTEGER,
    buyer_interest_velocity INTEGER,
    -- How many buyers requested info/toured
    loss_reason VARCHAR(100),
    -- E.g., 'Seller Backed Out', 'Title Issue', 'No Buyers'
    -- Telemetry
    closed_at TIMESTAMPTZ DEFAULT NOW(),
    logged_by UUID REFERENCES auth.users(id)
);
-- RLS: Organizations can only see their own outcomes for internal reporting,
-- BUT the Global Math Engine will bypass RLS via a Security Definer function to read all rows.
ALTER TABLE public.deal_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own org outcomes" ON public.deal_outcomes FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.role_permissions
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users insert own org outcomes" ON public.deal_outcomes FOR
INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.role_permissions
            WHERE user_id = auth.uid()
        )
    );
-- 2. Team Performance Module (Acquisition & Disposition Logs)
-- Tied specifically to the Pro/Super tiers
CREATE TABLE IF NOT EXISTS public.team_performance_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    rep_user_id UUID NOT NULL REFERENCES auth.users(id),
    team_division VARCHAR(50) NOT NULL,
    -- 'Acquisition' or 'Disposition'
    -- Action tracking (e.g., Cold Call, Text, Contract Sent)
    action_type VARCHAR(50) NOT NULL,
    associated_lead_id VARCHAR(100),
    action_duration_seconds INTEGER,
    action_result VARCHAR(100),
    -- 'Contact Made', 'Voicemail', 'Offer Accepted'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: Users can see their own logs. Admins/Managers can see all org logs.
ALTER TABLE public.team_performance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own performance logs" ON public.team_performance_logs FOR
SELECT USING (
        rep_user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.role_permissions
            WHERE user_id = auth.uid()
                AND role IN ('Admin', 'Manager')
                AND organization_id = team_performance_logs.organization_id
        )
    );
CREATE POLICY "Users log own performance" ON public.team_performance_logs FOR
INSERT WITH CHECK (rep_user_id = auth.uid());
-- 3. Dynamic Model Weights Override (Admin Controlled)
-- If the AI strays, the Super Admin can manually force a weight adjustment
CREATE TABLE IF NOT EXISTS public.ai_model_weights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    weight_name VARCHAR(100) UNIQUE NOT NULL,
    -- e.g., 'dps_equity_multiplier'
    current_value DECIMAL(10, 4) NOT NULL,
    description TEXT,
    last_auto_adjusted_at TIMESTAMPTZ,
    last_manual_override_at TIMESTAMPTZ,
    updated_by UUID REFERENCES auth.users(id)
);
-- Seed initial Baseline Weights
INSERT INTO public.ai_model_weights (weight_name, current_value, description)
VALUES (
        'dps_equity_multiplier',
        1.5,
        'Multiplier applied to equity percentage during DPS calc.'
    ),
    (
        'dps_motivation_multiplier',
        10.0,
        'Multiplier applied to Seller Motivation Index (1-5).'
    ),
    (
        'bdi_velocity_threshold',
        3.0,
        'Minimum BDI score to trigger a Hot Deal flag.'
    ),
    (
        'ettc_baseline_days',
        14.0,
        'Baseline days to close before rehab/title modifiers are applied.'
    ) ON CONFLICT (weight_name) DO NOTHING;
-- RLS: Open read, Admin update
ALTER TABLE public.ai_model_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read AI weights" ON public.ai_model_weights FOR
SELECT USING (true);
CREATE POLICY "Admins update AI weights" ON public.ai_model_weights FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.role_permissions
            WHERE user_id = auth.uid()
                AND role = 'Admin'
                AND organization_id IS NULL
        )
    );
-- 4. Global Market Velocity View
-- A materialized view (or standard view) to query the aggregated data quickly for the Dashboard.
CREATE OR REPLACE VIEW public.vw_market_velocity AS
SELECT zip_code,
    property_type,
    COUNT(*) as total_deals_logged,
    SUM(
        CASE
            WHEN was_closed THEN 1
            ELSE 0
        END
    ) as total_closed,
    ROUND(AVG(actual_assignment_fee), 2) as avg_assignment_fee,
    ROUND(AVG(actual_days_to_close), 1) as avg_days_to_close,
    ROUND(AVG(buyer_interest_velocity), 1) as avg_buyer_velocity,
    ROUND(
        (
            SUM(
                CASE
                    WHEN was_closed THEN 1
                    ELSE 0
                END
            )::NUMERIC / NULLIF(COUNT(*), 0)
        ) * 100,
        2
    ) as conversion_rate_pct
FROM public.deal_outcomes
WHERE was_closed IS TRUE -- Only average won deals for velocity metrics
GROUP BY zip_code,
    property_type;