-- Migration: Fix cat_item_ingestion_sources schema
-- Goal: Ensure compatibility with Supabase upsert and support brand-level ingestion.

-- 1. Make item_id nullable (important for brand-level ingestion)
ALTER TABLE public.cat_item_ingestion_sources 
  ALTER COLUMN item_id DROP NOT NULL;

-- 2. Drop existing partial unique indexes
DROP INDEX IF EXISTS public.ux_cat_item_ingestion_sources_item_id;
DROP INDEX IF EXISTS public.ux_cat_item_ingestion_sources_brand_id;

-- 3. Add standard unique constraints
-- Note: Postgres allows multiple NULL values in UNIQUE constrained columns.
ALTER TABLE public.cat_item_ingestion_sources
  DROP CONSTRAINT IF EXISTS cat_item_ingestion_sources_item_id_key;
ALTER TABLE public.cat_item_ingestion_sources
  ADD CONSTRAINT cat_item_ingestion_sources_item_id_key UNIQUE (item_id);

ALTER TABLE public.cat_item_ingestion_sources
  DROP CONSTRAINT IF EXISTS cat_item_ingestion_sources_brand_id_key;
ALTER TABLE public.cat_item_ingestion_sources
  ADD CONSTRAINT cat_item_ingestion_sources_brand_id_key UNIQUE (brand_id);
