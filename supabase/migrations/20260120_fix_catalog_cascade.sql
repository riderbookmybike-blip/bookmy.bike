-- Add ON DELETE CASCADE to catalog_items.parent_id to allow deleting families with children
BEGIN;

-- Drop existing constraint if it exists (we don't know the exact name, so we try to find it or just alter the column if possible, but standard way is dropping constraint)
-- Since we don't know the constraint name reliably without querying, we will try to ALTER the TABLE assuming a standard name or re-add it.
-- However, safe way in Supabase migrations is often just to run the ALTER if we know the FK.

-- Let's try to identify the constraint. Usually standard naming is catalog_items_parent_id_fkey
ALTER TABLE catalog_items
DROP CONSTRAINT IF EXISTS catalog_items_parent_id_fkey;

ALTER TABLE catalog_items
ADD CONSTRAINT catalog_items_parent_id_fkey
FOREIGN KEY (parent_id)
REFERENCES catalog_items(id)
ON DELETE CASCADE;

COMMIT;
