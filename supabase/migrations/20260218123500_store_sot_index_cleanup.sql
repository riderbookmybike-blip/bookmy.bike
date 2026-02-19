-- Performance cleanup for store SOT surfaces.
-- 1) Add missing FK-covering indexes used by catalog/PDP joins.
-- 2) Drop duplicate indexes on inv_stock (keep one per column).

DO $$
BEGIN
  IF to_regclass('public.cat_skus') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_cat_skus_brand_id ON public.cat_skus (brand_id);
    CREATE INDEX IF NOT EXISTS idx_cat_skus_colour_id ON public.cat_skus (colour_id);
  END IF;
END $$;

-- Duplicate index pairs flagged by advisor:
-- keep idx_inv_stock_current_owner_id + idx_inv_stock_sku_id, drop duplicates.
DROP INDEX IF EXISTS public.idx_inventory_owner;
DROP INDEX IF EXISTS public.idx_inventory_sku;
