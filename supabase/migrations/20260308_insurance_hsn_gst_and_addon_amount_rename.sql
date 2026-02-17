BEGIN;

DO $$
BEGIN
  IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
    ALTER TABLE public.cat_price_mh
      ADD COLUMN IF NOT EXISTS hsn_insurance text,
      ADD COLUMN IF NOT EXISTS gst_rate_insurance numeric(5,2);

    -- Rename addon *_price to *_amount (idempotent guards).
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon1_price'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon1_amount'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN addon1_price TO addon1_amount;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon2_price'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon2_amount'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN addon2_price TO addon2_amount;
    END IF;

    -- Best-effort backfill: insurance hsn/gst from existing generic columns.
    UPDATE public.cat_price_mh
    SET
      hsn_insurance = COALESCE(hsn_insurance, hsn_code),
      gst_rate_insurance = COALESCE(gst_rate_insurance, ins_gst_rate::numeric(5,2), gst_rate);

    -- Rebuild ordered view with renamed addon amount columns + insurance hsn/gst.
    DROP VIEW IF EXISTS public.v_cat_price_mh_ordered;
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
      addon1_label,
      addon1_amount,
      addon1_gst,
      addon1_total,
      addon1_default,
      addon2_label,
      addon2_amount,
      addon2_gst,
      addon2_total,
      addon2_default,
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
