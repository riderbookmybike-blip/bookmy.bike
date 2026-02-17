-- Normalize RTO columns in cat_price_mh to static + dynamic mode-specific structure.
-- Idempotent and backward-compatible: adds new columns, backfills from legacy columns.

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
        -- Existing amount columns can be integer in current schema; normalize to 2-decimal numeric.
        ALTER TABLE public.cat_price_mh
            ALTER COLUMN rto_state_cess TYPE numeric(12,2) USING rto_state_cess::numeric(12,2),
            ALTER COLUMN rto_bh_cess TYPE numeric(12,2) USING rto_bh_cess::numeric(12,2),
            ALTER COLUMN rto_company_cess TYPE numeric(12,2) USING rto_company_cess::numeric(12,2),
            ALTER COLUMN rto_state_total TYPE numeric(12,2) USING rto_state_total::numeric(12,2),
            ALTER COLUMN rto_bh_total TYPE numeric(12,2) USING rto_bh_total::numeric(12,2),
            ALTER COLUMN rto_company_total TYPE numeric(12,2) USING rto_company_total::numeric(12,2);

        -- Static RTO amount columns (shared across STATE/BH/COMPANY)
        ALTER TABLE public.cat_price_mh
            ADD COLUMN IF NOT EXISTS rto_registration numeric(12,2),
            ADD COLUMN IF NOT EXISTS rto_smart_card numeric(12,2),
            ADD COLUMN IF NOT EXISTS rto_postal numeric(12,2);

        -- STATE dynamic columns
        ALTER TABLE public.cat_price_mh
            ADD COLUMN IF NOT EXISTS rto_state_tax_rate numeric(5,2),
            ADD COLUMN IF NOT EXISTS rto_state_tax numeric(12,2),
            ADD COLUMN IF NOT EXISTS rto_state_cess numeric(12,2),
            ADD COLUMN IF NOT EXISTS rto_state_total numeric(12,2);

        -- BH dynamic columns
        ALTER TABLE public.cat_price_mh
            ADD COLUMN IF NOT EXISTS rto_bh_tax_rate numeric(5,2),
            ADD COLUMN IF NOT EXISTS rto_bh_tax numeric(12,2),
            ADD COLUMN IF NOT EXISTS rto_bh_cess numeric(12,2),
            ADD COLUMN IF NOT EXISTS rto_bh_total numeric(12,2);

        -- COMPANY dynamic columns
        ALTER TABLE public.cat_price_mh
            ADD COLUMN IF NOT EXISTS rto_company_tax_rate numeric(5,2),
            ADD COLUMN IF NOT EXISTS rto_company_tax numeric(12,2),
            ADD COLUMN IF NOT EXISTS rto_company_cess numeric(12,2),
            ADD COLUMN IF NOT EXISTS rto_company_total numeric(12,2);
    END IF;
END $$;

-- Backfill from legacy columns wherever new values are missing.
DO $$
BEGIN
    IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
        UPDATE public.cat_price_mh
        SET
            rto_registration = COALESCE(
                rto_registration,
                rto_state_registration::numeric(12,2),
                rto_bh_registration::numeric(12,2),
                rto_company_registration::numeric(12,2),
                0
            ),
            rto_smart_card = COALESCE(
                rto_smart_card,
                rto_state_smart_card::numeric(12,2),
                rto_bh_smart_card::numeric(12,2),
                rto_company_smart_card::numeric(12,2),
                0
            ),
            rto_postal = COALESCE(
                rto_postal,
                rto_state_postal::numeric(12,2),
                rto_bh_postal::numeric(12,2),
                rto_company_postal::numeric(12,2),
                0
            ),
            rto_state_tax = COALESCE(rto_state_tax, rto_state_road_tax::numeric(12,2), 0),
            rto_bh_tax = COALESCE(rto_bh_tax, rto_bh_road_tax::numeric(12,2), 0),
            rto_company_tax = COALESCE(rto_company_tax, rto_company_road_tax::numeric(12,2), 0),
            rto_state_cess = COALESCE(rto_state_cess, 0),
            rto_bh_cess = COALESCE(rto_bh_cess, 0),
            rto_company_cess = COALESCE(rto_company_cess, 0);

        -- Fill totals after static/dynamic components are populated.
        UPDATE public.cat_price_mh
        SET
            rto_state_total = COALESCE(
                rto_state_total,
                (COALESCE(rto_registration, 0) + COALESCE(rto_smart_card, 0) + COALESCE(rto_postal, 0) +
                 COALESCE(rto_state_tax, 0) + COALESCE(rto_state_cess, 0))
            ),
            rto_bh_total = COALESCE(
                rto_bh_total,
                (COALESCE(rto_registration, 0) + COALESCE(rto_smart_card, 0) + COALESCE(rto_postal, 0) +
                 COALESCE(rto_bh_tax, 0) + COALESCE(rto_bh_cess, 0))
            ),
            rto_company_total = COALESCE(
                rto_company_total,
                (COALESCE(rto_registration, 0) + COALESCE(rto_smart_card, 0) + COALESCE(rto_postal, 0) +
                 COALESCE(rto_company_tax, 0) + COALESCE(rto_company_cess, 0))
            );
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
        ALTER TABLE public.cat_price_mh DROP CONSTRAINT IF EXISTS chk_cat_price_mh_rto_default_type;

        ALTER TABLE public.cat_price_mh
            ADD CONSTRAINT chk_cat_price_mh_rto_default_type
            CHECK (rto_default_type IS NULL OR rto_default_type IN ('STATE', 'BH', 'COMPANY'));
    END IF;
END $$;

COMMIT;
