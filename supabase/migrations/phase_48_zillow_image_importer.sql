-- ==============================================================================
-- PHASE 48: ZILLOW IMAGE IMPORTER SCHEMA UPDATE
-- ==============================================================================
-- Description: Adds universal tracking columns to properties, creates property_images, 
-- and configures the property-images Supabase Storage Bucket and RLS.
DO $$ BEGIN RAISE NOTICE 'Starting Phase 48 Zillow Image Importer Schema Update...';
-- 1. Add universal import columns to properties
BEGIN
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS zpid text;
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS sqft numeric;
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS beds numeric;
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS baths numeric;
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS import_status text DEFAULT 'complete';
EXCEPTION
WHEN duplicate_column THEN RAISE NOTICE 'Columns already exist on properties.';
END;
-- 2. Create property_images table
CREATE TABLE IF NOT EXISTS public.property_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    order_index integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
-- 3. Enable RLS on property_images
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
-- Drop existing policies if any to ensure clean slate
DROP POLICY IF EXISTS "Public Read Property Images" ON public.property_images;
DROP POLICY IF EXISTS "Authenticated Insert Property Images" ON public.property_images;
DROP POLICY IF EXISTS "Authenticated Update Property Images" ON public.property_images;
DROP POLICY IF EXISTS "Authenticated Delete Property Images" ON public.property_images;
-- Basic RLS Policies
CREATE POLICY "Public Read Property Images" ON public.property_images FOR
SELECT TO public USING (true);
CREATE POLICY "Authenticated Insert Property Images" ON public.property_images FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated Update Property Images" ON public.property_images FOR
UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated Delete Property Images" ON public.property_images FOR DELETE TO authenticated USING (true);
-- 4. Create property-images storage bucket if missing
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true) ON CONFLICT (id) DO NOTHING;
-- Update bucket public status just in case
UPDATE storage.buckets
SET public = true
WHERE id = 'property-images';
-- Drop existing storage policies
DROP POLICY IF EXISTS "Public Access to Property Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload to Property Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update to Property Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete to Property Images" ON storage.objects;
-- Creates policies for the bucket
CREATE POLICY "Public Access to Property Images" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'property-images');
CREATE POLICY "Authenticated Upload to Property Images" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (bucket_id = 'property-images');
CREATE POLICY "Authenticated Update to Property Images" ON storage.objects FOR
UPDATE TO authenticated USING (bucket_id = 'property-images');
CREATE POLICY "Authenticated Delete to Property Images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-images');
RAISE NOTICE 'Phase 48 Schema Update Complete.';
END $$;