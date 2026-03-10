-- Phase 17: Deal Proof of Control System
-- 1. Updates deal_documents.
-- 2. Sets up the deal-documents storage bucket.
-- 3. Injects PROOF_OF_CONTROL Trust Score Logic (+5 / -15).
-- Update the existing deal_documents table from Phase 16
ALTER TABLE deal_documents
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')) DEFAULT 'PENDING';
-- Create Storage Bucket for document physical storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-documents', 'deal-documents', true) ON CONFLICT (id) DO NOTHING;
-- Storage RLS Policies (Wholesalers upload, Anyone can read for now based on strict deals isolation)
DROP POLICY IF EXISTS "Allow Uploads to Deal Documents" ON storage.objects;
CREATE POLICY "Allow Uploads to Deal Documents" ON storage.objects FOR
INSERT WITH CHECK (bucket_id = 'deal-documents');
DROP POLICY IF EXISTS "Allow Public Read Deal Documents" ON storage.objects;
CREATE POLICY "Allow Public Read Deal Documents" ON storage.objects FOR
SELECT USING (bucket_id = 'deal-documents');
-- Update the Trust Score Calculation RPC to factor in document verifications
CREATE OR REPLACE FUNCTION calculate_user_trust_score(user_uuid UUID) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_deals_closed INTEGER := 0;
v_escrow_confirmations INTEGER := 0;
v_title_verifications INTEGER := 0;
v_assignments_signed INTEGER := 0;
v_reservations_cancelled INTEGER := 0;
v_investor_no_shows INTEGER := 0;
v_poc_verified INTEGER := 0;
v_poc_rejected INTEGER := 0;
v_raw_score INTEGER := 0;
v_final_score INTEGER := 0;
BEGIN -- Query counts from platform_events table
SELECT COUNT(*) INTO v_deals_closed
FROM platform_events
WHERE user_id = user_uuid
    AND event_type = 'DEAL_CLOSED';
SELECT COUNT(*) INTO v_escrow_confirmations
FROM platform_events
WHERE user_id = user_uuid
    AND event_type = 'ESCROW_CONFIRMED';
SELECT COUNT(*) INTO v_title_verifications
FROM platform_events
WHERE user_id = user_uuid
    AND event_type = 'TITLE_VERIFIED';
SELECT COUNT(*) INTO v_assignments_signed
FROM platform_events
WHERE user_id = user_uuid
    AND event_type = 'ASSIGNMENT_SIGNED';
SELECT COUNT(*) INTO v_reservations_cancelled
FROM platform_events
WHERE user_id = user_uuid
    AND event_type = 'RESERVATION_CANCELLED';
SELECT COUNT(*) INTO v_investor_no_shows
FROM platform_events
WHERE user_id = user_uuid
    AND event_type = 'INVESTOR_NO_SHOW';
-- Phase 17 Document Verification Events
SELECT COUNT(*) INTO v_poc_verified
FROM platform_events
WHERE user_id = user_uuid
    AND event_type = 'PROOF_OF_CONTROL_VERIFIED';
SELECT COUNT(*) INTO v_poc_rejected
FROM platform_events
WHERE user_id = user_uuid
    AND event_type = 'PROOF_OF_CONTROL_REJECTED';
-- Formula
v_raw_score := (v_deals_closed * 30) + (v_escrow_confirmations * 10) + (v_title_verifications * 10) + (v_assignments_signed * 5) + (v_poc_verified * 5) - (v_reservations_cancelled * 10) - (v_investor_no_shows * 15) - (v_poc_rejected * 15);
-- Clamp the score between 0 and 100
IF v_raw_score < 0 THEN v_final_score := 0;
ELSIF v_raw_score > 100 THEN v_final_score := 100;
ELSE v_final_score := v_raw_score;
END IF;
-- Update the profiles table
UPDATE profiles
SET trust_score = v_final_score
WHERE id = user_uuid;
-- Optional: Update the user_trust_scores table for history/logging
INSERT INTO user_trust_scores (user_id, score, calculated_at)
VALUES (user_uuid, v_final_score, NOW()) ON CONFLICT (user_id) DO
UPDATE
SET score = EXCLUDED.score,
    calculated_at = EXCLUDED.calculated_at;
RETURN v_final_score;
END;
$$;