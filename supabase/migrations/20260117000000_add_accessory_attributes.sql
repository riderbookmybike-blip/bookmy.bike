-- Add custom_attributes to accessories table to support dynamic key-value pairs
DO $$
BEGIN
    IF to_regclass('public.accessories') IS NOT NULL THEN
        ALTER TABLE public.accessories
        ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb;

        UPDATE public.accessories
        SET custom_attributes = '{"Certification":"ISI","Weight":"1250g","Visor":"Scratch Resistant"}'::jsonb
        WHERE make = 'Studds' AND model = 'Ninja 3G';
    END IF;
END $$;
