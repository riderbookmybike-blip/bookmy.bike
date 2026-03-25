-- Migration: 20260208_inbound_source_persistence.sql
-- Description: Creates a table to persist inbound source HTML and URLs for catalog items.
-- This enables auditing and re-syncing from original sources.

CREATE TABLE IF NOT EXISTS public.cat_item_ingestion_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.cat_items(id) ON DELETE CASCADE,
    sources JSONB NOT NULL, -- Array of { url, html, status }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID REFERENCES public.id_tenants(id), -- For multi-tenant security
    UNIQUE(item_id)
);

-- Enable RLS
ALTER TABLE public.cat_item_ingestion_sources ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (Simplified for admin/internal users)
-- Assuming adminClient/service_role bypass or standard tenant check
CREATE POLICY "Enable all access for tenant members"
ON public.cat_item_ingestion_sources
FOR ALL
USING (auth.uid() IN (
    SELECT member_id FROM public.id_member_tenants WHERE tenant_id = cat_item_ingestion_sources.tenant_id
));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_cat_item_ingestion_sources_item_id ON public.cat_item_ingestion_sources(item_id);
