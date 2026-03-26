-- Delete all 6-digit HSN codes (keep only 8-digit) - guarded
DO $$
BEGIN
    IF to_regclass('public.hsn_codes') IS NOT NULL THEN
        DELETE FROM public.hsn_codes
        WHERE LENGTH(code) < 8;
    END IF;
END $$;
