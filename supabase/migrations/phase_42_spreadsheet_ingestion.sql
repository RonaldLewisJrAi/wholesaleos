-- ========================================================================================
-- PHASE 14: SPREADSHEET UTILITY INGESTION ENGINE (CONTROLLED ETL V1)
-- ========================================================================================
-- PART 1: STAGING SCHEMAS
CREATE TABLE IF NOT EXISTS public.staging_lead_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    raw_json_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    row_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (
        status IN ('uploaded', 'mapped', 'imported', 'failed')
    ) DEFAULT 'uploaded',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.lead_import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    imported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- PART 2: STORAGE BUCKET FOR SPREADSHEETS
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'import_files',
        'import_files',
        false,
        10485760,
        -- 10MB limit (10 * 1024 * 1024)
        ARRAY ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    ) ON CONFLICT (id) DO
UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
-- PART 3: ROW LEVEL SECURITY (RLS) FOR TABLES
ALTER TABLE public.staging_lead_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_import_logs ENABLE ROW LEVEL SECURITY;
-- Staging RLS
CREATE POLICY "Users can insert staging data for their org" ON public.staging_lead_imports FOR
INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
        OR public.is_super_admin()
    );
CREATE POLICY "Users can view staging data for their org" ON public.staging_lead_imports FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
        OR public.is_super_admin()
    );
CREATE POLICY "Users can update staging data for their org" ON public.staging_lead_imports FOR
UPDATE USING (
        organization_id IN (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
        OR public.is_super_admin()
    );
CREATE POLICY "Users can delete staging data for their org" ON public.staging_lead_imports FOR DELETE USING (
    organization_id IN (
        SELECT organization_id
        FROM public.profiles
        WHERE id = auth.uid()
    )
    OR public.is_super_admin()
);
-- Logs RLS
CREATE POLICY "Users can insert logs for their org" ON public.lead_import_logs FOR
INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
        OR public.is_super_admin()
    );
CREATE POLICY "Users can view logs for their org" ON public.lead_import_logs FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
        OR public.is_super_admin()
    );
-- PART 4: STORAGE SECURITY POLICIES
-- Supabase Storage operates under the "storage.objects" namespace
CREATE POLICY "Users can upload spreadsheets to their org folder" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'import_files'
        AND (storage.foldername(name)) [1] IN (
            SELECT organization_id::text
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );
CREATE POLICY "Users can read spreadsheets in their org folder" ON storage.objects FOR
SELECT USING (
        bucket_id = 'import_files'
        AND (
            (storage.foldername(name)) [1] IN (
                SELECT organization_id::text
                FROM public.profiles
                WHERE id = auth.uid()
            )
            OR public.is_super_admin()
        )
    );
CREATE POLICY "Users can delete spreadsheets in their org folder" ON storage.objects FOR DELETE USING (
    bucket_id = 'import_files'
    AND (storage.foldername(name)) [1] IN (
        SELECT organization_id::text
        FROM public.profiles
        WHERE id = auth.uid()
    )
);