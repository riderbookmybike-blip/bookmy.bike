BEGIN;

DO $$
BEGIN
  IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
    ALTER TABLE public.cat_price_mh
      ADD COLUMN IF NOT EXISTS rto_postal_state numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_postal_bh numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_postal_company numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_smartcard_state numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_smartcard_bh numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_smartcard_company numeric(12,2);

    -- Backfill grouped columns from best available existing sources.
    UPDATE public.cat_price_mh
    SET
      rto_postal_state = COALESCE(rto_postal_state, rto_state_postal::numeric(12,2), rto_postal),
      rto_postal_bh = COALESCE(rto_postal_bh, rto_bh_postal::numeric(12,2), rto_postal),
      rto_postal_company = COALESCE(rto_postal_company, rto_company_postal::numeric(12,2), rto_postal),
      rto_smartcard_state = COALESCE(rto_smartcard_state, rto_state_smart_card::numeric(12,2), rto_smart_card),
      rto_smartcard_bh = COALESCE(rto_smartcard_bh, rto_bh_smart_card::numeric(12,2), rto_smart_card),
      rto_smartcard_company = COALESCE(rto_smartcard_company, rto_company_smart_card::numeric(12,2), rto_smart_card);

    DROP VIEW IF EXISTS public.v_cat_price_mh_ordered;
    -- Drop legacy/common + legacy mode-specific postal/smart card columns.
    ALTER TABLE public.cat_price_mh
      DROP COLUMN IF EXISTS rto_postal,
      DROP COLUMN IF EXISTS rto_smart_card,
      DROP COLUMN IF EXISTS rto_state_postal,
      DROP COLUMN IF EXISTS rto_bh_postal,
      DROP COLUMN IF EXISTS rto_company_postal,
      DROP COLUMN IF EXISTS rto_state_smart_card,
      DROP COLUMN IF EXISTS rto_bh_smart_card,
      DROP COLUMN IF EXISTS rto_company_smart_card;

    -- Rebuild ordered view with new grouped postal/smartcard columns.
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
      rto_smartcard_state,
      rto_smartcard_bh,
      rto_smartcard_company,
      rto_postal_state,
      rto_postal_bh,
      rto_postal_company,
      rto_state_roadtaxrate,
      rto_state_tax,
      rto_cess_rate_state,
      rto_cess_amount_state,
      rto_state_roadtaxcess,
      rto_state_total,
      rto_bh_roadtaxrate,
      rto_bh_tax,
      rto_cess_rate_bh,
      rto_cess_amount_bh,
      rto_bh_roadtaxcess,
      rto_bh_total,
      rto_company_roadtaxrate,
      rto_company_tax,
      rto_cess_rate_company,
      rto_cess_amount_company,
      rto_company_roadtaxcess,
      rto_company_total,
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
  END IF;
END $$;

COMMIT;
