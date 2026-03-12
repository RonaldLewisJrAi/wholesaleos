-- Migration: Phase 32 Foreclosure Engine
-- Description: Creates the foreclosure_leads table for the Deal Radar Agent
CREATE TABLE IF NOT EXISTS public.foreclosure_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parcel_id TEXT UNIQUE NOT NULL,
    address TEXT,
    city TEXT,
    county TEXT,
    case_number TEXT,
    auction_date DATE,
    notice_type TEXT,
    deal_score INTEGER DEFAULT 0,
    source_doc TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- RLS Policies
ALTER TABLE public.foreclosure_leads ENABLE ROW LEVEL SECURITY;
-- Allow authenticated users to view leads
CREATE POLICY "View Foreclosure Leads" ON public.foreclosure_leads FOR
SELECT TO authenticated USING (true);
-- Allow authenticated (or service role) to insert/update leads
CREATE POLICY "Insert Foreclosure Leads" ON public.foreclosure_leads FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update Foreclosure Leads" ON public.foreclosure_leads FOR
UPDATE TO authenticated USING (true);
-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_foreclosure_leads_score ON public.foreclosure_leads(deal_score DESC);
CREATE INDEX IF NOT EXISTS idx_foreclosure_leads_county ON public.foreclosure_leads(county);
CREATE INDEX IF NOT EXISTS idx_foreclosure_leads_date ON public.foreclosure_leads(auction_date);