BEGIN;

-- 1) Drop legacy ordered view (will be recreated against compatibility view if needed later)
DROP VIEW IF EXISTS public.v_cat_price_mh_ordered;

-- 2) Rename old physical table to legacy (idempotent)
DO $$
BEGIN
  IF to_regclass('public.cat_price_mh') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname = 'cat_price_mh' AND c.relkind = 'r'
     )
     AND to_regclass('public.cat_price_mh_legacy') IS NULL
  THEN
    ALTER TABLE public.cat_price_mh RENAME TO cat_price_mh_legacy;
  END IF;
END $$;

-- 3) Force legacy table read-only (defense in depth)
CREATE OR REPLACE FUNCTION public.prevent_cat_price_mh_legacy_writes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'cat_price_mh_legacy is read-only';
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.cat_price_mh_legacy') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_prevent_cat_price_mh_legacy_writes'
    ) THEN
      CREATE TRIGGER trg_prevent_cat_price_mh_legacy_writes
      BEFORE INSERT OR UPDATE OR DELETE ON public.cat_price_mh_legacy
      FOR EACH ROW EXECUTE FUNCTION public.prevent_cat_price_mh_legacy_writes();
    END IF;
  END IF;
END $$;

-- 4) Recreate cat_price_mh as read-only compatibility view mapped from new canonical table
DROP VIEW IF EXISTS public.cat_price_mh;

CREATE VIEW public.cat_price_mh AS
SELECT
  id,
  sku_id,
  state_code,
  ex_showroom,
  on_road_price,
  gst_rate,
  hsn_code,
  rto_default_type,

  -- Legacy insurance aliases
  ins_own_damage_premium_amount AS ins_od_base,
  ins_own_damage_gst_amount AS ins_od_gst,
  ins_own_damage_total_amount AS ins_od_total,
  ins_liability_only_premium_amount AS ins_tp_base,
  ins_liability_only_gst_amount AS ins_tp_gst,
  ins_liability_only_total_amount AS ins_tp_total,
  addon_personal_accident_cover_total_amount AS ins_pa,
  ins_gst_total,
  ins_gst_rate,
  ins_base_total,
  ins_net_premium,
  ins_gross_premium AS ins_total,

  -- Legacy addon aliases
  addon_zero_depreciation_amount AS addon_zerodepreciation_amount,
  addon_zero_depreciation_gst_amount AS addon_zerodepreciation_gstamount,
  addon_zero_depreciation_total_amount AS addon_zerodepreciation_total,
  addon_zero_depreciation_default AS addon_zerodepreciation_default,
  addon_personal_accident_cover_amount AS addon_pa_amount,
  addon_personal_accident_cover_gst_amount AS addon_pa_gstamount,
  addon_personal_accident_cover_total_amount AS addon_pa_total,
  addon_personal_accident_cover_default AS addon_pa_default,

  publish_stage,
  published_at,
  published_by,
  is_popular,
  created_at,
  updated_at,

  -- Legacy ex-showroom breakup aliases
  ex_factory AS ex_showroom_basic,
  ex_factory_gst_amount AS ex_showroom_gst_amount,
  ex_showroom AS ex_showroom_total,

  -- Legacy RTO cess aliases
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
  rto_roadtax_cess_rate_state AS rto_roadtaxcess_rate_state,
  rto_roadtax_cess_rate_bh AS rto_roadtaxcess_rate_bh,
  rto_roadtax_cess_rate_company AS rto_roadtaxcess_rate_company,
  rto_roadtax_cess_amount_state AS rto_roadtaxcessamount_state,
  rto_roadtax_cess_amount_bh AS rto_roadtaxcessamount_bh,
  rto_roadtax_cess_amount_company AS rto_roadtaxcessamount_company,
  rto_total_state,
  rto_total_bh,
  rto_total_company,

  -- Legacy insurance metadata aliases
  ins_hsn_code AS hsn_insurance,
  ins_gst_rate AS gst_rate_insurance
FROM public.cat_price_state_mh;

COMMIT;
