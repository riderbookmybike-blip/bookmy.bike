-- Add COLOR_DEF to the allowed types for catalog_items
ALTER TABLE public.catalog_items DROP CONSTRAINT catalog_items_type_check;
ALTER TABLE public.catalog_items ADD CONSTRAINT catalog_items_type_check CHECK (type IN ('FAMILY', 'VARIANT', 'SKU', 'COLOR_DEF'));
