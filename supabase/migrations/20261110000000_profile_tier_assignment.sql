-- ========================================================================================
-- WHOLESALE OS - PROFILE TIER NEUTRALIZATION
-- Ensures new users start with no paid tier (Default: 'none')
-- ========================================================================================
-- 1. PROFILES TABLE: ADD REQUIRED COLUMNS
-- Add 'tier' returning to a neutral unpaid state, and restore 'email' for the trigger.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS email TEXT;
-- 2. CORRECT EXISTING BASIC ASSIGNMENTS
-- If any profiles erroneously default or hold 'basic' without purchase, neutralize them.
UPDATE public.profiles
SET tier = 'none'
WHERE tier = 'basic'
    OR tier = 'BASIC'
    OR tier IS NULL;
-- 3. TRIGGER FUNCTION: EXPLICIT TIER ASSIGNMENT ('none')
-- Safely extract and insert user metadata, explicitly setting tier to 'none' alongside email.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE v_first_name TEXT;
v_last_name TEXT;
v_company TEXT;
v_persona TEXT;
BEGIN v_first_name := new.raw_user_meta_data->>'first_name';
v_last_name := new.raw_user_meta_data->>'last_name';
v_company := new.raw_user_meta_data->>'company';
v_persona := new.raw_user_meta_data->>'primary_persona';
INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        company,
        primary_persona,
        tier
    )
VALUES (
        new.id,
        new.email,
        COALESCE(v_first_name, ''),
        COALESCE(v_last_name, ''),
        COALESCE(v_company, ''),
        COALESCE(v_persona, 'WHOLESALER'),
        'none'
    );
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. BIND TRIGGER TO AUTH.USERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Note on Upgrades:
-- A successful payment event should execute the following pattern:
-- UPDATE public.profiles SET tier = 'basic' WHERE id = auth.uid();
-- UPDATE public.profiles SET tier = 'pro' WHERE id = auth.uid();
-- UPDATE public.profiles SET tier = 'super' WHERE id = auth.uid();