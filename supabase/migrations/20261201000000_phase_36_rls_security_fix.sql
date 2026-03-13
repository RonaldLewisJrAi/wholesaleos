-- Migration: Phase 36 RLS Security Fix & Bootstrap Stabilization
-- Resolves Black Screen issues by enforcing robust identity initialization.
-- 1. Fortify handle_new_user() bootstrap trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_first_name TEXT;
v_last_name TEXT;
v_company TEXT;
v_persona TEXT;
v_org_id UUID;
BEGIN -- Extract Metadata Values with Fallbacks
v_first_name := COALESCE(new.raw_user_meta_data->>'first_name', '');
v_last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');
v_company := COALESCE(
    new.raw_user_meta_data->>'company',
    'Personal Sandbox'
);
v_persona := COALESCE(
    new.raw_user_meta_data->>'primary_persona',
    'WHOLESALER'
);
-- Create default organization with forced error capture
BEGIN
INSERT INTO public.organizations (name, subscription_plan, subscription_tier)
VALUES (v_company, 'FREE', 'BASIC')
RETURNING id INTO v_org_id;
EXCEPTION
WHEN OTHERS THEN -- If organization generation fails, attempt to catch but throw a clearer error
RAISE LOG 'WholesaleOS Bootstrap: Failed to create organization for user %',
new.id;
-- Generate a temporary UUID for the org if the insert actually failed (should rarely happen unless DB locked)
-- Actually, if we use EXCEPTION, we must ensure v_org_id gets something, or we abort.
-- For true safety, let's let postgres abort the transaction if this core step fails so Auth doesn't issue a detached token.
RAISE EXCEPTION 'Failed to create organization during bootstrap';
END;
-- Insert into profiles
BEGIN
INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        company,
        primary_persona,
        organization_id,
        tier
    )
VALUES (
        new.id,
        v_first_name,
        v_last_name,
        v_company,
        v_persona,
        v_org_id,
        'none'
    );
EXCEPTION
WHEN OTHERS THEN RAISE EXCEPTION 'Failed to create profile during bootstrap';
END;
-- Insert into organization_members using the persona as the role
BEGIN
INSERT INTO public.organization_members (user_id, organization_id, role)
VALUES (new.id, v_org_id, v_persona);
EXCEPTION
WHEN OTHERS THEN RAISE EXCEPTION 'Failed to create organization_members mapping during bootstrap';
END;
RETURN new;
END;
$$;
-- Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 2. Implement Missing Profile Recovery RPC
CREATE OR REPLACE FUNCTION public.bootstrap_recovery(p_user_id UUID, p_email TEXT, p_meta JSONB) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_org_id UUID;
v_profile_exists BOOLEAN;
v_first_name TEXT;
v_last_name TEXT;
v_company TEXT;
v_persona TEXT;
BEGIN -- Check if profile already exists to prevent duplicate execution
SELECT EXISTS(
        SELECT 1
        FROM public.profiles
        WHERE id = p_user_id
    ) INTO v_profile_exists;
IF v_profile_exists THEN RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Profile already exists. No recovery needed.'
);
END IF;
v_first_name := COALESCE(p_meta->>'first_name', 'Recovered');
v_last_name := COALESCE(p_meta->>'last_name', 'User');
v_company := COALESCE(p_meta->>'company', 'Recovered Workspace');
v_persona := COALESCE(p_meta->>'primary_persona', 'WHOLESALER');
-- Regenerate Organization
INSERT INTO public.organizations (name, subscription_plan, subscription_tier)
VALUES (v_company, 'FREE', 'BASIC')
RETURNING id INTO v_org_id;
-- Regenerate Profile
INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        company,
        primary_persona,
        organization_id,
        tier
    )
VALUES (
        p_user_id,
        v_first_name,
        v_last_name,
        v_company,
        v_persona,
        v_org_id,
        'none'
    );
-- Regenerate Member Mapping
INSERT INTO public.organization_members (user_id, organization_id, role)
VALUES (p_user_id, v_org_id, v_persona);
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Bootstrap recovery executed successfully.',
    'organization_id',
    v_org_id
);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
-- 3. Enable RLS on Critical Tables & Secure Views
ALTER TABLE public.deal_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.top_investors
SET (security_invoker = true);
-- 4. Apply Organization-Based Access Policies
-- Ensure referenced tables contain the organization_id column before applying policy
ALTER TABLE public.deal_compliance_checks
ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.deal_events
ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.deal_metrics
ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.investor_payouts
ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.investor_reputation_events
ADD COLUMN IF NOT EXISTS organization_id UUID;
-- deal_compliance_checks
DROP POLICY IF EXISTS org_member_deal_compliance_checks ON public.deal_compliance_checks;
CREATE POLICY org_member_deal_compliance_checks ON public.deal_compliance_checks FOR ALL USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);
-- deal_events
DROP POLICY IF EXISTS org_member_deal_events ON public.deal_events;
CREATE POLICY org_member_deal_events ON public.deal_events FOR ALL USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);
-- deal_metrics
DROP POLICY IF EXISTS org_member_deal_metrics ON public.deal_metrics;
CREATE POLICY org_member_deal_metrics ON public.deal_metrics FOR ALL USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);
-- investor_payouts
DROP POLICY IF EXISTS org_member_investor_payouts ON public.investor_payouts;
CREATE POLICY org_member_investor_payouts ON public.investor_payouts FOR ALL USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);
-- investor_reputation_events
DROP POLICY IF EXISTS org_member_reputation_events ON public.investor_reputation_events;
CREATE POLICY org_member_reputation_events ON public.investor_reputation_events FOR ALL USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);
-- closing_verifications (Assuming this requires similar org-based lockdown)
ALTER TABLE public.closing_verifications
ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.closing_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_member_closing_verifications ON public.closing_verifications;
CREATE POLICY org_member_closing_verifications ON public.closing_verifications FOR ALL USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);