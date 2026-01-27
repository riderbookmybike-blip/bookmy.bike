-- Add district and taluka columns to id_locations
ALTER TABLE public.id_locations
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS taluka TEXT;
