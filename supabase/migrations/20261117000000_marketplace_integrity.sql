-- PHASE 16: Assignment Agreement, Trust System, and Marketplace Integrity
-- 1. Update Deals Table
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS closing_code TEXT,
    ADD COLUMN IF NOT EXISTS claim_deposit_paid BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS claim_deposit_user_id UUID,
    ADD COLUMN IF NOT EXISTS investor_id UUID,
    -- To track who claimed the deal for the assignment
ADD COLUMN IF NOT EXISTS assignment_fee NUMERIC;
-- To track the fee inside the agreement
-- 2. Deal Documents Table
CREATE TABLE IF NOT EXISTS deal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    -- e.g., 'ASSIGNMENT_AGREEMENT', 'TITLE_COMMITMENT'
    file_url TEXT,
    signed_wholesaler BOOLEAN DEFAULT FALSE,
    signed_investor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 3. User Trust Scores Table
CREATE TABLE IF NOT EXISTS user_trust_scores (
    user_id UUID PRIMARY KEY,
    -- Maps to auth.users or profiles
    trust_score INTEGER DEFAULT 50,
    deals_closed INTEGER DEFAULT 0,
    deals_failed INTEGER DEFAULT 0,
    verification_rate NUMERIC DEFAULT 0.0,
    dispute_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 4. Platform Events Tracker
CREATE TABLE IF NOT EXISTS platform_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    -- e.g., 'DEAL_POSTED', 'DEAL_REQUESTED', 'ASSIGNMENT_GENERATED', 'ASSIGNMENT_SIGNED', 'ESCROW_CONFIRMED', 'TITLE_VERIFIED', 'DEAL_CLOSED'
    user_id UUID,
    deal_id UUID,
    event_data JSONB,
    -- Flexible payload for event details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- RLS Policies structure placeholders (to be updated later based on exact org scoping)
ALTER TABLE deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow ALL Documents" ON deal_documents;
CREATE POLICY "Allow ALL Documents" ON deal_documents USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow ALL TrustScores" ON user_trust_scores;
CREATE POLICY "Allow ALL TrustScores" ON user_trust_scores USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow ALL Events" ON platform_events;
CREATE POLICY "Allow ALL Events" ON platform_events USING (true) WITH CHECK (true);