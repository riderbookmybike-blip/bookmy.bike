ALTER TABLE public.vehicle_colors
ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;
