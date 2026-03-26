DO $$
BEGIN
  IF to_regclass('public.fin_marketplace_schemes') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'fin_marketplace_schemes_lender_scheme_code_key'
    ) THEN
      ALTER TABLE public.fin_marketplace_schemes
        ADD CONSTRAINT fin_marketplace_schemes_lender_scheme_code_key
        UNIQUE (lender_tenant_id, scheme_code);
    END IF;
  ELSE
    RAISE NOTICE 'Skipping fin_marketplace_schemes lender unique constraint: table not found';
  END IF;
END $$;
