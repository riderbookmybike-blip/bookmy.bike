-- Seed Additional HSN Codes (8-Digit) for Two-Wheeler Business
-- Guarded for both PK schemes: (code) OR (code, effective_from)

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'hsn_codes'
          AND column_name = 'effective_from'
    ) THEN
        INSERT INTO public.hsn_codes (code, description, gst_rate, type, effective_from) VALUES
        ('87112019', 'Motorcycles > 50cc but <= 250cc (Petrol)', 28, 'VEHICLE', '2017-07-01'),
        ('87112029', 'Scooters > 50cc but <= 250cc (Petrol)', 28, 'VEHICLE', '2017-07-01'),
        ('87116010', 'Electric Motorcycles', 5, 'VEHICLE', '2019-08-01'),
        ('87116020', 'Electric Scooters', 5, 'VEHICLE', '2019-08-01'),
        ('65061010', 'Safety Headgear (Helmets) - For Motorcyclists', 18, 'ACCESSORY', '2017-07-01'),
        ('63061200', 'Tarpaulins, awnings and sunblinds (Vehicle Covers)', 18, 'ACCESSORY', '2017-07-01'),
        ('87141090', 'Crash Guards / Saree Guards (Parts & Accessories)', 28, 'ACCESSORY', '2017-07-01'),
        ('85122010', 'Head Lamps / Tail Lamps / Indicators', 18, 'PART', '2017-07-01'),
        ('85123010', 'Electric Horns', 18, 'PART', '2017-07-01'),
        ('998729', 'Maintenance and repair services of motorcycles and scooters', 18, 'SERVICE', '2017-07-01'),
        ('999799', 'Other services n.e.c (Registration/RTO Services)', 18, 'SERVICE', '2017-07-01')
        ON CONFLICT (code, effective_from) DO UPDATE SET
            description = EXCLUDED.description,
            gst_rate = EXCLUDED.gst_rate,
            type = EXCLUDED.type;
    ELSE
        INSERT INTO public.hsn_codes (code, description, gst_rate, type) VALUES
        ('87112019', 'Motorcycles > 50cc but <= 250cc (Petrol)', 28, 'VEHICLE'),
        ('87112029', 'Scooters > 50cc but <= 250cc (Petrol)', 28, 'VEHICLE'),
        ('87116010', 'Electric Motorcycles', 5, 'VEHICLE'),
        ('87116020', 'Electric Scooters', 5, 'VEHICLE'),
        ('65061010', 'Safety Headgear (Helmets) - For Motorcyclists', 18, 'ACCESSORY'),
        ('63061200', 'Tarpaulins, awnings and sunblinds (Vehicle Covers)', 18, 'ACCESSORY'),
        ('87141090', 'Crash Guards / Saree Guards (Parts & Accessories)', 28, 'ACCESSORY'),
        ('85122010', 'Head Lamps / Tail Lamps / Indicators', 18, 'PART'),
        ('85123010', 'Electric Horns', 18, 'PART'),
        ('998729', 'Maintenance and repair services of motorcycles and scooters', 18, 'SERVICE'),
        ('999799', 'Other services n.e.c (Registration/RTO Services)', 18, 'SERVICE')
        ON CONFLICT (code) DO UPDATE SET
            description = EXCLUDED.description,
            gst_rate = EXCLUDED.gst_rate,
            type = EXCLUDED.type;
    END IF;
END $$;
