-- ========================================================================================
-- WHOLESALE OS - PHASE 27: USER PROFILES & INVESTOR BUY BOX SCHEMA
-- ========================================================================================
-- 1. CREATE PROFILES TABLE LINKED TO AUTH.USERS
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    company TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    role TEXT DEFAULT 'Wholesaler' CHECK (role IN ('Wholesaler', 'Investor')),
    -- Investor Buy Box Matrix
    target_markets TEXT DEFAULT '',
    max_price NUMERIC(15, 2) DEFAULT 0,
    min_roi NUMERIC(5, 2) DEFAULT 0,
    property_types TEXT DEFAULT '',
    rehab_level TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and update their own profile." ON profiles FOR ALL USING (auth.uid() = id);
-- 3. AUTO-PROVISION PROFILE TRIGGER
-- Ensure that whenever a new user signs up, a blank profile row is instantly generated
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id)
VALUES (new.id);
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Drop trigger if it exists to prevent duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Bind the trigger to auth.users
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();