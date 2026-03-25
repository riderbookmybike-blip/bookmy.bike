-- Enforce gallery size when linear SKU table exists.
DO $$
BEGIN
  IF to_regclass('public.cat_skus_linear') IS NULL THEN
    RAISE NOTICE 'Skipping linear catalog checks: public.cat_skus_linear does not exist';
    RETURN;
  END IF;

  EXECUTE $sql$
    UPDATE public.cat_skus_linear
    SET gallery_urls = gallery_urls[1:20]
    WHERE array_length(gallery_urls, 1) > 20
  $sql$;

  EXECUTE 'ALTER TABLE public.cat_skus_linear DROP CONSTRAINT IF EXISTS cat_skus_linear_gallery_limit';
  EXECUTE $sql$
    ALTER TABLE public.cat_skus_linear
    ADD CONSTRAINT cat_skus_linear_gallery_limit
    CHECK (gallery_urls IS NULL OR array_length(gallery_urls, 1) <= 20) NOT VALID
  $sql$;
  EXECUTE 'ALTER TABLE public.cat_skus_linear VALIDATE CONSTRAINT cat_skus_linear_gallery_limit';
END
$$;

-- Optional: prevent unknown top-level spec keys (comment out if too restrictive)
-- ALTER TABLE cat_skus_linear
-- ADD CONSTRAINT cat_skus_linear_specs_allowed_keys
-- CHECK (
--   (SELECT bool_and(key = ANY (ARRAY['cc','power_bhp','torque_nm','range_km','battery_kwh','transmission','kerb_weight_kg']))
--    FROM jsonb_object_keys(specs) AS t(key))
-- );
