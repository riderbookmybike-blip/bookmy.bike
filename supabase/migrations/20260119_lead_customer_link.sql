-- Add customer_id reference to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.profiles(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON public.leads(customer_id);

-- Update RLS policies to include customer-based checks if necessary
-- For now, the tenant-based RLS is sufficient, but we might want to allow 
-- users to see their own data if they login as a customer.
