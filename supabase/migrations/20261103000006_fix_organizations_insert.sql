-- ========================================================================================
-- FIX: "new row violates row-level security policy for table organizations"
-- Objective: Ensure authenticated users can INSERT into the organizations table during signup.
-- ========================================================================================
-- 1. Drop the restrictive or missing INSERT policy on organizations.
-- We use a DO block to dynamically handle whatever the current INSERT policy is named.
DO $$
DECLARE pol RECORD;
BEGIN FOR pol IN
SELECT policyname
FROM pg_policies
WHERE tablename = 'organizations'
    AND schemaname = 'public'
    AND cmd = 'INSERT' LOOP EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.organizations',
        pol.policyname
    );
END LOOP;
END $$;
-- 2. Create a clean, permissive INSERT policy.
-- Notice: We only allow authenticated users to INSERT.
-- The subsequent linkage mapping (linking the user to the organization) happens in the application or trigger,
-- but the creation itself must be allowed linearly without returning an RLS blockade.
CREATE POLICY "Enable insert for authenticated users" ON public.organizations FOR
INSERT TO authenticated WITH CHECK (true);
-- 3. (Optional but Safe) Also ensure there's a fallback SELECT policy for testing if needed
-- If users are locked out of viewing their own orgs, they might get another error downstream.
-- But we'll leave SELECT intact assuming it's correctly mapped to user_organizations or profiles.