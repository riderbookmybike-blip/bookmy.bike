-- Allow same scheme_code across different lenders while keeping per-lender uniqueness.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fin_marketplace_schemes_scheme_code_key'
    ) THEN
        ALTER TABLE public.fin_marketplace_schemes
            DROP CONSTRAINT fin_marketplace_schemes_scheme_code_key;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fin_marketplace_schemes_lender_scheme_code_key'
    ) THEN
        ALTER TABLE public.fin_marketplace_schemes
            ADD CONSTRAINT fin_marketplace_schemes_lender_scheme_code_key
            UNIQUE (lender_tenant_id, scheme_code);
    END IF;
END $$;
