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

    -- Rebuild ordered view with explicit addon names.
    CREATE VIEW public.v_cat_price_mh_ordered AS
    SELECT
      id,
      sku_id,
      state_code,
      ex_showroom,
      ex_showroom_basic,
      ex_showroom_gst_amount,
      ex_showroom_total,
      gst_rate,
      hsn_code,
      hsn_insurance,
      gst_rate_insurance,
      on_road_price,
      rto_default_type,
      rto_registration_fee_state,
      rto_registration_fee_bh,
      rto_registration_fee_company,
      rto_smartcard_charges_state,
      rto_smartcard_charges_bh,
      rto_smartcard_charges_company,
      rto_postal_charges_state,
      rto_postal_charges_bh,
      rto_postal_charges_company,
      rto_roadtax_rate_state,
      rto_roadtax_rate_bh,
      rto_roadtax_rate_company,
      rto_roadtax_amount_state,
      rto_roadtax_amount_bh,
      rto_roadtax_amount_company,
      rto_roadtaxcess_rate_state,
      rto_roadtaxcess_rate_bh,
      rto_roadtaxcess_rate_company,
      rto_roadtaxcessamount_state,
      rto_roadtaxcessamount_bh,
      rto_roadtaxcessamount_company,
      rto_total_state,
      rto_total_bh,
      rto_total_company,
      ins_od_base,
      ins_od_gst,
      ins_od_total,
      ins_tp_base,
      ins_tp_gst,
      ins_tp_total,
      ins_pa,
      ins_gst_total,
      ins_gst_rate,
      ins_base_total,
      ins_net_premium,
      ins_total,
      addon_zerodepreciation_amount,
      addon_zerodepreciation_gstamount,
      addon_zerodepreciation_total,
      addon_zerodepreciation_default,
      addon_pa_amount,
      addon_pa_gstamount,
      addon_pa_total,
      addon_pa_default,
      publish_stage,
      published_at,
      published_by,
      is_popular,
      created_at,
      updated_at
    FROM public.cat_price_mh;
  END IF;
END $$;

COMMIT;
