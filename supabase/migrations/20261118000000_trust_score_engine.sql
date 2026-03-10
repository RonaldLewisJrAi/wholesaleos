-- Phase 16: Trust Score Engine and Profiler Update
-- Adds the `trust_score` column to `profiles` and created the calculation RPC based on `platform_events`
-- 1. Add trust_score column to profiles if it doesn't exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'trust_score'
) THEN
ALTER TABLE profiles
ADD COLUMN trust_score INTEGER DEFAULT 50;
END IF;
END $$;
-- 2. Create the backend RPC function for calculating Trust Score
CREATE OR REPLACE FUNCTION calculate_user_trust_score(user_uuid UUID) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_deals_closed INTEGER := 0;
v_escrow_confirmations INTEGER := 0;
v_title_verifications INTEGER := 0;
v_assignments_signed INTEGER := 0;
v_reservations_cancelled INTEGER := 0;
v_investor_no_shows INTEGER := 0;
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
-- Formula
v_raw_score := (v_deals_closed * 30) + (v_escrow_confirmations * 10) + (v_title_verifications * 10) + (v_assignments_signed * 5) - (v_reservations_cancelled * 10) - (v_investor_no_shows * 15);
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
-- 3. Create a Trigger to auto-update the score whenever a relevant event occurs
CREATE OR REPLACE FUNCTION trigger_update_trust_score() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN -- Assuming platform_events uses 'event_type' to track the action
    -- we recalculate whenever an event happens for the user
    PERFORM calculate_user_trust_score(NEW.user_id);
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trust_score_auto_update ON platform_events;
CREATE TRIGGER trust_score_auto_update
AFTER
INSERT ON platform_events FOR EACH ROW EXECUTE FUNCTION trigger_update_trust_score();