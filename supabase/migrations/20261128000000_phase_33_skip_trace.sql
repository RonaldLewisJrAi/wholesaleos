-- Migration: Phase 33 - Skip Trace Engine
CREATE TABLE IF NOT EXISTS public.owner_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID,
    -- Can be linked to foreclosure_leads or properties
    owner_name TEXT,
    phone_number TEXT,
    email TEXT,
    confidence_score TEXT CHECK (confidence_score IN ('HIGH', 'MEDIUM', 'LOW')),
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.owner_contacts ENABLE ROW LEVEL SECURITY;
-- Allow authenticated users to manage their traced contacts
-- Policy for authenticated users
CREATE POLICY "Enable insert for authenticated users only" ON public.owner_contacts FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all users" ON public.owner_contacts FOR
SELECT USING (auth.role() = 'authenticated');
-- Also allow service_role to manage
CREATE POLICY "Enable full access for service role" ON public.owner_contacts FOR ALL USING (auth.role() = 'service_role');
-- Add index on property_id
CREATE INDEX IF NOT EXISTS idx_owner_contacts_property_id ON public.owner_contacts(property_id);