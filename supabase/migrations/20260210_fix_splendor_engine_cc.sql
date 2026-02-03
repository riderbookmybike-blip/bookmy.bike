-- Migration: Fix Splendor+ missing engine_cc in specs
-- This migration updates Splendor+ items with the correct engine CC value
-- Splendor+ has a 97.2cc engine

-- First, let's identify all Splendor+ related items and update their specs

-- Update FAMILY items (Models)
UPDATE public.cat_items
SET specs = jsonb_set(
    COALESCE(specs, '{}'::jsonb),
    '{engine_cc}',
    '"97"'::jsonb
)
WHERE type = 'FAMILY'
AND name ILIKE '%splendor%'
AND (specs->>'engine_cc' IS NULL OR specs->>'engine_cc' = '' OR specs->>'engine_cc' = '0');

-- Update VARIANT items
UPDATE public.cat_items
SET specs = jsonb_set(
    COALESCE(specs, '{}'::jsonb),
    '{engine_cc}',
    '"97"'::jsonb
)
WHERE type = 'VARIANT'
AND (
    name ILIKE '%splendor%'
    OR parent_id IN (
        SELECT id FROM public.cat_items 
        WHERE type = 'FAMILY' AND name ILIKE '%splendor%'
    )
)
AND (specs->>'engine_cc' IS NULL OR specs->>'engine_cc' = '' OR specs->>'engine_cc' = '0');

-- Update SKU items (Color variants)
UPDATE public.cat_items
SET specs = jsonb_set(
    COALESCE(specs, '{}'::jsonb),
    '{engine_cc}',
    '"97"'::jsonb
)
WHERE type = 'SKU'
AND parent_id IN (
    SELECT id FROM public.cat_items 
    WHERE type = 'VARIANT'
    AND (
        name ILIKE '%splendor%'
        OR parent_id IN (
            SELECT id FROM public.cat_items 
            WHERE type = 'FAMILY' AND name ILIKE '%splendor%'
        )
    )
)
AND (specs->>'engine_cc' IS NULL OR specs->>'engine_cc' = '' OR specs->>'engine_cc' = '0');

-- Verify the updates by logging affected rows
DO $$
DECLARE
    family_count INTEGER;
    variant_count INTEGER;
    sku_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO family_count FROM public.cat_items 
    WHERE type = 'FAMILY' AND name ILIKE '%splendor%' AND specs->>'engine_cc' = '97';
    
    SELECT COUNT(*) INTO variant_count FROM public.cat_items 
    WHERE type = 'VARIANT' AND parent_id IN (
        SELECT id FROM public.cat_items WHERE type = 'FAMILY' AND name ILIKE '%splendor%'
    ) AND specs->>'engine_cc' = '97';
    
    SELECT COUNT(*) INTO sku_count FROM public.cat_items 
    WHERE type = 'SKU' AND parent_id IN (
        SELECT id FROM public.cat_items WHERE type = 'VARIANT' AND parent_id IN (
            SELECT id FROM public.cat_items WHERE type = 'FAMILY' AND name ILIKE '%splendor%'
        )
    ) AND specs->>'engine_cc' = '97';
    
    RAISE NOTICE 'Updated Splendor+ items - Families: %, Variants: %, SKUs: %', family_count, variant_count, sku_count;
END $$;
