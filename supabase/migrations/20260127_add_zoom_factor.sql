-- Add zoom_factor column to cat_items for per-SKU image scaling control
-- Default is 1.0, but admin can adjust per image to normalize visual size
-- Run this migration in Supabase Dashboard > SQL Editor

ALTER TABLE cat_items 
ADD COLUMN IF NOT EXISTS zoom_factor FLOAT DEFAULT 1.0;

-- Add comment for documentation
COMMENT ON COLUMN cat_items.zoom_factor IS 'Image display zoom factor (1.0 = default, 1.1 = 10% larger, 0.9 = 10% smaller). Used for normalizing vehicle image sizes in catalog.';

-- Example: To adjust a specific SKU's zoom level:
-- UPDATE cat_items SET zoom_factor = 1.15 WHERE id = 'your-sku-id';
