-- Migration to restructure attribute_config from flat array to multi-level object
-- Existing flat arrays are moved to the 'model' level

UPDATE catalog_templates
SET attribute_config = jsonb_build_object(
    'brand', '[]'::jsonb,
    'model', attribute_config,
    'variant', '[]'::jsonb
)
WHERE jsonb_typeof(attribute_config) = 'array';

-- Ensure all nulls or non-conforming objects are initialized (Optional but safe)
UPDATE catalog_templates
SET attribute_config = '{"brand": [], "model": [], "variant": []}'::jsonb
WHERE attribute_config IS NULL OR 
      (jsonb_typeof(attribute_config) = 'object' AND NOT (attribute_config ? 'brand' AND attribute_config ? 'model' AND attribute_config ? 'variant'));
