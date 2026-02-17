BEGIN;

DO $$
BEGIN
  IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
    ALTER TABLE public.cat_price_mh
      ADD COLUMN IF NOT EXISTS rto_state_roadtaxrate numeric(5,2),
      ADD COLUMN IF NOT EXISTS rto_state_roadtaxcess numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_bh_roadtaxrate numeric(5,2),
      ADD COLUMN IF NOT EXISTS rto_bh_roadtaxcess numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_company_roadtaxrate numeric(5,2),
      ADD COLUMN IF NOT EXISTS rto_company_roadtaxcess numeric(12,2);

    UPDATE public.cat_price_mh
    SET
      rto_state_roadtaxrate = COALESCE(rto_state_roadtaxrate, rto_state_tax_rate),
      rto_state_roadtaxcess = COALESCE(rto_state_roadtaxcess, rto_state_cess),
      rto_bh_roadtaxrate = COALESCE(rto_bh_roadtaxrate, rto_bh_tax_rate),
      rto_bh_roadtaxcess = COALESCE(rto_bh_roadtaxcess, rto_bh_cess),
      rto_company_roadtaxrate = COALESCE(rto_company_roadtaxrate, rto_company_tax_rate),
      rto_company_roadtaxcess = COALESCE(rto_company_roadtaxcess, rto_company_cess);
  END IF;
END $$;

COMMIT;
