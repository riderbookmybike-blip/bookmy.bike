-- Enforce gallery size; spec constraint will be added when a specs column exists.

-- Clean existing data that violates gallery length
UPDATE cat_skus_linear
SET gallery_urls = gallery_urls[1:20]
WHERE array_length(gallery_urls, 1) > 20;

-- Drop constraints if re-running
DO $$ BEGIN
    ALTER TABLE cat_skus_linear DROP CONSTRAINT IF EXISTS cat_skus_linear_gallery_limit;
END $$;

ALTER TABLE cat_skus_linear
ADD CONSTRAINT cat_skus_linear_gallery_limit
CHECK (gallery_urls IS NULL OR array_length(gallery_urls, 1) <= 20) NOT VALID;

-- Validate after data cleanup
ALTER TABLE cat_skus_linear VALIDATE CONSTRAINT cat_skus_linear_gallery_limit;

-- Optional: prevent unknown top-level spec keys (comment out if too restrictive)
-- ALTER TABLE cat_skus_linear
-- ADD CONSTRAINT cat_skus_linear_specs_allowed_keys
-- CHECK (
--   (SELECT bool_and(key = ANY (ARRAY['cc','power_bhp','torque_nm','range_km','battery_kwh','transmission','kerb_weight_kg']))
--    FROM jsonb_object_keys(specs) AS t(key))
-- );
