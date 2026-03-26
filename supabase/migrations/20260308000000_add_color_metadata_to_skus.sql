-- Add color metadata columns to cat_skus for faster resolution and override support
BEGIN;

DO $$
BEGIN
    IF to_regclass('public.cat_skus') IS NOT NULL THEN
        ALTER TABLE public.cat_skus ADD COLUMN IF NOT EXISTS hex_primary TEXT;
        ALTER TABLE public.cat_skus ADD COLUMN IF NOT EXISTS hex_secondary TEXT;
        ALTER TABLE public.cat_skus ADD COLUMN IF NOT EXISTS color_name TEXT;
        ALTER TABLE public.cat_skus ADD COLUMN IF NOT EXISTS finish TEXT;
        
        COMMENT ON COLUMN public.cat_skus.hex_primary IS 'Primary hex color code for the SKU.';
        COMMENT ON COLUMN public.cat_skus.hex_secondary IS 'Secondary/Accent hex color code for the SKU.';
        COMMENT ON COLUMN public.cat_skus.color_name IS 'Human-readable color name (e.g. Racing Red).';
        COMMENT ON COLUMN public.cat_skus.finish IS 'Paint finish (e.g. MATTE, GLOSS).';
    END IF;
END $$;

COMMIT;
