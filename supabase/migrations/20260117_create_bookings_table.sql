-- Create Bookings Table for Migration
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- Optional, if bookings belong to a tenant
    user_id UUID REFERENCES auth.users(id), -- If bookings are linked to users
    vehicle_details JSONB DEFAULT '{}'::jsonb, -- To store 'last_booked_vehicle' and other details
    status TEXT, -- 'cancelled', 'completed', 'ongoing'
    firebase_id TEXT UNIQUE, -- To map back to Firestore ID
    customer_details JSONB DEFAULT '{}'::jsonb, -- Snapshot of customer info
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Admin Full Access (matches other tables)
CREATE POLICY "Admin Full Access Bookings" ON public.bookings FOR ALL USING (auth.role() = 'authenticated');
