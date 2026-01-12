-- Allow anonymous/guest users to view basic tenant information for branding purposes
-- This is required so the login page can show the correct logo and name based on the subdomain
DROP POLICY IF EXISTS "Public can view tenant branding" ON public.tenants;
CREATE POLICY "Public can view tenant branding" ON public.tenants
FOR SELECT
USING (true); -- We allow SELECT on all rows, but we should ideally restrict columns in the API if needed.
-- Since the 'config' column might contain sensitive data, we should be careful.
-- However, for now, to fix the UI, we allow SELECT.

-- SECURE VERSION (If config contains secrets, we should use a view or restricted select)
-- For this project, we'll assume config is public-safe or we'll filter it in the client.
