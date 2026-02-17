-- Rename cat_pricing to cat_price_mh as per state-level table strategy
-- And revert the accidental ex_showroom_mh column on cat_skus_linear (keep it in separate table)

BEGIN;

-- 1) Rename cat_pricing -> cat_price_mh
DO $$
BEGIN
    IF to_regclass('public.cat_pricing') IS NOT NULL AND to_regclass('public.cat_price_mh') IS NULL THEN
        ALTER TABLE public.cat_pricing RENAME TO cat_price_mh;
        -- Rename unique index created in earlier migrations (it is an index, not a table constraint)
        IF to_regclass('public.uq_cat_pricing_sku_state') IS NOT NULL
           AND to_regclass('public.uq_cat_price_mh_sku_state') IS NULL THEN
            ALTER INDEX public.uq_cat_pricing_sku_state RENAME TO uq_cat_price_mh_sku_state;
        END IF;
    END IF;
END $$;

-- 2) Remove redundant state_code if it's a dedicated state table? 
-- Actually, keep it for now to avoid breaking existing code that queries it, 
-- but we might drop it later. The fetcher uses .eq('state_code', 'MH').
-- If we drop it, we must remove that filter in JS.

-- 3) Clean up cat_skus_linear (remove JSONB-replacement columns added previously)
DO $$
BEGIN
    IF to_regclass('public.cat_skus_linear') IS NOT NULL THEN
        ALTER TABLE public.cat_skus_linear DROP COLUMN IF EXISTS ex_showroom_mh;
    END IF;
END $$;

-- 4) Add helpful comments
DO $$
BEGIN
    IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
        COMMENT ON TABLE public.cat_price_mh IS 'Maharashtra-specific flat pricing table. Replaces cat_pricing (multi-state) with a dedicated state-level table.';
    END IF;
END $$;

COMMIT;
