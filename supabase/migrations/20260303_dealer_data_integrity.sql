-- Migration: 20260303_dealer_data_integrity.sql
-- Description: Enforce data integrity for DEALER type tenants
-- 1. studio_id must be UNIQUE across all tenants
-- 2. For DEALER type: studio_id, slug, and location (via id_locations) are mandatory

-- 1. Add UNIQUE constraint on studio_id (only when not null)
-- First drop if exists (for idempotency)
ALTER TABLE public.id_tenants
    DROP CONSTRAINT IF EXISTS id_tenants_studio_id_unique;

-- Create unique index that ignores NULL values
CREATE UNIQUE INDEX IF NOT EXISTS idx_id_tenants_studio_id_unique
    ON public.id_tenants(studio_id)
    WHERE studio_id IS NOT NULL;

-- 2. Create trigger function to validate DEALER requirements
CREATE OR REPLACE FUNCTION validate_dealer_requirements()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate for DEALER type
    IF NEW.type = 'DEALER' THEN
        -- Check studio_id is not null
        IF NEW.studio_id IS NULL OR TRIM(NEW.studio_id) = '' THEN
            RAISE EXCEPTION 'DEALER type tenants must have a studio_id';
        END IF;
        
        -- Validate studio_id format: exactly 2 digits followed by 1 uppercase letter (e.g., 48K)
        IF NOT (NEW.studio_id ~ '^[0-9]{2}[A-Z]$') THEN
            RAISE EXCEPTION 'studio_id must be in format: 2 digits + 1 uppercase letter (e.g., 48K)';
        END IF;
        
        -- Check slug is not null
        IF NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
            RAISE EXCEPTION 'DEALER type tenants must have a slug';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger (drop first for idempotency)
DROP TRIGGER IF EXISTS trigger_validate_dealer_requirements ON public.id_tenants;

CREATE TRIGGER trigger_validate_dealer_requirements
    BEFORE INSERT OR UPDATE ON public.id_tenants
    FOR EACH ROW
    EXECUTE FUNCTION validate_dealer_requirements();

-- 4. Create function to check dealer has location (called separately on location changes)
CREATE OR REPLACE FUNCTION check_dealer_has_location()
RETURNS TRIGGER AS $$
DECLARE
    tenant_type TEXT;
    location_count INTEGER;
BEGIN
    -- Check if this is a DELETE operation on id_locations
    IF TG_OP = 'DELETE' THEN
        -- Get tenant type
        SELECT type INTO tenant_type FROM public.id_tenants WHERE id = OLD.tenant_id;
        
        IF tenant_type = 'DEALER' THEN
            -- Count remaining active locations
            SELECT COUNT(*) INTO location_count 
            FROM public.id_locations 
            WHERE tenant_id = OLD.tenant_id AND is_active = true AND id != OLD.id;
            
            IF location_count = 0 THEN
                RAISE EXCEPTION 'DEALER type tenants must have at least one active location';
            END IF;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for location deletions
DROP TRIGGER IF EXISTS trigger_check_dealer_has_location ON public.id_locations;

CREATE TRIGGER trigger_check_dealer_has_location
    BEFORE DELETE OR UPDATE ON public.id_locations
    FOR EACH ROW
    EXECUTE FUNCTION check_dealer_has_location();

COMMENT ON FUNCTION validate_dealer_requirements() IS 'Validates that DEALER type tenants have required fields: studio_id and slug';
COMMENT ON FUNCTION check_dealer_has_location() IS 'Ensures DEALER type tenants always have at least one active location';
