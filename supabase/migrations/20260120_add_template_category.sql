-- Add category column to catalog_templates
-- Categories: VEHICLE, ACCESSORY, SERVICE (for future)

-- Step 1: Add category column
ALTER TABLE catalog_templates 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'VEHICLE';

-- Step 2: Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_catalog_templates_category 
ON catalog_templates(category);

-- Step 3: Update existing templates based on name patterns
UPDATE catalog_templates 
SET category = 'VEHICLE' 
WHERE UPPER(name) LIKE '%SCOOTER%' 
   OR UPPER(name) LIKE '%MOTORCYCLE%' 
   OR UPPER(name) LIKE '%BIKE%';

UPDATE catalog_templates 
SET category = 'ACCESSORY' 
WHERE UPPER(name) LIKE '%HELMET%' 
   OR UPPER(name) LIKE '%GUARD%' 
   OR UPPER(name) LIKE '%GLOVE%'
   OR UPPER(name) LIKE '%JACKET%'
   OR UPPER(name) LIKE '%COVER%';

-- Step 4: Add comment for documentation
COMMENT ON COLUMN catalog_templates.category IS 'Template category: VEHICLE, ACCESSORY, SERVICE';
