-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for tenants (Authenticted users can view)
CREATE POLICY "Allow authenticated view tenants" ON public.tenants
    FOR SELECT
    TO authenticated
    USING (true);

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_bank_applications_lead_id ON public.bank_applications(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_dealer_shares_shared_by ON public.lead_dealer_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_lead_events_actor_user_id ON public.lead_events(actor_user_id);
