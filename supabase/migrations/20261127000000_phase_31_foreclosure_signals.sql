-- Migration: Phase 31.1 - Foreclosure Signals (Duplicate Prevention Cache)
CREATE TABLE IF NOT EXISTS public.foreclosure_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_hash TEXT UNIQUE NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    county TEXT,
    filing_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.foreclosure_signals ENABLE ROW LEVEL SECURITY;
-- Allow service role / authenticated to insert and read hashes
CREATE POLICY "Allow service role insertion" ON public.foreclosure_signals FOR
INSERT WITH CHECK (true);
CREATE POLICY "Allow public read for deduplication" ON public.foreclosure_signals FOR
SELECT USING (true);
-- Indexes for fast hash lookups
CREATE INDEX IF NOT EXISTS idx_foreclosure_signals_hash ON public.foreclosure_signals(source_hash);