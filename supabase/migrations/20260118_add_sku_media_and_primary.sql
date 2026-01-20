-- Add media and primary flag columns to catalog_items
ALTER TABLE public.catalog_items 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Index for is_primary to speed up catalog queries
CREATE INDEX IF NOT EXISTS idx_catalog_items_is_primary ON public.catalog_items(is_primary) WHERE (type = 'SKU' AND is_primary = true);

COMMENT ON COLUMN public.catalog_items.is_primary IS 'Marks the primary SKU for a variant to be shown in the catalog.';
COMMENT ON COLUMN public.catalog_items.image_url IS 'Main SKU specific image (e.g. specific color image).';
COMMENT ON COLUMN public.catalog_items.gallery_urls IS 'SKU specific image gallery.';
COMMENT ON COLUMN public.catalog_items.video_url IS 'SKU specific video URL (e.g. 360 view or review).';
