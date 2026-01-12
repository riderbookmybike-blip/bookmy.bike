-- Add Debug Hint Columns to Memberships for easier manual database management
ALTER TABLE public.memberships 
ADD COLUMN IF NOT EXISTS _user_email_hint TEXT,
ADD COLUMN IF NOT EXISTS _tenant_name_hint TEXT;

-- Function to sync hints
CREATE OR REPLACE FUNCTION public.sync_membership_hints()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync User Email from auth.users (via profiles for better safety)
    SELECT email INTO NEW._user_email_hint 
    FROM auth.users 
    WHERE id = NEW.user_id;

    -- Sync Tenant Name from tenants
    SELECT name INTO NEW._tenant_name_hint 
    FROM public.tenants 
    WHERE id = NEW.tenant_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to keep hints fresh
DROP TRIGGER IF EXISTS tr_sync_membership_hints ON public.memberships;
CREATE TRIGGER tr_sync_membership_hints
BEFORE INSERT OR UPDATE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.sync_membership_hints();

-- Backfill existing rows
UPDATE public.memberships
SET _user_email_hint = (SELECT email FROM auth.users WHERE id = user_id),
    _tenant_name_hint = (SELECT name FROM public.tenants WHERE id = tenant_id);
