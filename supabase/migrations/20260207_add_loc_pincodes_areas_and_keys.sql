-- Add areas list + normalized keys for loc_pincodes
ALTER TABLE public.loc_pincodes
    ADD COLUMN IF NOT EXISTS areas jsonb,
    ADD COLUMN IF NOT EXISTS area_keys jsonb,
    ADD COLUMN IF NOT EXISTS state_key text,
    ADD COLUMN IF NOT EXISTS district_key text,
    ADD COLUMN IF NOT EXISTS taluka_key text;

CREATE INDEX IF NOT EXISTS idx_loc_pincodes_state_key ON public.loc_pincodes(state_key);
CREATE INDEX IF NOT EXISTS idx_loc_pincodes_district_key ON public.loc_pincodes(district_key);
CREATE INDEX IF NOT EXISTS idx_loc_pincodes_taluka_key ON public.loc_pincodes(taluka_key);
