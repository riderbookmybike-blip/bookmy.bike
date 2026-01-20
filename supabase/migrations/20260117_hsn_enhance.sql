-- Add 'class' and 'effective_from' columns to hsn_codes

ALTER TABLE public.hsn_codes 
ADD COLUMN IF NOT EXISTS class TEXT,
ADD COLUMN IF NOT EXISTS effective_from DATE DEFAULT '2017-07-01';

-- Update existing data with proper class labels
UPDATE public.hsn_codes SET class = 'ICE Motorcycle 50-250cc' WHERE code = '871120';
UPDATE public.hsn_codes SET class = 'ICE Motorcycle 250-500cc' WHERE code = '871130';
UPDATE public.hsn_codes SET class = 'Helmet' WHERE code = '650610';
UPDATE public.hsn_codes SET class = 'Parts & Accessories' WHERE code = '871410';
UPDATE public.hsn_codes SET class = 'Repair Services' WHERE code = '998729';

-- Insert new comprehensive 8-digit HSN codes with proper class labels
INSERT INTO public.hsn_codes (code, description, gst_rate, type, class, effective_from) VALUES

-- ICE MOTORCYCLES
('87112019', 'Motorcycles with reciprocating piston engine 50-250cc', 28, 'VEHICLE', 'ICE Motorcycle upto 250cc', '2017-07-01'),
('87112029', 'Motorcycles with reciprocating piston engine 250-350cc', 28, 'VEHICLE', 'ICE Motorcycle 250-350cc', '2017-07-01'),
('87113019', 'Motorcycles with reciprocating piston engine 350-500cc', 28, 'VEHICLE', 'ICE Motorcycle 350-500cc', '2017-07-01'),

-- ICE SCOOTERS
('87112011', 'Scooters with reciprocating piston engine 50-110cc', 28, 'VEHICLE', 'ICE Scooter upto 110cc', '2017-07-01'),
('87112012', 'Scooters with reciprocating piston engine 110-125cc', 28, 'VEHICLE', 'ICE Scooter 110-125cc', '2017-07-01'),
('87112013', 'Scooters with reciprocating piston engine 125-150cc', 28, 'VEHICLE', 'ICE Scooter 125-150cc', '2017-07-01'),
('87112014', 'Scooters with reciprocating piston engine 150-250cc', 28, 'VEHICLE', 'ICE Scooter 150-250cc', '2017-07-01'),

-- EV MOTORCYCLES & SCOOTERS (Lower GST)
('87116010', 'Electric Motorcycles (Battery Operated)', 5, 'VEHICLE', 'EV Motorcycle', '2019-08-01'),
('87116020', 'Electric Scooters (Battery Operated)', 5, 'VEHICLE', 'EV Scooter', '2019-08-01'),

-- ACCESSORIES
('65061010', 'Safety Headgear - Helmets for Motorcyclists', 18, 'ACCESSORY', 'Helmet (ISI)', '2017-07-01'),
('63061290', 'Vehicle Covers / Parking Covers', 18, 'ACCESSORY', 'Parking Cover', '2017-07-01'),
('87141011', 'Crash Guards for Two-Wheelers', 28, 'ACCESSORY', 'Crash Guard', '2017-07-01'),
('87141012', 'Saree Guards for Two-Wheelers', 28, 'ACCESSORY', 'Saree Guard', '2017-07-01'),
('87141013', 'Luggage Carriers / Top Cases', 28, 'ACCESSORY', 'Luggage Carrier', '2017-07-01'),

-- PARTS
('85122010', 'Head Lamps / Tail Lamps / Indicators', 18, 'PART', 'Lighting', '2017-07-01'),
('85123010', 'Electric Horns', 18, 'PART', 'Horn', '2017-07-01'),
('40114000', 'Tyres for Motorcycles', 28, 'PART', 'Tyres', '2017-07-01'),
('85072010', 'Lead Acid Batteries for Vehicles', 28, 'PART', 'Battery (Lead Acid)', '2017-07-01'),
('85076000', 'Lithium-ion Batteries', 18, 'PART', 'Battery (Li-ion)', '2017-07-01'),

-- SERVICES
('998711', 'Motor vehicle rental with operator', 18, 'SERVICE', 'Rental with Driver', '2017-07-01'),
('998712', 'Motor vehicle rental without operator', 18, 'SERVICE', 'Self-Drive Rental', '2017-07-01'),
('998729', 'Maintenance and repair services', 18, 'SERVICE', 'Service & Repair', '2017-07-01'),
('999799', 'RTO / Registration Services', 18, 'SERVICE', 'RTO Services', '2017-07-01')

ON CONFLICT (code) DO UPDATE SET
description = EXCLUDED.description,
gst_rate = EXCLUDED.gst_rate,
type = EXCLUDED.type,
class = EXCLUDED.class,
effective_from = EXCLUDED.effective_from;
