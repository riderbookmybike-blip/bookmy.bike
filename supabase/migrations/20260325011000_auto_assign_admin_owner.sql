-- Migration: Auto-assign Ajit (499a910c-9e1a-4a7a-b547-38fb464db890) as OWNER for all existing and future tenants

-- 1. Backfill all existing tenants where he does not have an entry
INSERT INTO public.id_team (id, user_id, tenant_id, role, status)
SELECT gen_random_uuid(), '499a910c-9e1a-4a7a-b547-38fb464db890', id, 'OWNER', 'ACTIVE'
FROM public.id_tenants
WHERE id NOT IN (
    SELECT tenant_id 
    FROM public.id_team 
    WHERE user_id = '499a910c-9e1a-4a7a-b547-38fb464db890'
);

-- 2. Create Trigger Function to auto-assign for any new tenants created in the future
CREATE OR REPLACE FUNCTION public.auto_assign_superadmin_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only insert if not already present (failsafe)
    IF NOT EXISTS (
        SELECT 1 FROM public.id_team 
        WHERE user_id = '499a910c-9e1a-4a7a-b547-38fb464db890' AND tenant_id = NEW.id
    ) THEN
        INSERT INTO public.id_team (id, user_id, tenant_id, role, status)
        VALUES (gen_random_uuid(), '499a910c-9e1a-4a7a-b547-38fb464db890', NEW.id, 'OWNER', 'ACTIVE');
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. Create Trigger on id_tenants
DROP TRIGGER IF EXISTS trigger_auto_assign_superadmin_owner ON public.id_tenants;
CREATE TRIGGER trigger_auto_assign_superadmin_owner
AFTER INSERT ON public.id_tenants
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_superadmin_owner();
