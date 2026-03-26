-- Add COLOR_DEF to allowed types for catalog_items (guarded)
DO $$
BEGIN
    IF to_regclass('public.catalog_items') IS NOT NULL THEN
        BEGIN
            ALTER TABLE public.catalog_items DROP CONSTRAINT IF EXISTS catalog_items_type_check;
        EXCEPTION WHEN undefined_object THEN
            NULL;
        END;

        ALTER TABLE public.catalog_items
        ADD CONSTRAINT catalog_items_type_check
        CHECK (type IN ('FAMILY', 'VARIANT', 'SKU', 'COLOR_DEF'));
    END IF;
END $$;
