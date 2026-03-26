-- Migration: Auto-sync crm_quotes.commercials JSON with assigned_tenant_id changes
-- Ensures that direct DB updates to assigned_tenant_id keeps the commercials payload consistent for the UI.

CREATE OR REPLACE FUNCTION public.sync_crm_quote_dealer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dealer_info jsonb;
    v_commercials_jsonb jsonb;
BEGIN
    -- Only act if assigned_tenant_id is changed and is not null
    IF NEW.assigned_tenant_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.assigned_tenant_id IS DISTINCT FROM OLD.assigned_tenant_id) THEN
        
        -- Fetch new dealer info
        SELECT jsonb_build_object(
            'id', id,
            'tenant_id', id,
            'dealer_id', id,
            'dealer_name', name,
            'name', name,
            'studio_id', COALESCE(studio_id, display_id),
            'location', location
        ) INTO v_dealer_info
        FROM public.id_tenants
        WHERE id = NEW.assigned_tenant_id;

        IF v_dealer_info IS NOT NULL THEN
            -- Normalize commercials as jsonb for robust json/jsonb compatibility.
            v_commercials_jsonb := COALESCE(NEW.commercials::jsonb, '{}'::jsonb);
            
            -- Replace commercials->dealer with canonical dealer payload to avoid stale keys.
            v_commercials_jsonb := jsonb_set(
                v_commercials_jsonb,
                '{dealer}'::text[],
                v_dealer_info,
                true
            );

            -- Replace commercials->pricing_snapshot->dealer if pricing_snapshot exists.
            IF v_commercials_jsonb ? 'pricing_snapshot' THEN
                v_commercials_jsonb := jsonb_set(
                    v_commercials_jsonb,
                    '{pricing_snapshot,dealer}'::text[],
                    v_dealer_info,
                    true
                );
            END IF;

            -- Write back preserving current column type (json or jsonb).
            IF pg_typeof(NEW.commercials)::text = 'json' THEN
                NEW.commercials := v_commercials_jsonb::json;
            ELSE
                NEW.commercials := v_commercials_jsonb;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_crm_quote_dealer ON public.crm_quotes;
CREATE TRIGGER trg_sync_crm_quote_dealer
BEFORE INSERT OR UPDATE OF assigned_tenant_id ON public.crm_quotes
FOR EACH ROW
EXECUTE FUNCTION public.sync_crm_quote_dealer();
