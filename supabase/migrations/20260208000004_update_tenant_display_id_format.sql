-- Migration: 20260208_update_tenant_display_id_format
-- Description: Enforce Studio ID format (2 digits + 1 letter) for dealership tenants

-- Ensure no auto-generation for tenant display_id (studio id is manually assigned)
DROP TRIGGER IF EXISTS trigger_generate_display_id ON public.id_tenants;

-- Format constraint: only dealers may have display_id, and if present must be NN[A-Z]
ALTER TABLE public.id_tenants
    DROP CONSTRAINT IF EXISTS id_tenants_display_id_format;

ALTER TABLE public.id_tenants
    ADD CONSTRAINT id_tenants_display_id_format
    CHECK (
        type <> 'DEALER'
        OR display_id IS NULL
        OR display_id ~ '^[0-9]{2}[A-Z]$'
    );
