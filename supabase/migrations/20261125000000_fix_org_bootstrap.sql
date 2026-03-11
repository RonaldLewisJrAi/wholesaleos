-- ========================================================================================
-- WHOLESALE OS - PHASE 31: ORG BOOTSTRAP FIX
-- Resolves "Bootstrap Protocol" infinite loading states and blank profiles
-- ========================================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE v_first_name TEXT;
v_last_name TEXT;
v_company TEXT;
v_persona TEXT;
v_org_id UUID;
BEGIN -- 1. Extract values safely from raw_user_meta_data
v_first_name := new.raw_user_meta_data->>'first_name';
v_last_name := new.raw_user_meta_data->>'last_name';
v_company := COALESCE(
    new.raw_user_meta_data->>'company',
    'Personal Sandbox'
);
v_persona := COALESCE(
    new.raw_user_meta_data->>'primary_persona',
    'WHOLESALER'
);
-- 2. CREATE DEFAULT ORGANIZATION
-- The Bootstrap protocol fails if the user has no org_id in their profile
INSERT INTO public.organizations (name, subscription_tier)
VALUES (v_company, 'BASIC')
RETURNING id INTO v_org_id;
-- 3. Safely insert into profiles
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
        COALESCE(v_first_name, ''),
        COALESCE(v_last_name, ''),
        v_company,
        v_persona,
        v_org_id,
        'none' -- Enforce Phase 38 tier restrictions
    );
-- 4. Satisfy RLS policies by mapping the user to the organization
INSERT INTO public.user_organizations (user_id, organization_id, role)
VALUES (new.id, v_org_id, 'ADMIN');
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Re-bind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- FIX: Retroactively repair broken profiles that have no organization
DO $$
DECLARE broken_profile RECORD;
new_org_id UUID;
BEGIN FOR broken_profile IN
SELECT id,
    COALESCE(company, 'Recovered Sandbox') as company_name
FROM public.profiles
WHERE organization_id IS NULL LOOP
INSERT INTO public.organizations (name, subscription_tier)
VALUES (broken_profile.company_name, 'BASIC')
RETURNING id INTO new_org_id;
UPDATE public.profiles
SET organization_id = new_org_id
WHERE id = broken_profile.id;
INSERT INTO public.user_organizations (user_id, organization_id, role)
VALUES (broken_profile.id, new_org_id, 'ADMIN') ON CONFLICT DO NOTHING;
END LOOP;
END $$;