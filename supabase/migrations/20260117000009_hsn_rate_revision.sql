-- HSN Rate Revision Migration (v2 - Fixed PK)
-- Fixes "duplicate key" error by updating Primary Key to support versioning
-- Based on Government notification: GST rates revised from 22 September 2025

-- ========================================
-- STEP 1: Update Primary Key to Composite (Code + Effective Date)
-- ========================================

-- Drop existing PK on 'code' if it exists. 
-- Using IF EXISTS to be safe, though constraint name is usually 'hsn_codes_pkey'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hsn_codes_pkey') THEN
        ALTER TABLE public.hsn_codes DROP CONSTRAINT hsn_codes_pkey;
    END IF;
END $$;

-- Make sure effective_from is NOT NULL (required for PK)
UPDATE public.hsn_codes SET effective_from = '2017-07-01' WHERE effective_from IS NULL;
ALTER TABLE public.hsn_codes ALTER COLUMN effective_from SET NOT NULL;

-- Add new composite Primary Key
ALTER TABLE public.hsn_codes ADD PRIMARY KEY (code, effective_from);


-- ========================================
-- STEP 2: Add Versioning Columns
-- ========================================

ALTER TABLE public.hsn_codes 
ADD COLUMN IF NOT EXISTS effective_to DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cess_rate NUMERIC DEFAULT 0;

-- ========================================
-- STEP 3: Clear & Reseed Data with History
-- ========================================

DELETE FROM public.hsn_codes;

-- OLD RATES (01 July 2017 - 21 September 2025) - INACTIVE
INSERT INTO public.hsn_codes (code, description, gst_rate, cess_rate, type, class, effective_from, effective_to, is_active) VALUES
-- ICE Motorcycles < 350cc (28% -> becomes 18% from Sep 2025)
('87112019', 'ICE Motorcycles 50-250cc', 28, 0, 'VEHICLE', 'ICE Motorcycle upto 250cc', '2017-07-01', '2025-09-21', false),
('87112029', 'ICE Motorcycles 250-350cc', 28, 0, 'VEHICLE', 'ICE Motorcycle 250-350cc', '2017-07-01', '2025-09-21', false),

-- ICE Motorcycles > 350cc (28% + 3% Cess = 31% -> becomes 40% from Sep 2025)
('87113019', 'ICE Motorcycles 350-500cc', 28, 3, 'VEHICLE', 'ICE Motorcycle 350-500cc', '2017-07-01', '2025-09-21', false),
('87113029', 'ICE Motorcycles > 500cc', 28, 3, 'VEHICLE', 'ICE Motorcycle > 500cc', '2017-07-01', '2025-09-21', false),

-- ICE Scooters < 350cc (28% -> becomes 18% from Sep 2025)
('87112011', 'ICE Scooters upto 110cc', 28, 0, 'VEHICLE', 'ICE Scooter upto 110cc', '2017-07-01', '2025-09-21', false),
('87112012', 'ICE Scooters 110-125cc', 28, 0, 'VEHICLE', 'ICE Scooter 110-125cc', '2017-07-01', '2025-09-21', false),
('87112013', 'ICE Scooters 125-150cc', 28, 0, 'VEHICLE', 'ICE Scooter 125-150cc', '2017-07-01', '2025-09-21', false),
('87112014', 'ICE Scooters 150-250cc', 28, 0, 'VEHICLE', 'ICE Scooter 150-250cc', '2017-07-01', '2025-09-21', false);


-- NEW RATES (22 September 2025 onwards) - ACTIVE
INSERT INTO public.hsn_codes (code, description, gst_rate, cess_rate, type, class, effective_from, effective_to, is_active) VALUES
-- ICE Motorcycles < 350cc (NEW 18%)
('87112019', 'ICE Motorcycles 50-250cc', 18, 0, 'VEHICLE', 'ICE Motorcycle upto 250cc', '2025-09-22', NULL, true),
('87112029', 'ICE Motorcycles 250-350cc', 18, 0, 'VEHICLE', 'ICE Motorcycle 250-350cc', '2025-09-22', NULL, true),

