-- ========================================================================================
-- FIX: INFINITE RECURSION ON public.user_organizations
-- Objective: Drop self-referencing policies and establish a flat, non-recursive RLS matrix
-- ========================================================================================
-- 1. Dynamically drop all existing policies on public.user_organizations
DO $$
DECLARE pol RECORD;
BEGIN FOR pol IN
SELECT policyname
FROM pg_policies
WHERE tablename = 'user_organizations'
    AND schemaname = 'public' LOOP EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.user_organizations',
        pol.policyname
    );
END LOOP;
END $$;
-- 2. Confirm Row-Level Security remains actively enforced
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
-- 3. Create a safe, strictly-isolated policy for ALL (SELECT, INSERT, UPDATE, DELETE)
-- This strictly utilizes flat logic: the deterministic auth token ID, and a direct JWT claim check
CREATE POLICY "safe_user_org_isolation" ON public.user_organizations FOR ALL USING (
    -- Criterion 1: The user can access strictly their own explicit linkage rows
    user_id = auth.uid()
    OR -- Criterion 2: Global Super Admin bypass (Using JWT claims exclusively to mathematically guarantee 0 table subqueries)
    COALESCE(
        (
            current_setting('request.jwt.claims', true)::jsonb
        )->>'system_role',
        ''
    ) = 'GLOBAL_SUPER_ADMIN'
) WITH CHECK (
    user_id = auth.uid()
    OR COALESCE(
        (
            current_setting('request.jwt.claims', true)::jsonb
        )->>'system_role',
        ''
    ) = 'GLOBAL_SUPER_ADMIN'
);