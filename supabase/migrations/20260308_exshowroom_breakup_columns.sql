-- Add ex-showroom breakup columns in cat_price_mh (non-JSON, amount-only precision model).
-- Keeps backward compatibility with existing ex_showroom column.

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
        ALTER TABLE public.cat_price_mh
            ADD COLUMN IF NOT EXISTS ex_showroom_basic numeric(12,2),
            ADD COLUMN IF NOT EXISTS ex_showroom_gst_amount numeric(12,2),
            ADD COLUMN IF NOT EXISTS ex_showroom_total numeric(12,2),
            ADD COLUMN IF NOT EXISTS hsn_code text,
            ADD COLUMN IF NOT EXISTS gst_rate numeric(5,2);

        -- Normalize legacy ex_showroom into 2-decimal amount.
        ALTER TABLE public.cat_price_mh
            ALTER COLUMN ex_showroom TYPE numeric(12,2) USING ex_showroom::numeric(12,2),
            ALTER COLUMN on_road_price TYPE numeric(12,2) USING on_road_price::numeric(12,2),
            ALTER COLUMN ins_total TYPE numeric(12,2) USING ins_total::numeric(12,2);
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
        UPDATE public.cat_price_mh
        SET ex_showroom_total = COALESCE(ex_showroom_total, ex_showroom);

        -- If gst_rate is available, compute basic/gst split from ex_showroom_total.
        UPDATE public.cat_price_mh
        SET
            ex_showroom_basic = ROUND(
                ex_showroom_total / (1 + (CASE WHEN gst_rate > 1 THEN gst_rate ELSE gst_rate * 100 END) / 100.0),
                2
            ),
            ex_showroom_gst_amount = ROUND(
                ex_showroom_total - (
                    ex_showroom_total / (1 + (CASE WHEN gst_rate > 1 THEN gst_rate ELSE gst_rate * 100 END) / 100.0)
                ),
                2
            )
        WHERE ex_showroom_total IS NOT NULL
          AND gst_rate IS NOT NULL
          AND gst_rate > 0
          AND (ex_showroom_basic IS NULL OR ex_showroom_gst_amount IS NULL);
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
        ALTER TABLE public.cat_price_mh DROP CONSTRAINT IF EXISTS chk_cat_price_mh_ex_amounts_non_negative;
        ALTER TABLE public.cat_price_mh
            ADD CONSTRAINT chk_cat_price_mh_ex_amounts_non_negative
            CHECK (
                COALESCE(ex_showroom_basic, 0) >= 0 AND
                COALESCE(ex_showroom_gst_amount, 0) >= 0 AND
                COALESCE(ex_showroom_total, 0) >= 0
            );
    END IF;
END $$;

COMMIT;
