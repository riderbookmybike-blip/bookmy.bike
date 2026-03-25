-- Add position column for explicit sorting
DO $$
BEGIN
    IF to_regclass('public.catalog_items') IS NOT NULL THEN
        ALTER TABLE public.catalog_items
        ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

        CREATE INDEX IF NOT EXISTS idx_catalog_items_position ON public.catalog_items(position);
    END IF;
END $$;
