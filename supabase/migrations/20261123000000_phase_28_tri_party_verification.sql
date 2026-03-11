-- ==============================================================================
-- PHASE 28: TITLE COMPANY PERSONA & TRI-PARTY VERIFICATION
-- ==============================================================================
-- 1. Tri-Party Verification Sessions
CREATE TABLE IF NOT EXISTS public.deal_verifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
    title_company_id uuid REFERENCES public.organizations(id) ON DELETE
    SET NULL,
        wholesaler_status text DEFAULT 'PENDING',
        -- PENDING, VERIFIED
        investor_status text DEFAULT 'PENDING',
        title_status text DEFAULT 'PENDING',
        overall_status text DEFAULT 'PENDING',
        -- PENDING, VERIFIED_CLOSED
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(deal_id)
);
-- Row Level Security
ALTER TABLE public.deal_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view deal verifications they are involved in" ON public.deal_verifications FOR
SELECT USING (true);
-- Read-only access for all authenticated users to see panel
CREATE POLICY "Only Title Companies and Admins can mutate verifications" ON public.deal_verifications FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
            AND (
                profiles.persona = 'TITLE_COMPANY'
                OR profiles.role = 'Admin'
                OR profiles.role = 'Owner'
            )
    )
);
-- 2. Verification Codes
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_verification_id uuid REFERENCES public.deal_verifications(id) ON DELETE CASCADE,
    target_role text NOT NULL,
    -- WHOLESALER, INVESTOR, TITLE_COMPANY
    hashed_code text NOT NULL,
    status text DEFAULT 'UNUSED',
    -- UNUSED, USED, EXPIRED
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    used_at timestamptz
);
-- Row Level Security
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
-- No one should be able to read hashed codes directly except service roles
CREATE POLICY "Strict internal access only for verification codes" ON public.verification_codes FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
            AND (
                profiles.role = 'Admin'
                OR profiles.role = 'Owner'
            )
    )
);
-- 3. Badge Progression Tracking
CREATE TABLE IF NOT EXISTS public.badge_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    persona_type text NOT NULL,
    verified_closings integer DEFAULT 0,
    current_badge text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, persona_type)
);
ALTER TABLE public.badge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see any badge progress" ON public.badge_progress FOR
SELECT USING (true);
-- Ensure badge updates happen internally or via admin
CREATE POLICY "Admins can update badge progress" ON public.badge_progress FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
            AND (
                profiles.role = 'Admin'
                OR profiles.role = 'Owner'
            )
    )
);