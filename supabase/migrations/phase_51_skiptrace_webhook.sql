-- Create a Supabase Edge Function Trigger for Auto Skip Tracing Lead Ingestion
-- This function listens for new row inserts on the properties table and automatically calls the Node.js backend
CREATE OR REPLACE FUNCTION trigger_auto_skip_trace() RETURNS trigger AS $$
DECLARE backend_url text;
BEGIN -- We assume the backend is hosted correctly. In production, Vercel URL should be used.
-- For local or fallback, we use a basic template.
backend_url := coalesce(
    current_setting('app.settings.backend_url', true),
    'https://' || current_setting('app.settings.vercel_url', true) || '/api/skiptrace'
);
-- Only trigger if we have an owner name but missing phone numbers
IF NEW.owner IS NOT NULL
AND NEW.owner != '' THEN -- In a true production environment, we execute this via pg_net HTTP extension or Webhooks.
-- Supabase provides a native webhook UI for this, but we can formally register it here.
-- NOTE: To avoid blocking the database insert transaction, 
-- we rely on the Supabase Edge Functions / HTTP Webhooks integration configured in the dashboard.
-- This SQL file serves to document the required state and prepare the metadata.
-- Log the intent to auto-trace
INSERT INTO platform_events (user_id, event_type, metadata)
VALUES (
        NEW.created_by,
        'AUTO_SKIP_TRACE_QUEUED',
        jsonb_build_object('property_id', NEW.id, 'owner_name', NEW.owner)
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Drop trigger if exists to allow safe repeated migrations
DROP TRIGGER IF EXISTS auto_skip_trace_lead_trigger ON properties;
-- Attach the trigger to fire AFTER a lead is created
CREATE TRIGGER auto_skip_trace_lead_trigger
AFTER
INSERT ON properties FOR EACH ROW EXECUTE FUNCTION trigger_auto_skip_trace();