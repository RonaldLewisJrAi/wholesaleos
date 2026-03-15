-- Phase 58.5: Support Request System 
-- Creates the support_tickets table and associated RLS policies
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
-- Policy: Users can insert their own tickets
CREATE POLICY "Users can insert their own support tickets" ON public.support_tickets FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Policy: Users can view their own tickets
CREATE POLICY "Users can view their own support tickets" ON public.support_tickets FOR
SELECT USING (auth.uid() = user_id);
-- Policy: Super Admins can view all tickets
CREATE POLICY "Super Admins can view all support tickets" ON public.support_tickets FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'super_admin'
        )
    );
-- Policy: Super Admins can update tickets (e.g., change status to resolved)
CREATE POLICY "Super Admins can update support tickets" ON public.support_tickets FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'super_admin'
        )
    );