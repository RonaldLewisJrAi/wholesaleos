-- Phase 42 Integration: Backend Radar Engine
-- Create isolated table for automated intelligence scraping independent of CRM
CREATE TABLE IF NOT EXISTS public.radar_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    county TEXT,
    auction_date DATE,
    source_url TEXT,
    estimated_arv NUMERIC,
    distress_type TEXT,
    radar_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Establish vital lookup indices for map and feed performance
CREATE INDEX IF NOT EXISTS idx_radar_state ON public.radar_opportunities(state);
CREATE INDEX IF NOT EXISTS idx_radar_auction_date ON public.radar_opportunities(auction_date);
CREATE INDEX IF NOT EXISTS idx_radar_score ON public.radar_opportunities(radar_score);
-- Enable RLS logic for Security Posture
ALTER TABLE public.radar_opportunities ENABLE ROW LEVEL SECURITY;
-- Super Admins and Proxies can read everything. Since it's public market intel, all authenticated users can read.
DROP POLICY IF EXISTS "Radar Opps are readable by all authenticated tier users" ON public.radar_opportunities;
CREATE POLICY "Radar Opps are readable by all authenticated tier users" ON public.radar_opportunities FOR
SELECT USING (auth.role() = 'authenticated');
-- Writing is strict limited to Backend Service Accounts
DROP POLICY IF EXISTS "Radar Opps ingestion restricted to Service Role" ON public.radar_opportunities;
CREATE POLICY "Radar Opps ingestion restricted to Service Role" ON public.radar_opportunities FOR ALL USING (auth.jwt()->>'role' = 'service_role');