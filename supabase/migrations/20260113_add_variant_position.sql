-- Add position column to vehicle_variants for manual ordering
ALTER TABLE public.vehicle_variants 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Update existing records to have a default position (optional, based on created_at or just 0)
-- This ensures the column isn't null for existing rows
UPDATE public.vehicle_variants SET position = 0 WHERE position IS NULL;
