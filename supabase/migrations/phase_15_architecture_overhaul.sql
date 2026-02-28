-- ========================================================================================
-- Phase 15: Architecture Overhaul - Storage Bucket Provisioning
-- Description: Creates the physical Supabase Storage buckets for Deal Packets and Documents.
-- It enforces secure file_size_limits and explicit allowed_mime_types to prevent malware uploads.
-- ========================================================================================
-- Enable the Storage extension if not already active (usually active by default in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 1. Create the Secure 'documents' Bucket
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'documents',
        'documents',
        false,
        -- Private bucket! Requires RLS or Signed URLs to access
        10485760,
        -- 10 MB Limit
        '{
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }'
    ) ON CONFLICT (id) DO
UPDATE
SET public = false,
    file_size_limit = 10485760;
-- 2. Create the Public 'deal-packets' Bucket (For Marketing Dispo)
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'deal-packets',
        'deal-packets',
        true,
        -- Public bucket! Buyers need to freely download marketing packets
        26214400,
        -- 25 MB Limit for larger marketing PDFs with images
        '{
        "application/pdf",
        "image/jpeg",
        "image/png"
    }'
    ) ON CONFLICT (id) DO
UPDATE
SET public = true,
    file_size_limit = 26214400;
-- ========================================================================================
-- RLS (Row Level Security) Enforcement on Storage Objects
-- ========================================================================================
-- Grant Public read access ONLY to the 'deal-packets' bucket objects
CREATE POLICY "Public Access to Deal Packets" ON storage.objects FOR
SELECT USING (bucket_id = 'deal-packets');
-- Allow authenticated users to upload to their own directories (assuming they organize by UUID)
CREATE POLICY "Authenticated users can upload deal-packets" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (bucket_id = 'deal-packets');
-- Protect the 'documents' bucket heavily
CREATE POLICY "Authenticated users can read own documents" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'documents'
        AND (
            select auth.uid()
        ) = owner
    );
CREATE POLICY "Authenticated users can upload own documents" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'documents'
        AND (
            select auth.uid()
        ) = owner
    );