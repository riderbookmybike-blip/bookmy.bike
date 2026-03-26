-- Add primary_image to cat_colours for shared colour-level image support
-- SKUs inherit this image unless they have their own primary_image set
ALTER TABLE IF EXISTS public.cat_colours
ADD COLUMN IF NOT EXISTS primary_image text;
