DROP TABLE IF EXISTS public.processed_stripe_events;
CREATE TABLE public.processed_stripe_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id text UNIQUE NOT NULL,
    type text NOT NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);
DROP TABLE IF EXISTS public.stripe_event_failures;
CREATE TABLE public.stripe_event_failures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id text NOT NULL,
    error_message text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);