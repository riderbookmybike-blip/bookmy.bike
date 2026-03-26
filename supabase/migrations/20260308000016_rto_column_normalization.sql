BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='cat_price_mh' AND c.relkind='r'
  ) THEN
    ALTER TABLE public.cat_price_mh
      ADD COLUMN IF NOT EXISTS rto_registration numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_smart_card numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_postal numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_state_tax_rate numeric(5,2),
      ADD COLUMN IF NOT EXISTS rto_state_tax numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_state_cess numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_state_total numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_bh_tax_rate numeric(5,2),
      ADD COLUMN IF NOT EXISTS rto_bh_tax numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_bh_cess numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_bh_total numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_company_tax_rate numeric(5,2),
      ADD COLUMN IF NOT EXISTS rto_company_tax numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_company_cess numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_company_total numeric(12,2);
  ELSE
    RAISE NOTICE 'Skipping rto column normalization: public.cat_price_mh is missing or not a table';
  END IF;
END $$;

COMMIT;
