-- Migration: 20260205_dms_org_expansion.sql
-- Description: Schema expansion for Full Dealer Management Suite
-- Includes: Logo, Locations, Hierarchy, Documents (Compliance), Finance, Operations

-- 1. Identity: Add Logo to Tenants
ALTER TABLE public.id_tenants 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Physical Network: Locations
CREATE TABLE IF NOT EXISTS public.id_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.id_tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL, -- e.g., "Andheri West Showroom"
    type TEXT NOT NULL CHECK (type IN ('SHOWROOM', 'WAREHOUSE', 'SERVICE_CENTER', 'HEAD_OFFICE')),
    
    -- Address
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    map_link TEXT, -- Google Maps URL
    
    -- Contact
    manager_id UUID REFERENCES public.id_team(id), -- Location Manager
    contact_phone TEXT,
    contact_email TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Human Hierarchy: Reporting Lines
ALTER TABLE public.id_team 
ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES public.id_team(id);

-- 4. Compliance Vault: Documents
CREATE TABLE IF NOT EXISTS public.id_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.id_tenants(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL, -- e.g., "GST Certificate"
    type TEXT NOT NULL, -- e.g., "GST", "PAN", "TRADE_LICENSE", "AGREEMENT"
    file_url TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Storage path
    
    -- Validity
    issued_at DATE,
    expires_at DATE,
    
    -- Status
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')),
    verification_notes TEXT,
    
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Financial Setup: Bank Accounts
CREATE TABLE IF NOT EXISTS public.id_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.id_tenants(id) ON DELETE CASCADE,
    
    account_number TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    beneficiary_name TEXT NOT NULL,
    account_type TEXT DEFAULT 'CURRENT',
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED')),
    penny_drop_ref TEXT,
    
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Operational Config: Operating Hours
CREATE TABLE IF NOT EXISTS public.id_operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.id_tenants(id) ON DELETE CASCADE,
    
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    is_closed BOOLEAN DEFAULT false,
    open_time TIME,
    close_time TIME,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(tenant_id, day_of_week)
);

-- Enable RLS for all new tables
ALTER TABLE public.id_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_operating_hours ENABLE ROW LEVEL SECURITY;

-- Create Policies (Using the robust check_is_super_admin and check_is_tenant_owner functions)

-- LOCATIONS
CREATE POLICY "Super Admin Manage Locations" ON public.id_locations FOR ALL USING (public.check_is_super_admin(auth.uid()));
CREATE POLICY "Owner Manage Locations" ON public.id_locations FOR ALL USING (public.check_is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "Team Read Locations" ON public.id_locations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.id_team WHERE user_id = auth.uid() AND tenant_id = id_locations.tenant_id)
);

-- DOCUMENTS
CREATE POLICY "Super Admin Manage Documents" ON public.id_documents FOR ALL USING (public.check_is_super_admin(auth.uid()));
CREATE POLICY "Owner Manage Documents" ON public.id_documents FOR ALL USING (public.check_is_tenant_owner(auth.uid(), tenant_id));
-- Members can usually only READ docs, maybe upload? Restricting to Owners/Admins for now.

-- BANK ACCOUNTS
CREATE POLICY "Super Admin Manage Bank" ON public.id_bank_accounts FOR ALL USING (public.check_is_super_admin(auth.uid()));
CREATE POLICY "Owner Manage Bank" ON public.id_bank_accounts FOR ALL USING (public.check_is_tenant_owner(auth.uid(), tenant_id));

-- OPERATING HOURS
CREATE POLICY "Super Admin Manage Hours" ON public.id_operating_hours FOR ALL USING (public.check_is_super_admin(auth.uid()));
CREATE POLICY "Owner Manage Hours" ON public.id_operating_hours FOR ALL USING (public.check_is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "Public Read Hours" ON public.id_operating_hours FOR SELECT USING (true); -- Public needs to see when store is open
