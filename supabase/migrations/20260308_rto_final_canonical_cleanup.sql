BEGIN;

DO $$
DECLARE
  col record;
BEGIN
  IF to_regclass('public.cat_price_mh') IS NULL THEN
    RETURN;
  END IF;

  -- 1) Canonical columns
  ALTER TABLE public.cat_price_mh
    ADD COLUMN IF NOT EXISTS rto_registration_fee_state numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_registration_fee_bh numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_registration_fee_company numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_smartcard_charges_state numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_smartcard_charges_bh numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_smartcard_charges_company numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_postal_charges_state numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_postal_charges_bh numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_postal_charges_company numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_roadtax_rate_state numeric(5,2),
    ADD COLUMN IF NOT EXISTS rto_roadtax_rate_bh numeric(5,2),
    ADD COLUMN IF NOT EXISTS rto_roadtax_rate_company numeric(5,2),
    ADD COLUMN IF NOT EXISTS rto_roadtax_amount_state numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_roadtax_amount_bh numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_roadtax_amount_company numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_roadtaxcess_rate_state numeric(5,2),
    ADD COLUMN IF NOT EXISTS rto_roadtaxcess_rate_bh numeric(5,2),
    ADD COLUMN IF NOT EXISTS rto_roadtaxcess_rate_company numeric(5,2),
    ADD COLUMN IF NOT EXISTS rto_roadtaxcessamount_state numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_roadtaxcessamount_bh numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_roadtaxcessamount_company numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_total_state numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_total_bh numeric(12,2),
    ADD COLUMN IF NOT EXISTS rto_total_company numeric(12,2);

  -- 2) Backfill from latest available columns
  UPDATE public.cat_price_mh
  SET
    rto_registration_fee_state = COALESCE(rto_registration_fee_state, rto_state_registration::numeric(12,2)),
    rto_registration_fee_bh = COALESCE(rto_registration_fee_bh, rto_bh_registration::numeric(12,2)),
    rto_registration_fee_company = COALESCE(rto_registration_fee_company, rto_company_registration::numeric(12,2)),

    rto_smartcard_charges_state = COALESCE(rto_smartcard_charges_state, rto_smartcard_state),
    rto_smartcard_charges_bh = COALESCE(rto_smartcard_charges_bh, rto_smartcard_bh),
    rto_smartcard_charges_company = COALESCE(rto_smartcard_charges_company, rto_smartcard_company),

    rto_postal_charges_state = COALESCE(rto_postal_charges_state, rto_postal_state),
    rto_postal_charges_bh = COALESCE(rto_postal_charges_bh, rto_postal_bh),
    rto_postal_charges_company = COALESCE(rto_postal_charges_company, rto_postal_company),

    rto_roadtax_rate_state = COALESCE(rto_roadtax_rate_state, rto_state_roadtaxrate, rto_state_tax_rate),
    rto_roadtax_rate_bh = COALESCE(rto_roadtax_rate_bh, rto_bh_roadtaxrate, rto_bh_tax_rate),
    rto_roadtax_rate_company = COALESCE(rto_roadtax_rate_company, rto_company_roadtaxrate, rto_company_tax_rate),

    rto_roadtax_amount_state = COALESCE(rto_roadtax_amount_state, rto_state_tax, rto_state_road_tax::numeric(12,2)),
    rto_roadtax_amount_bh = COALESCE(rto_roadtax_amount_bh, rto_bh_tax, rto_bh_road_tax::numeric(12,2)),
    rto_roadtax_amount_company = COALESCE(rto_roadtax_amount_company, rto_company_tax, rto_company_road_tax::numeric(12,2)),

    rto_roadtaxcess_rate_state = COALESCE(rto_roadtaxcess_rate_state, rto_cess_rate_state),
    rto_roadtaxcess_rate_bh = COALESCE(rto_roadtaxcess_rate_bh, rto_cess_rate_bh),
    rto_roadtaxcess_rate_company = COALESCE(rto_roadtaxcess_rate_company, rto_cess_rate_company),

    rto_roadtaxcessamount_state = COALESCE(rto_roadtaxcessamount_state, rto_state_roadtaxcess, rto_cess_amount_state, rto_state_cess),
    rto_roadtaxcessamount_bh = COALESCE(rto_roadtaxcessamount_bh, rto_bh_roadtaxcess, rto_cess_amount_bh, rto_bh_cess),
    rto_roadtaxcessamount_company = COALESCE(rto_roadtaxcessamount_company, rto_company_roadtaxcess, rto_cess_amount_company, rto_company_cess),

    rto_total_state = COALESCE(rto_total_state, rto_state_total),
    rto_total_bh = COALESCE(rto_total_bh, rto_bh_total),
    rto_total_company = COALESCE(rto_total_company, rto_company_total);

  -- 3) Drop dependent view, then remove non-canonical rto columns
  DROP VIEW IF EXISTS public.v_cat_price_mh_ordered;

  FOR col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cat_price_mh'
      AND column_name LIKE 'rto_%'
      AND column_name NOT IN (
        'rto_default_type',
        'rto_registration_fee_state',
        'rto_registration_fee_bh',
        'rto_registration_fee_company',
        'rto_smartcard_charges_state',
        'rto_smartcard_charges_bh',
        'rto_smartcard_charges_company',
        'rto_postal_charges_state',
        'rto_postal_charges_bh',
        'rto_postal_charges_company',
        'rto_roadtax_rate_state',
        'rto_roadtax_rate_bh',
        'rto_roadtax_rate_company',
        'rto_roadtax_amount_state',
        'rto_roadtax_amount_bh',
        'rto_roadtax_amount_company',
        'rto_roadtaxcess_rate_state',
        'rto_roadtaxcess_rate_bh',
        'rto_roadtaxcess_rate_company',
        'rto_roadtaxcessamount_state',
        'rto_roadtaxcessamount_bh',
        'rto_roadtaxcessamount_company',
        'rto_total_state',
        'rto_total_bh',
        'rto_total_company'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.cat_price_mh DROP COLUMN IF EXISTS %I', col.column_name);
  END LOOP;

  -- 4) Recreate ordered view with canonical columns only
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
    addon1_price,
    addon1_gst,
    addon1_total,
    addon1_default,
    addon2_label,
    addon2_price,
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
END $$;

COMMIT;
