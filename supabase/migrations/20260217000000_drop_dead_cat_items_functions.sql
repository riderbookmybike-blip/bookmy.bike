-- Drop legacy catalog hierarchy functions that still reference removed cat_items table.
-- These functions are currently not attached to any trigger and are dead code.

BEGIN;

DROP FUNCTION IF EXISTS public.enforce_catalog_hierarchy();
DROP FUNCTION IF EXISTS public.validate_cat_item_hierarchy();

COMMIT;
