-- Add district and taluka columns to id_locations
DO $$
BEGIN
  IF to_regclass('public.id_locations') IS NOT NULL THEN
    ALTER TABLE public.id_locations
      ADD COLUMN IF NOT EXISTS district TEXT,
      ADD COLUMN IF NOT EXISTS taluka TEXT;
  END IF;
END $$;
