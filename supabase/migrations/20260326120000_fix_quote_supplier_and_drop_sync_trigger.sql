-- Fix quote assignment trigger type mismatch and split delivery supplier ownership.
-- 1) Remove sync_crm_quote_dealer trigger/function that caused json/jsonb mismatch errors.
-- 2) Add supplier_tenant_id to crm_quotes for delivery handler assignment.

DROP TRIGGER IF EXISTS trg_sync_crm_quote_dealer ON public.crm_quotes;
DROP FUNCTION IF EXISTS public.sync_crm_quote_dealer();

ALTER TABLE public.crm_quotes
ADD COLUMN IF NOT EXISTS supplier_tenant_id uuid;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'crm_quotes_supplier_tenant_id_fkey'
          AND conrelid = 'public.crm_quotes'::regclass
    ) THEN
        ALTER TABLE public.crm_quotes
        ADD CONSTRAINT crm_quotes_supplier_tenant_id_fkey
        FOREIGN KEY (supplier_tenant_id) REFERENCES public.id_tenants(id) ON DELETE SET NULL;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_crm_quotes_supplier_tenant_id
ON public.crm_quotes(supplier_tenant_id);

-- Backfill existing quotes: supplier defaults to dealership winner (tenant_id),
-- with assigned_tenant_id as fallback for historical records.
UPDATE public.crm_quotes
SET supplier_tenant_id = COALESCE(tenant_id, assigned_tenant_id)
WHERE supplier_tenant_id IS NULL
  AND COALESCE(tenant_id, assigned_tenant_id) IS NOT NULL;

CREATE OR REPLACE FUNCTION public.crm_quotes_set_default_supplier()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.supplier_tenant_id IS NULL THEN
        NEW.supplier_tenant_id := COALESCE(NEW.tenant_id, NEW.assigned_tenant_id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_quotes_set_default_supplier ON public.crm_quotes;
CREATE TRIGGER trg_crm_quotes_set_default_supplier
BEFORE INSERT OR UPDATE OF tenant_id, assigned_tenant_id, supplier_tenant_id ON public.crm_quotes
FOR EACH ROW
EXECUTE FUNCTION public.crm_quotes_set_default_supplier();
