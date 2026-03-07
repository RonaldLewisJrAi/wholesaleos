-- ========================================================================================
-- WHOLESALE OS - CONSOLIDATED AUTH SIGNUP FIX
-- Resolves "AuthApiError: Database error saving new user"
-- ========================================================================================
-- 1. FIX: Missing Enum Value
-- Ensures organization insertion within triggers doesn't break due to a missing default value
ALTER TYPE subscription_status_enum
ADD VALUE IF NOT EXISTS 'INACTIVE';
-- 2. RLS: Insert Policy for Profiles
-- Ensures the authenticated user is allowed to insert their own profile row upon creation
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR
INSERT WITH CHECK (id = auth.uid());
-- 3. TRIGGER FUNCTION: Safe Profile Generation
-- Extracts metadata passed from the Signup.jsx frontend during auth.signUp()
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE v_first_name TEXT;
v_last_name TEXT;
v_company TEXT;
v_persona TEXT;
BEGIN -- Extract values safely from raw_user_meta_data
v_first_name := new.raw_user_meta_data->>'first_name';
v_last_name := new.raw_user_meta_data->>'last_name';
v_company := new.raw_user_meta_data->>'company';
v_persona := new.raw_user_meta_data->>'primary_persona';
-- Safely insert into profiles without violating NOT NULL or missing columns.
-- NOTE: 'email' is explicitly excluded as it does not exist on the Wholesale OS 'profiles' 
-- schema (Phase 30 drops CASCADE) and is mapped dynamically via auth.users.
INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        company,
        primary_persona
    )
VALUES (
        new.id,
        COALESCE(v_first_name, ''),
        COALESCE(v_last_name, ''),
        COALESCE(v_company, ''),
        COALESCE(v_persona, 'WHOLESALER')
    );
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. TRIGGER BINDING: Attach securely to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();