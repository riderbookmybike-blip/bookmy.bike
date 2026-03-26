-- Migration: 20260207_make_ingestion_item_nullable.sql
-- Description: Allow brand-level ingestion sources by making item_id nullable.

ALTER TABLE public.cat_item_ingestion_sources
  ALTER COLUMN item_id DROP NOT NULL;
