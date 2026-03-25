BEGIN;

DO $$
BEGIN
  IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='rto_registration_rate_state'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN rto_registration_rate_state TO rto_registration_fee_state;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='rto_registration_rate_bh'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN rto_registration_rate_bh TO rto_registration_fee_bh;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='rto_registration_rate_company'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN rto_registration_rate_company TO rto_registration_fee_company;
    END IF;
  END IF;
END $$;

COMMIT;
