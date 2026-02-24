-- Add full media columns to cat_models and cat_variants_vehicle
-- This enables hierarchical media inheritance: Model → Variant → Colour → SKU
-- Each level can mark assets as "shareable" to flow down the chain

-- ══════════════════════════════════════════════════
-- cat_models — add media + shareable flag
-- ══════════════════════════════════════════════════
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS primary_image text;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS gallery_img_1 text;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS gallery_img_2 text;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS gallery_img_3 text;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS gallery_img_4 text;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS gallery_img_5 text;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS gallery_img_6 text;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS video_url_1 text;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS video_url_2 text;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS pdf_url_1 text;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS zoom_factor numeric;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS is_flipped boolean NOT NULL DEFAULT false;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS offset_x numeric;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS offset_y numeric;
ALTER TABLE cat_models ADD COLUMN IF NOT EXISTS media_shared boolean NOT NULL DEFAULT false;

-- ══════════════════════════════════════════════════
-- cat_variants_vehicle — add media + shareable flag
-- ══════════════════════════════════════════════════
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS primary_image text;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS gallery_img_1 text;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS gallery_img_2 text;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS gallery_img_3 text;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS gallery_img_4 text;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS gallery_img_5 text;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS gallery_img_6 text;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS video_url_1 text;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS video_url_2 text;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS pdf_url_1 text;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS zoom_factor numeric;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS is_flipped boolean NOT NULL DEFAULT false;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS offset_x numeric;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS offset_y numeric;
ALTER TABLE cat_variants_vehicle ADD COLUMN IF NOT EXISTS media_shared boolean NOT NULL DEFAULT false;

-- ══════════════════════════════════════════════════
-- cat_colours — add shareable flag (media columns already exist)
-- ══════════════════════════════════════════════════
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS media_shared boolean NOT NULL DEFAULT false;
