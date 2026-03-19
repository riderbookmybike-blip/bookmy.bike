-- ============================================================
-- PERF: Drop duplicate UNIQUE CONSTRAINT on cat_skus.sku_code
-- cat_skus_sku_code_key and cat_skus_sku_code_unique both enforce
-- uniqueness on (sku_code) via identical btree indexes.
-- Keep: cat_skus_sku_code_key (original UNIQUE CONSTRAINT).
-- Drop: cat_skus_sku_code_unique (redundant duplicate).
-- Applied: 2026-03-19 | Advisor: duplicate_index lint
-- ============================================================
ALTER TABLE public.cat_skus DROP CONSTRAINT IF EXISTS cat_skus_sku_code_unique;
