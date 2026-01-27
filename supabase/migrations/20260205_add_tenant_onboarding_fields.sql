-- Migration: 20260205_add_tenant_onboarding_fields.sql
-- Description: Add fields to support simplified dealership onboarding

-- 1. Ensure id_tenants has required fields
ALTER TABLE public.id_tenants 
    ADD COLUMN IF NOT EXISTS pincode TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'DEALER';

-- 2. Add index for pincode and type
CREATE INDEX IF NOT EXISTS idx_id_tenants_pincode ON public.id_tenants(pincode);
CREATE INDEX IF NOT EXISTS idx_id_tenants_type ON public.id_tenants(type);

-- 3. Update id_team to ensure role and status exist (they should, but just in case)
-- id_team is the membership table used in recent RPCs
ALTER TABLE public.id_team
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'MEMBER',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
