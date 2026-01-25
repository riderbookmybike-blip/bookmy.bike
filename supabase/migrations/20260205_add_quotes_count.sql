-- Migration: Create Quotes Table and Add Count to Members
-- Description: Ensures crm_quotes exists, then adds quotes_count to id_members.

-- 1. Ensure Quotes Table Exists (using consistent naming 'crm_quotes')
CREATE TABLE IF NOT EXISTS public.crm_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    lead_id UUID REFERENCES public.crm_leads(id), -- Updated reference to crm_leads matching valid table
    
    -- Versioning
    version INTEGER DEFAULT 1,
    parent_quote_id UUID REFERENCES public.crm_quotes(id),
    is_latest BOOLEAN DEFAULT true,
    
    -- Configuration
    variant_id UUID,
    color_id UUID,
    
    -- Detailed Commercials
    commercials JSONB DEFAULT '{
        "base_price": 0,
        "road_tax": 0,
        "insurance": 0,
        "registration": 0,
        "accessories": [],
        "grand_total": 0
    }'::jsonb,
    
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.crm_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin Full Access Quotes" ON public.crm_quotes;
CREATE POLICY "Admin Full Access Quotes" ON public.crm_quotes FOR ALL USING (auth.role() = 'authenticated');

-- 2. Add quotes_count Column to Members
ALTER TABLE public.id_members
ADD COLUMN IF NOT EXISTS quotes_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_members_quotes_count ON public.id_members(quotes_count);

-- 3. Update Sync Function to handle Quotes
CREATE OR REPLACE FUNCTION public.sync_member_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_member_id UUID;
    l_count INTEGER;
    b_count INTEGER;
    q_count INTEGER;
BEGIN
    -- Determine Member ID
    IF TG_TABLE_NAME = 'crm_leads' THEN
        IF (TG_OP = 'DELETE') THEN target_member_id := OLD.customer_id;
        ELSE target_member_id := NEW.customer_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'crm_bookings' THEN
        IF (TG_OP = 'DELETE') THEN target_member_id := OLD.user_id;
        ELSE target_member_id := NEW.user_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'crm_quotes' THEN
         -- We need to find the customer_id from the lead
         IF (TG_OP = 'DELETE') THEN 
            SELECT customer_id INTO target_member_id FROM public.crm_leads WHERE id = OLD.lead_id;
         ELSE 
            SELECT customer_id INTO target_member_id FROM public.crm_leads WHERE id = NEW.lead_id;
         END IF;
    END IF;

    IF target_member_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Recalculate All Counts (Safe)
    SELECT COUNT(*) INTO l_count FROM public.crm_leads WHERE customer_id = target_member_id;
    SELECT COUNT(*) INTO b_count FROM public.crm_bookings WHERE user_id = target_member_id;
    
    -- Count Quotes: Join Quotes -> Leads
    SELECT COUNT(q.id) INTO q_count 
    FROM public.crm_quotes q
    JOIN public.crm_leads l ON q.lead_id = l.id
    WHERE l.customer_id = target_member_id;

    -- Update Member
    UPDATE public.id_members
    SET 
        leads_count = l_count,
        bookings_count = b_count,
        quotes_count = q_count,
        last_synced_at = NOW()
    WHERE id = target_member_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger: Quotes Changes
DROP TRIGGER IF EXISTS tr_sync_member_quotes ON public.crm_quotes;
CREATE TRIGGER tr_sync_member_quotes
AFTER INSERT OR UPDATE OR DELETE ON public.crm_quotes
FOR EACH ROW EXECUTE FUNCTION public.sync_member_stats();

-- 5. Execute Backfill for Quotes
DO $$
DECLARE
    m RECORD;
BEGIN
    FOR m IN SELECT id FROM public.id_members LOOP
        UPDATE public.id_members
        SET 
            quotes_count = (
                SELECT COUNT(q.id) 
                FROM public.crm_quotes q
                JOIN public.crm_leads l ON q.lead_id = l.id
                WHERE l.customer_id = m.id
            )
        WHERE id = m.id;
    END LOOP;
END $$;
