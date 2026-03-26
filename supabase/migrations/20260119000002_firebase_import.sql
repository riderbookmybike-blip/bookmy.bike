-- Firebase Import Staging Tables
-- Stores raw Firestore documents (including sub-collections) for review/editing

CREATE TABLE IF NOT EXISTS public.firebase_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_project TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.firebase_import (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.firebase_import_batches(id) ON DELETE CASCADE,
    root_collection TEXT NOT NULL,
    collection_path TEXT NOT NULL,
    document_path TEXT NOT NULL,
    doc_id TEXT NOT NULL,
    parent_path TEXT,
    parent_doc_id TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'RAW' CHECK (status IN ('RAW', 'MAPPED', 'IMPORTED', 'ERROR')),
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (batch_id, collection_path, doc_id)
);

CREATE INDEX IF NOT EXISTS idx_firebase_import_root ON public.firebase_import(root_collection);
CREATE INDEX IF NOT EXISTS idx_firebase_import_collection ON public.firebase_import(collection_path);
CREATE INDEX IF NOT EXISTS idx_firebase_import_docpath ON public.firebase_import(document_path);
CREATE INDEX IF NOT EXISTS idx_firebase_import_data ON public.firebase_import USING gin (data);

-- RLS
ALTER TABLE public.firebase_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firebase_import ENABLE ROW LEVEL SECURITY;

-- Allow admin/superadmin access only
CREATE POLICY "Firebase import admin access (batches)" ON public.firebase_import_batches
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM memberships
            WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'OWNER', 'MARKETPLACE_ADMIN')
            AND status = 'ACTIVE'
        )
    );

CREATE POLICY "Firebase import admin access (rows)" ON public.firebase_import
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM memberships
            WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'OWNER', 'MARKETPLACE_ADMIN')
            AND status = 'ACTIVE'
        )
    );
