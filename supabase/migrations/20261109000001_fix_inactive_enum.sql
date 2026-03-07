-- FIX FOR SUPABASE AUTH SIGNUP DATABASE ERROR
-- During the recent changes to default free tier organizations, the default value was set to 'INACTIVE', 
-- however, 'INACTIVE' was not added to the subscription_status_enum.
ALTER TYPE subscription_status_enum
ADD VALUE IF NOT EXISTS 'INACTIVE';