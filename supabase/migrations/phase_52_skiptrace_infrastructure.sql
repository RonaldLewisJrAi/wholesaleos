-- Upgrading the properties table to track Skip Trace Status and Evasion Timestamps
-- This avoids the need to exclusively index owner_contacts per request and acts as a UI lifecycle hook
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS owner_skip_traced_at timestamptz,
    ADD COLUMN IF NOT EXISTS skiptrace_status text DEFAULT 'pending';
-- The status should be one of: 'pending', 'processing', 'complete', 'failed'
ALTER TABLE public.properties
ADD CONSTRAINT chk_skiptrace_status CHECK (
        skiptrace_status IN ('pending', 'processing', 'complete', 'failed')
    );
-- Update any existing properties to 'pending' to render them cleanly in UI
UPDATE public.properties
SET skiptrace_status = 'pending'
WHERE skiptrace_status IS NULL;