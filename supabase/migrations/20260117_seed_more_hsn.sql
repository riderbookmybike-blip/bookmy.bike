-- Seed Additional HSN Codes (8-Digit) for Two-Wheeler Business

-- Upsert Logic to prevent duplicates
INSERT INTO public.hsn_codes (code, description, gst_rate, type) VALUES

-- VEHICLES (Petrol)
('87112019', 'Motorcycles > 50cc but <= 250cc (Petrol)', 28, 'VEHICLE'),
('87112029', 'Scooters > 50cc but <= 250cc (Petrol)', 28, 'VEHICLE'),

-- VEHICLES (EV) - Lower GST Rate usually 5%
('87116010', 'Electric Motorcycles', 5, 'VEHICLE'),
('87116020', 'Electric Scooters', 5, 'VEHICLE'),

-- ACCESSORIES
('65061010', 'Safety Headgear (Helmets) - For Motorcyclists', 18, 'ACCESSORY'),
('63061200', 'Tarpaulins, awnings and sunblinds (Vehicle Covers)', 18, 'ACCESSORY'),
('87141090', 'Crash Guards / Saree Guards (Parts & Accessories)', 28, 'ACCESSORY'),
('85122010', 'Head Lamps / Tail Lamps / Indicators', 18, 'PART'),
('85123010', 'Electric Horns', 18, 'PART'),

-- SERVICES
('998729', 'Maintenance and repair services of motorcycles and scooters', 18, 'SERVICE'),
('999799', 'Other services n.e.c (Registration/RTO Services)', 18, 'SERVICE')

ON CONFLICT (code) DO UPDATE SET
description = EXCLUDED.description,
gst_rate = EXCLUDED.gst_rate,
type = EXCLUDED.type;
