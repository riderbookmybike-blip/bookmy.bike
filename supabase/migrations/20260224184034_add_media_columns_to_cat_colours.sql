-- Add full media columns to cat_colours (mirroring cat_skus media columns)
-- This enables colour-level image/video/PDF management with SKU inheritance
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS gallery_img_1 text;
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS gallery_img_2 text;
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS gallery_img_3 text;
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS gallery_img_4 text;
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS gallery_img_5 text;
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS gallery_img_6 text;
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS video_url_1 text;
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS video_url_2 text;
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS pdf_url_1 text;
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS zoom_factor numeric;
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS is_flipped boolean NOT NULL DEFAULT false;
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS offset_x numeric;
ALTER TABLE cat_colours ADD COLUMN IF NOT EXISTS offset_y numeric;
