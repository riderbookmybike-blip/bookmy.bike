-- Enable RLS on leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to INSERT leads (necessary for manual lead creation and public submissions)
DROP POLICY IF EXISTS "Allow authenticated users to insert leads" ON public.leads;
CREATE POLICY "Allow authenticated users to insert leads" 
ON public.leads 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy to allow users to SELECT leads belonging to their tenant
DROP POLICY IF EXISTS "Allow users to view their tenant's leads" ON public.leads;
CREATE POLICY "Allow users to view their tenant's leads" 
ON public.leads 
FOR SELECT 
TO authenticated 
USING (
    owner_tenant_id IN (
        SELECT tenant_id 
        FROM public.memberships 
        WHERE user_id = auth.uid()
    )
);

-- Policy to allow users to UPDATE leads belonging to their tenant
DROP POLICY IF EXISTS "Allow users to update their tenant's leads" ON public.leads;
CREATE POLICY "Allow users to update their tenant's leads" 
ON public.leads 
FOR UPDATE 
TO authenticated 
USING (
    owner_tenant_id IN (
        SELECT tenant_id 
        FROM public.memberships 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    owner_tenant_id IN (
        SELECT tenant_id 
        FROM public.memberships 
        WHERE user_id = auth.uid()
    )
);
