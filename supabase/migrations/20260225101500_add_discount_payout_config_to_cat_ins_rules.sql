DO $$
BEGIN
  IF to_regclass('public.cat_ins_rules') IS NULL THEN
    RAISE NOTICE 'Skipping cat_ins_rules discount config migration: table not found';
    RETURN;
  END IF;

  EXECUTE $sql$
    ALTER TABLE public.cat_ins_rules
      ADD COLUMN IF NOT EXISTS ncb_percentage numeric(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS discount_payout_config jsonb
  $sql$;

  EXECUTE $sql$
    UPDATE public.cat_ins_rules
    SET
      ncb_percentage = COALESCE(ncb_percentage, 0),
      discount_percentage = COALESCE(discount_percentage, 0)
    WHERE ncb_percentage IS NULL
       OR discount_percentage IS NULL
  $sql$;

  EXECUTE 'COMMENT ON COLUMN public.cat_ins_rules.ncb_percentage IS ''NCB percentage applied to OD premium.''';
  EXECUTE 'COMMENT ON COLUMN public.cat_ins_rules.discount_percentage IS ''Flat OD discount percentage for legacy compatibility.''';
  EXECUTE 'COMMENT ON COLUMN public.cat_ins_rules.discount_payout_config IS ''Hierarchical discount and payout rule entries (ALL/BRAND/VEHICLE_TYPE/MODEL).''';
END
$$;
