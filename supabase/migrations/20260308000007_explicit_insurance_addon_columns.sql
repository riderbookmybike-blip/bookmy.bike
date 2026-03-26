BEGIN;

DO $$
BEGIN
  IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
    -- Drop dependent view before renames/drops.
    DROP VIEW IF EXISTS public.v_cat_price_mh_ordered;

    -- Keep insurance-level HSN/GST fields available.
    ALTER TABLE public.cat_price_mh
      ADD COLUMN IF NOT EXISTS hsn_insurance text,
      ADD COLUMN IF NOT EXISTS gst_rate_insurance numeric(5,2);

    -- Rename generic addon1_* -> addon_zerodepreciation_*
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon1_amount'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon_zerodepreciation_amount'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN addon1_amount TO addon_zerodepreciation_amount;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon1_gst'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon_zerodepreciation_gstamount'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN addon1_gst TO addon_zerodepreciation_gstamount;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon1_total'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon_zerodepreciation_total'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN addon1_total TO addon_zerodepreciation_total;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon1_default'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon_zerodepreciation_default'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN addon1_default TO addon_zerodepreciation_default;
    END IF;

    -- Rename generic addon2_* -> addon_pa_*
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon2_amount'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon_pa_amount'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN addon2_amount TO addon_pa_amount;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon2_gst'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon_pa_gstamount'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN addon2_gst TO addon_pa_gstamount;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon2_total'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon_pa_total'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN addon2_total TO addon_pa_total;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon2_default'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon_pa_default'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN addon2_default TO addon_pa_default;
    END IF;

    -- Remove generic label columns.
    ALTER TABLE public.cat_price_mh
      DROP COLUMN IF EXISTS addon1_label,
      DROP COLUMN IF EXISTS addon2_label;

    -- Backfill PA addon from legacy ins_pa when needed.
    UPDATE public.cat_price_mh
    SET
      addon_pa_amount = COALESCE(addon_pa_amount, ins_pa),
      addon_pa_total = COALESCE(addon_pa_total, ins_pa)
    WHERE ins_pa IS NOT NULL;

    -- Keep ins_pa for backward compatibility with protected publisher action.
    COMMENT ON COLUMN public.cat_price_mh.ins_pa IS 'Legacy compatibility field. Prefer addon_pa_amount/addon_pa_total.';

    -- Rebuild ordered view in compatibility mode (schema can differ across envs).
    CREATE VIEW public.v_cat_price_mh_ordered AS
    SELECT * FROM public.cat_price_mh;
  END IF;
END $$;

COMMIT;
