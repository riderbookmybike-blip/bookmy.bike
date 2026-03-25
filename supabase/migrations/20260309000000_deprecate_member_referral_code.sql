-- Deprecate id_members.referral_code as an independent identifier.
-- Keep it only as a legacy compatibility mirror of display_id.

-- 1) Backfill existing rows so referral_code mirrors display_id.
UPDATE public.id_members
SET referral_code = display_id
WHERE referral_code IS DISTINCT FROM display_id;

-- 2) Enforce invariant at DB level.
ALTER TABLE public.id_members
DROP CONSTRAINT IF EXISTS id_members_referral_code_matches_display_id;

ALTER TABLE public.id_members
ADD CONSTRAINT id_members_referral_code_matches_display_id
CHECK (
    referral_code IS NULL
    OR display_id IS NULL
    OR referral_code = display_id
);

-- 3) Keep legacy trigger name, but stop generating an independent referral code.
CREATE OR REPLACE FUNCTION public.set_member_codes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.display_id IS NULL OR NEW.display_id = '' THEN
        NEW.display_id := public.generate_unique_member_display_id();
    END IF;

    -- Legacy compatibility: referral_code is now a mirror of display_id.
    NEW.referral_code := NEW.display_id;

    RETURN NEW;
END $$;

COMMENT ON COLUMN public.id_members.referral_code
IS 'Deprecated: legacy compatibility mirror of display_id. Do not use as an independent referral identifier.';
