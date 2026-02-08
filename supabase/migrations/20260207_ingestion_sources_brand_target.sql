-- Migration: 20260207_ingestion_sources_brand_target.sql
-- Description: Add brand target support and strict partitioning for ingestion sources.

ALTER TABLE public.cat_item_ingestion_sources
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.cat_brands(id) ON DELETE CASCADE;

ALTER TABLE public.cat_item_ingestion_sources
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.id_tenants(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_cat_item_ingestion_sources_target_xor'
  ) THEN
    ALTER TABLE public.cat_item_ingestion_sources
      ADD CONSTRAINT ck_cat_item_ingestion_sources_target_xor
      CHECK ((brand_id IS NOT NULL) <> (item_id IS NOT NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cat_item_ingestion_sources_brand_id
  ON public.cat_item_ingestion_sources(brand_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_cat_item_ingestion_sources_item_id
  ON public.cat_item_ingestion_sources(item_id)
  WHERE item_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_cat_item_ingestion_sources_brand_id
  ON public.cat_item_ingestion_sources(brand_id)
  WHERE brand_id IS NOT NULL;
