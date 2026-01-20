-- Migration: Add specifications column to brands table
-- Description: Adds a jsonb column to store template-defined brand-level attributes.

ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;

-- Ensure RLS is enabled (it should be, but let's be safe)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- No new policies needed if existing policies cover the new column.
-- Assuming existing SELECT/INSERT/UPDATE policies for brands apply.