-- ICE Motorcycles > 350cc (NEW 40%)
('87113019', 'ICE Motorcycles 350-500cc', 40, 0, 'VEHICLE', 'ICE Motorcycle 350-500cc', '2025-09-22', NULL, true),
('87113029', 'ICE Motorcycles > 500cc', 40, 0, 'VEHICLE', 'ICE Motorcycle > 500cc', '2025-09-22', NULL, true),

-- ICE Scooters < 350cc (NEW 18%)
('87112011', 'ICE Scooters upto 110cc', 18, 0, 'VEHICLE', 'ICE Scooter upto 110cc', '2025-09-22', NULL, true),
('87112012', 'ICE Scooters 110-125cc', 18, 0, 'VEHICLE', 'ICE Scooter 110-125cc', '2025-09-22', NULL, true),
('87112013', 'ICE Scooters 125-150cc', 18, 0, 'VEHICLE', 'ICE Scooter 125-150cc', '2025-09-22', NULL, true),
('87112014', 'ICE Scooters 150-250cc', 18, 0, 'VEHICLE', 'ICE Scooter 150-250cc', '2025-09-22', NULL, true);


-- EV (5% - No Change, Single Active Entry)
INSERT INTO public.hsn_codes (code, description, gst_rate, cess_rate, type, class, effective_from, effective_to, is_active) VALUES
('87116010', 'Electric Motorcycles (Battery Operated)', 5, 0, 'VEHICLE', 'EV Motorcycle', '2019-08-01', NULL, true),
('87116020', 'Electric Scooters (Battery Operated)', 5, 0, 'VEHICLE', 'EV Scooter', '2019-08-01', NULL, true);


-- ACCESSORIES & PARTS (18% or 28% - No Change)
INSERT INTO public.hsn_codes (code, description, gst_rate, cess_rate, type, class, effective_from, effective_to, is_active) VALUES
('65061010', 'Safety Headgear - Helmets for Motorcyclists', 18, 0, 'ACCESSORY', 'Helmet (ISI)', '2017-07-01', NULL, true),
('63061290', 'Vehicle Covers / Parking Covers', 18, 0, 'ACCESSORY', 'Parking Cover', '2017-07-01', NULL, true),
('87141011', 'Crash Guards for Two-Wheelers', 28, 0, 'ACCESSORY', 'Crash Guard', '2017-07-01', NULL, true),
('87141012', 'Saree Guards for Two-Wheelers', 28, 0, 'ACCESSORY', 'Saree Guard', '2017-07-01', NULL, true),
('87141013', 'Luggage Carriers / Top Cases', 28, 0, 'ACCESSORY', 'Luggage Carrier', '2017-07-01', NULL, true),
('85122010', 'Head Lamps / Tail Lamps / Indicators', 18, 0, 'PART', 'Lighting', '2017-07-01', NULL, true),
('85123010', 'Electric Horns', 18, 0, 'PART', 'Horn', '2017-07-01', NULL, true),
('40114000', 'Tyres for Motorcycles', 28, 0, 'PART', 'Tyres', '2017-07-01', NULL, true),
('85072010', 'Lead Acid Batteries for Vehicles', 28, 0, 'PART', 'Battery (Lead Acid)', '2017-07-01', NULL, true),
('85076000', 'Lithium-ion Batteries', 18, 0, 'PART', 'Battery (Li-ion)', '2017-07-01', NULL, true);


-- SERVICES (18% - No Change)
INSERT INTO public.hsn_codes (code, description, gst_rate, cess_rate, type, class, effective_from, effective_to, is_active) VALUES
('99871100', 'Motor vehicle rental with operator', 18, 0, 'SERVICE', 'Rental with Driver', '2017-07-01', NULL, true),
('99871200', 'Motor vehicle rental without operator', 18, 0, 'SERVICE', 'Self-Drive Rental', '2017-07-01', NULL, true),
('99872900', 'Maintenance and repair services', 18, 0, 'SERVICE', 'Service & Repair', '2017-07-01', NULL, true),
('99979900', 'RTO / Registration Services', 18, 0, 'SERVICE', 'RTO Services', '2017-07-01', NULL, true);
