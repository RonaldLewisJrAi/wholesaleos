-- ==============================================================================
-- PHASE 38: MULTI-TENANT ARCHITECTURE & PERSONA WORKSTATIONS
-- ==============================================================================
-- Description: Implement massive multi-tenant RLS, organizations, and subscription plans.
DO $$ BEGIN RAISE NOTICE 'Starting Phase 38 Multi-Tenant Schema alignment...';
-- 1. Organizations (Multi-tenant core)
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    subscription_tier text DEFAULT 'BASIC',
    -- BASIC, PRO, TEAM, ENTERPRISE
    account_status text DEFAULT 'active',
    team_seat_limit integer DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 2. Update Profiles (Users) to belong to an organization
-- Adding if they don't exist
DO $add_cols$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'organization_id'
) THEN
ALTER TABLE public.profiles
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'role'
) THEN
ALTER TABLE public.profiles
ADD COLUMN role text DEFAULT 'User';
-- Owner, Admin, Manager, User, Viewer
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'persona'
) THEN
ALTER TABLE public.profiles
ADD COLUMN persona text;
-- Acquisition, Disposition, Admin Command, Compliance, Analyst
END IF;
END $add_cols$;
-- 3. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_customer_id text,
    stripe_subscription_id text,
    status text DEFAULT 'active',
    current_period_end timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 4. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    seller_name text NOT NULL,
    phone text,
    email text,
    property_address text,
    status text DEFAULT 'New',
    -- New, Pre-Screen, Follow-Up, Dead
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 5. Properties Table (Ensure organization_id exists)
DO $prop_org$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'properties'
        AND column_name = 'organization_id'
) THEN
ALTER TABLE public.properties
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
END IF;
END $prop_org$;
-- 6. Deals Table (Ensure organization_id exists)
DO $deal_org$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'deals'
        AND column_name = 'organization_id'
) THEN
ALTER TABLE public.deals
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
END IF;
END $deal_org$;
-- 7. Buyers Table
CREATE TABLE IF NOT EXISTS public.buyers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text,
    phone text,
    buying_criteria text,
    vip_status boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 8. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE
    SET NULL,
        action text NOT NULL,
        entity_type text,
        entity_id uuid,
        details jsonb,
        created_at timestamptz DEFAULT now()
);
-- 9. Documents
DO $doc_org$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'documents'
        AND column_name = 'organization_id'
) THEN
ALTER TABLE public.documents
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
END IF;
END $doc_org$;
RAISE NOTICE 'Phase 38 Schema Alignment Complete.';
END $$;