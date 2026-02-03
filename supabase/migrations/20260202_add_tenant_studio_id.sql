-- Migration: 20260202_add_tenant_studio_id.sql
-- Description: Add studio_id column for user-supplied 3-character code (separate from auto-generated display_id)

ALTER TABLE public.id_tenants
    ADD COLUMN IF NOT EXISTS studio_id TEXT;

-- Optional: Add constraint for 3-character format
ALTER TABLE public.id_tenants
    ADD CONSTRAINT id_tenants_studio_id_format
    CHECK (studio_id IS NULL OR LENGTH(studio_id) <= 5);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_id_tenants_studio_id ON public.id_tenants(studio_id);

COMMENT ON COLUMN public.id_tenants.studio_id IS 'User-supplied 3-character dealership code (e.g., 48C)';
COMMENT ON COLUMN public.id_tenants.display_id IS 'System-generated 9-character unique identifier';
