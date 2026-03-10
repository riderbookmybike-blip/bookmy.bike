ALTER TABLE public.fin_marketplace_schemes
    ADD COLUMN IF NOT EXISTS emi_day integer NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS emi_shift_cutoff_day integer NOT NULL DEFAULT 20,
    ADD COLUMN IF NOT EXISTS preclose_lockin_months integer NOT NULL DEFAULT 6,
    ADD COLUMN IF NOT EXISTS foreclosure_slabs_jsonb jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fin_marketplace_schemes_emi_day_chk'
    ) THEN
        ALTER TABLE public.fin_marketplace_schemes
            ADD CONSTRAINT fin_marketplace_schemes_emi_day_chk
            CHECK (emi_day >= 1 AND emi_day <= 31);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fin_marketplace_schemes_emi_shift_cutoff_day_chk'
    ) THEN
        ALTER TABLE public.fin_marketplace_schemes
            ADD CONSTRAINT fin_marketplace_schemes_emi_shift_cutoff_day_chk
            CHECK (emi_shift_cutoff_day >= 1 AND emi_shift_cutoff_day <= 31);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fin_marketplace_schemes_preclose_lockin_months_chk'
    ) THEN
        ALTER TABLE public.fin_marketplace_schemes
            ADD CONSTRAINT fin_marketplace_schemes_preclose_lockin_months_chk
            CHECK (preclose_lockin_months >= 0 AND preclose_lockin_months <= 60);
    END IF;
END $$;
