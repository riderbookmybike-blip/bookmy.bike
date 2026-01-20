-- Phase 7: Advanced CRM (Quotes & Bookings)

-- 1. Bookings Table (if missing)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    user_id UUID REFERENCES auth.users(id),
    vehicle_details JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'DRAFT',
    firebase_id TEXT UNIQUE,
    customer_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Quotes Table with Versioning
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    lead_id UUID REFERENCES public.leads(id),
    
    -- Versioning
    version INTEGER DEFAULT 1,
    parent_quote_id UUID REFERENCES public.quotes(id),
    is_latest BOOLEAN DEFAULT true,
    
    -- Configuration
    variant_id UUID,
    color_id UUID,
    
    -- Detailed Commercials
    commercials JSONB DEFAULT '{
        "base_price": 0,
        "road_tax": 0,
        "insurance": 0,
        "registration": 0,
        "accessories": [],
        "grand_total": 0
    }'::jsonb,
    
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. Enhance Bookings with Multi-stage Workflow
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES public.quotes(id),
ADD COLUMN IF NOT EXISTS finance_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS allotment_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS pdi_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS insurance_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'FINANCE';

-- 4. RLS Policies
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin Full Access Quotes" ON public.quotes;
CREATE POLICY "Admin Full Access Quotes" ON public.quotes FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Bookings" ON public.bookings;
CREATE POLICY "Admin Full Access Bookings" ON public.bookings FOR ALL USING (auth.role() = 'authenticated');

-- 5. Function to update is_latest on new version
CREATE OR REPLACE FUNCTION public.update_quote_versions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_quote_id IS NOT NULL THEN
        UPDATE public.quotes 
        SET is_latest = false 
        WHERE id = NEW.parent_quote_id OR parent_quote_id = NEW.parent_quote_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_quote_versions ON public.quotes;
CREATE TRIGGER tr_update_quote_versions
BEFORE INSERT ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.update_quote_versions();
