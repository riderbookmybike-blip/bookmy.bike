BEGIN;

CREATE TABLE IF NOT EXISTS public.cat_price_state_mh (
  id uuid PRIMARY KEY,
  sku_id uuid NOT NULL REFERENCES public.cat_skus(id),
  state_code text NOT NULL,

  hsn_code text,
  gst_rate numeric(5,2),
  ex_factory numeric(12,2) NOT NULL,
  ex_factory_gst_amount numeric(12,2) NOT NULL,
  logistics_charges numeric(12,2) NOT NULL DEFAULT 0,
  logistics_charges_gst_amount numeric(12,2) NOT NULL DEFAULT 0,
  ex_showroom numeric(12,2) NOT NULL,

  rto_default_type text CHECK (rto_default_type IN ('STATE','BH','COMPANY')),
  rto_registration_fee_state numeric(12,2),
  rto_registration_fee_bh numeric(12,2),
  rto_registration_fee_company numeric(12,2),
  rto_smartcard_charges_state numeric(12,2),
  rto_smartcard_charges_bh numeric(12,2),
  rto_smartcard_charges_company numeric(12,2),
  rto_postal_charges_state numeric(12,2),
  rto_postal_charges_bh numeric(12,2),
  rto_postal_charges_company numeric(12,2),
  rto_roadtax_rate_state numeric(8,4),
  rto_roadtax_rate_bh numeric(8,4),
  rto_roadtax_rate_company numeric(8,4),
  rto_roadtax_amount_state numeric(12,2),
  rto_roadtax_amount_bh numeric(12,2),
  rto_roadtax_amount_company numeric(12,2),
  rto_roadtax_cess_rate_state numeric(8,4),
  rto_roadtax_cess_rate_bh numeric(8,4),
  rto_roadtax_cess_rate_company numeric(8,4),
  rto_roadtax_cess_amount_state numeric(12,2),
  rto_roadtax_cess_amount_bh numeric(12,2),
  rto_roadtax_cess_amount_company numeric(12,2),
  rto_total_state numeric(12,2),
  rto_total_bh numeric(12,2),
  rto_total_company numeric(12,2),

  ins_hsn_code text,
  ins_gst_rate numeric(5,2),
  ins_own_damage_premium_amount numeric(12,2),
  ins_own_damage_tenure_years integer,
  ins_own_damage_gst_amount numeric(12,2),
  ins_own_damage_total_amount numeric(12,2),
  ins_liability_only_premium_amount numeric(12,2),
  ins_liability_only_tenure_years integer,
  ins_liability_only_gst_amount numeric(12,2),
  ins_liability_only_total_amount numeric(12,2),
  ins_sum_mandatory_insurance numeric(12,2),
  ins_sum_mandatory_insurance_gst_amount numeric(12,2),
  ins_gross_premium numeric(12,2),
  ins_base_total numeric(12,2),
  ins_gst_total numeric(12,2),
  ins_net_premium numeric(12,2),
  ins_total numeric(12,2),
  ins_pa numeric(12,2),

  addon_zero_depreciation_amount numeric(12,2),
  addon_zero_depreciation_gst_amount numeric(12,2),
  addon_zero_depreciation_total_amount numeric(12,2),
  addon_zero_depreciation_default boolean,
  addon_engine_protector_amount numeric(12,2),
  addon_engine_protector_gst_amount numeric(12,2),
  addon_engine_protector_total_amount numeric(12,2),
  addon_engine_protector_default boolean,
  addon_return_to_invoice_amount numeric(12,2),
  addon_return_to_invoice_gst_amount numeric(12,2),
  addon_return_to_invoice_total_amount numeric(12,2),
  addon_return_to_invoice_default boolean,
  addon_consumables_cover_amount numeric(12,2),
  addon_consumables_cover_gst_amount numeric(12,2),
  addon_consumables_cover_total_amount numeric(12,2),
  addon_consumables_cover_default boolean,
  addon_roadside_assistance_amount numeric(12,2),
  addon_roadside_assistance_gst_amount numeric(12,2),
  addon_roadside_assistance_total_amount numeric(12,2),
  addon_roadside_assistance_default boolean,
  addon_key_protect_amount numeric(12,2),
  addon_key_protect_gst_amount numeric(12,2),
  addon_key_protect_total_amount numeric(12,2),
  addon_key_protect_default boolean,
  addon_tyre_protect_amount numeric(12,2),
  addon_tyre_protect_gst_amount numeric(12,2),
  addon_tyre_protect_total_amount numeric(12,2),
  addon_tyre_protect_default boolean,
  addon_pillion_cover_amount numeric(12,2),
  addon_pillion_cover_gst_amount numeric(12,2),
  addon_pillion_cover_total_amount numeric(12,2),
  addon_pillion_cover_default boolean,
  addon_personal_accident_cover_amount numeric(12,2),
  addon_personal_accident_cover_gst_amount numeric(12,2),
  addon_personal_accident_cover_total_amount numeric(12,2),
  addon_personal_accident_cover_default boolean,

  on_road_price numeric(12,2),
  publish_stage text CHECK (publish_stage IN ('DRAFT','PUBLISHED','ARCHIVED')),
  published_at timestamptz,
  published_by uuid,
  is_popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT uq_cat_price_state_mh_sku_state UNIQUE (sku_id, state_code),
  CONSTRAINT chk_cat_price_state_mh_ex_non_negative CHECK (
    ex_factory >= 0
    AND ex_factory_gst_amount >= 0
    AND logistics_charges >= 0
    AND logistics_charges_gst_amount >= 0
    AND ex_showroom >= 0
  )
);

CREATE INDEX IF NOT EXISTS ix_cat_price_state_mh_publish_stage
  ON public.cat_price_state_mh (publish_stage);

-- Legacy compatibility columns expected by older source-shape backfill.
ALTER TABLE public.cat_price_mh
  ADD COLUMN IF NOT EXISTS ex_showroom_basic numeric(12,2),
  ADD COLUMN IF NOT EXISTS ex_showroom_gst_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS ex_showroom_total numeric(12,2),
  ADD COLUMN IF NOT EXISTS hsn_insurance text,
  ADD COLUMN IF NOT EXISTS gst_rate_insurance numeric(5,2),
  ADD COLUMN IF NOT EXISTS rto_roadtaxcess_rate_state numeric(8,4),
  ADD COLUMN IF NOT EXISTS rto_roadtaxcess_rate_bh numeric(8,4),
  ADD COLUMN IF NOT EXISTS rto_roadtaxcess_rate_company numeric(8,4),
  ADD COLUMN IF NOT EXISTS rto_roadtaxcessamount_state numeric(12,2),
  ADD COLUMN IF NOT EXISTS rto_roadtaxcessamount_bh numeric(12,2),
  ADD COLUMN IF NOT EXISTS rto_roadtaxcessamount_company numeric(12,2),
  ADD COLUMN IF NOT EXISTS addon_zerodepreciation_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS addon_zerodepreciation_gstamount numeric(12,2),
  ADD COLUMN IF NOT EXISTS addon_zerodepreciation_total numeric(12,2),
  ADD COLUMN IF NOT EXISTS addon_zerodepreciation_default boolean,
  ADD COLUMN IF NOT EXISTS addon_pa_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS addon_pa_gstamount numeric(12,2),
  ADD COLUMN IF NOT EXISTS addon_pa_total numeric(12,2),
  ADD COLUMN IF NOT EXISTS addon_pa_default boolean;

DO $$
BEGIN
  RAISE NOTICE 'Skipping legacy cat_price_state_mh backfill in compatibility reset path';
END
$$;

COMMIT;
