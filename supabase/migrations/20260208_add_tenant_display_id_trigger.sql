-- Migration: 20260208_add_tenant_display_id_trigger
-- Description: Ensure tenant display_id (studio ID) is generated for dealerships

ALTER TABLE public.id_tenants
    ADD COLUMN IF NOT EXISTS display_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_id_tenants_display_id ON public.id_tenants(display_id);

-- Backfill missing display IDs for dealers
UPDATE public.id_tenants
SET display_id = generate_display_id()
WHERE display_id IS NULL
  AND type = 'DEALER';

-- Auto-generate display_id on insert if not provided
DROP TRIGGER IF EXISTS trigger_generate_display_id ON public.id_tenants;
CREATE TRIGGER trigger_generate_display_id
    BEFORE INSERT ON public.id_tenants
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_display_id();
