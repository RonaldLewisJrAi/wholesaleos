-- Phase 38 Schema Update
-- Adds 'DEMO' to the allowed subscription statuses
ALTER TYPE subscription_status_enum
ADD VALUE IF NOT EXISTS 'DEMO';