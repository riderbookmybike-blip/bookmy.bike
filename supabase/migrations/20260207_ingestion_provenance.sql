-- Migration: 20260207_ingestion_provenance.sql
-- Description: Adds provenance tracking for controlled ingestion engine.
-- Enables idempotent sync via (brand_id, external_id) unique index.

-- 1. Create a unique functional index on provenance external_id + brand_id
-- This prevents duplicate imports of the same source item for a given brand.
-- The index only applies to rows that HAVE provenance data (partial index).
CREATE UNIQUE INDEX IF NOT EXISTS idx_cat_items_provenance_unique
  ON public.cat_items (brand_id, ((specs->'provenance'->>'external_id')))
  WHERE specs->'provenance'->>'external_id' IS NOT NULL;

-- 2. Create an index for fast provenance lookups
CREATE INDEX IF NOT EXISTS idx_cat_items_provenance_source
  ON public.cat_items USING gin ((specs->'provenance'))
  WHERE specs->'provenance' IS NOT NULL;

-- 3. Add structured metadata columns to cat_assets for asset integrity
-- content_type: MIME type (image/webp, video/mp4, etc.)
-- file_size: Size in bytes
-- sha256: SHA-256 hash for deduplication
-- source_url: Original URL the asset was downloaded from
-- parser_version: Version of the parser that ingested this asset
ALTER TABLE public.cat_assets
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS sha256 TEXT;

-- 4. Create a unique index on sha256 + item_id to prevent duplicate assets per item
CREATE UNIQUE INDEX IF NOT EXISTS idx_cat_assets_sha256_item
  ON public.cat_assets (item_id, sha256)
  WHERE sha256 IS NOT NULL;

-- 5. Create an index for fast hash lookups (global dedup check)
CREATE INDEX IF NOT EXISTS idx_cat_assets_sha256
  ON public.cat_assets (sha256)
  WHERE sha256 IS NOT NULL;
