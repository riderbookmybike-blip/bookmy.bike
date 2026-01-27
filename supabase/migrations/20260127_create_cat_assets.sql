-- 1. Create cat_assets table
CREATE TABLE IF NOT EXISTS public.cat_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.cat_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('IMAGE', 'VIDEO', 'PDF')),
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    zoom_factor NUMERIC DEFAULT 1.0,
    position INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cat_assets_item_id ON public.cat_assets(item_id);
CREATE INDEX IF NOT EXISTS idx_cat_assets_type ON public.cat_assets(type);

-- 3. Data Migration: Move gallery images from specs
INSERT INTO public.cat_assets (item_id, type, url, is_primary, zoom_factor, position)
SELECT 
    i.id AS item_id,
    'IMAGE' AS type,
    img.url AS url,
    CASE 
        WHEN i.specs->>'primary_image' = img.url THEN true 
        ELSE false 
    END AS is_primary,
    COALESCE((i.zoom_factor)::numeric, 1.1) AS zoom_factor,
    0 AS position
FROM public.cat_items i,
LATERAL jsonb_array_elements_text(i.specs->'gallery') AS img(url)
WHERE i.specs->'gallery' IS NOT NULL AND jsonb_array_length(i.specs->'gallery') > 0;

-- 4. Data Migration: Move video_urls
INSERT INTO public.cat_assets (item_id, type, url, position)
SELECT 
    i.id AS item_id,
    'VIDEO' AS type,
    vid.url AS url,
    0 AS position
FROM public.cat_items i,
LATERAL jsonb_array_elements_text(i.specs->'video_urls') AS vid(url)
WHERE i.specs->'video_urls' IS NOT NULL AND jsonb_array_length(i.specs->'video_urls') > 0;

-- 5. Data Migration: Move pdf_urls
INSERT INTO public.cat_assets (item_id, type, url, position)
SELECT 
    i.id AS item_id,
    'PDF' AS type,
    doc.url AS url,
    0 AS position
FROM public.cat_items i,
LATERAL jsonb_array_elements_text(i.specs->'pdf_urls') AS doc(url)
WHERE i.specs->'pdf_urls' IS NOT NULL AND jsonb_array_length(specs->'pdf_urls') > 0;

-- 6. Enable RLS
ALTER TABLE public.cat_assets ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS Policies (Assuming public read for catalog)
CREATE POLICY "Public Read Access" ON public.cat_assets
    FOR SELECT USING (true);

CREATE POLICY "Admin All Access" ON public.cat_assets
    USING (auth.uid() IN (SELECT id FROM public.id_members WHERE role IN ('SUPER_ADMIN', 'OWNER')));
