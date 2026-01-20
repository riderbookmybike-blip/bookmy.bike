-- Add position column for explicit sorting
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Index for sorting performance
CREATE INDEX IF NOT EXISTS idx_catalog_items_position ON public.catalog_items(position);
