-- Ensure crm_leads has updated_at for compatibility with existing CRM actions.
ALTER TABLE IF EXISTS public.crm_leads
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Backfill where possible to keep chronological consistency.
UPDATE public.crm_leads
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;
