-- ============================================================
-- Migration: Region-first winners (MMRDA rollout foundation)
-- Date: 2026-03-30
-- ============================================================

-- 1) Area master: add region (State > Region > District > Taluka > Area > Pincode)
ALTER TABLE IF EXISTS public.loc_pincodes
    ADD COLUMN IF NOT EXISTS region text;

CREATE INDEX IF NOT EXISTS idx_loc_pincodes_region_state
    ON public.loc_pincodes (state_code, region);

UPDATE public.loc_pincodes
SET region = 'MMRDA'
WHERE state_code = 'MH'
  AND district IN ('Mumbai City', 'Mumbai Suburban', 'Thane', 'Palghar', 'Raigad')
  AND (region IS NULL OR btrim(region) = '');

-- 2) Dealership service-area tables: add region
ALTER TABLE IF EXISTS public.id_dealer_service_areas
    ADD COLUMN IF NOT EXISTS region text;

CREATE INDEX IF NOT EXISTS idx_dealer_service_areas_region_state
    ON public.id_dealer_service_areas (state_code, region);

UPDATE public.id_dealer_service_areas
SET region = 'MMRDA'
WHERE state_code = 'MH'
  AND district IN ('Mumbai City', 'Mumbai Suburban', 'Thane', 'Palghar', 'Raigad')
  AND (region IS NULL OR btrim(region) = '');

-- 3) Add region to primary dealer mapping (winner compute source)
ALTER TABLE IF EXISTS public.id_primary_dealer_districts
    ADD COLUMN IF NOT EXISTS region text;

CREATE INDEX IF NOT EXISTS idx_primary_dealer_region_state
    ON public.id_primary_dealer_districts (state_code, region)
    WHERE is_active = true AND region IS NOT NULL;

-- 4) Materialized winner target: one winner per sku+region+state
CREATE TABLE IF NOT EXISTS public.sku_region_winners (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id               uuid NOT NULL REFERENCES public.cat_skus(id) ON DELETE CASCADE,
    region               text NOT NULL,
    state_code           text NOT NULL DEFAULT 'MH',
    tenant_id            uuid NOT NULL REFERENCES public.id_tenants(id) ON DELETE CASCADE,
    winning_offer_amount numeric NOT NULL DEFAULT 0,
    tat_days             integer,
    tat_effective_hours  integer,
    computed_at          timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sku_region_winners_unique
    ON public.sku_region_winners (sku_id, region, state_code);

CREATE INDEX IF NOT EXISTS idx_sku_region_winners_region
    ON public.sku_region_winners (region, state_code);

CREATE INDEX IF NOT EXISTS idx_sku_region_winners_sku
    ON public.sku_region_winners (sku_id);

DROP TRIGGER IF EXISTS trgr_sku_region_winners_updated_at ON public.sku_region_winners;
CREATE TRIGGER trgr_sku_region_winners_updated_at
    BEFORE UPDATE ON public.sku_region_winners
    FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();

-- 5) Serviceable regions view for UI/API
CREATE OR REPLACE VIEW public.v_serviceable_regions AS
SELECT DISTINCT
    region,
    state_code
FROM public.id_primary_dealer_districts
WHERE is_active = true
  AND region IS NOT NULL
  AND btrim(region) <> ''
ORDER BY region;

-- 6) Seed MMRDA in primary dealer map from known local-train coverage districts
UPDATE public.id_primary_dealer_districts
SET region = 'MMRDA',
    updated_at = now()
WHERE state_code = 'MH'
  AND district IN ('Mumbai City', 'Mumbai Suburban', 'Thane', 'Palghar', 'Raigad');
