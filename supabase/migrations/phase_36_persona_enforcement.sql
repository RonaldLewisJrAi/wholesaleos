-- ========================================================================================
-- WHOLESALE OS - PHASE 36 STRUCTURAL PERSONA ENFORCEMENT
-- ========================================================================================
-- This script hardens the 'primary_persona' field, transitioning it from a cosmetic UI
-- element to a strictly enforced backend constraint. Standard users can no longer
-- mutate their own persona.
-- ========================================================================================
BEGIN;
-- 1. Redefine the constraint accurately
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_primary_persona_check;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_primary_persona_check CHECK (
        primary_persona IN (
            'WHOLESALER',
            'REALTOR',
            'INVESTOR',
            'VIRTUAL_ASSISTANT',
            'ADMIN',
            'NONE'
        )
    );
-- 2. Create the Trigger Function to Block Unauthorized Persona Mutations
CREATE OR REPLACE FUNCTION enforce_persona_immutability() RETURNS TRIGGER AS $$
DECLARE is_admin BOOLEAN := FALSE;
jwt_role TEXT;
BEGIN -- Only trigger validation if the primary_persona is actually being changed
IF NEW.primary_persona IS DISTINCT
FROM OLD.primary_persona THEN -- Check if it's the service_role (backend bypass)
    BEGIN jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
EXCEPTION
WHEN OTHERS THEN jwt_role := NULL;
END;
IF jwt_role = 'service_role' THEN is_admin := TRUE;
ELSE -- Check if the executing user is a Master Admin or Org Admin
SELECT EXISTS (
        SELECT 1
        FROM auth.users u
            LEFT JOIN public.user_organizations uo ON u.id = uo.user_id
        WHERE u.id = auth.uid()
            AND (
                u.email = 'admin@wholesale-os.com'
                OR uo.role = 'ADMIN'
            )
    ) INTO is_admin;
END IF;
-- If not an admin, block the mutation
IF NOT is_admin THEN RAISE EXCEPTION 'Persona Violation: Only Organization Admins or System Admins can modify a user persona.';
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Attach the Trigger to the profiles table
DROP TRIGGER IF EXISTS restrict_persona_updates ON public.profiles;
CREATE TRIGGER restrict_persona_updates BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION enforce_persona_immutability();
COMMIT;