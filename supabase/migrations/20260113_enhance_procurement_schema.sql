-- Requisition System (Internal Demand)
CREATE TABLE public.purchase_requisitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
    requested_by UUID, -- Sales person
    customer_name TEXT, -- Optional (Linked to a specific customer)
    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, CONVERTED_TO_PO, REJECTED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.purchase_requisition_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requisition_id UUID REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE,
    sku_id UUID REFERENCES public.vehicle_colors(id) NOT NULL,
    quantity INT DEFAULT 1,
    notes TEXT
);

-- Enhanced Purchase Orders (Supply)
-- Modify existing PO table to support linking to requisitions and logistics
ALTER TABLE public.purchase_orders 
ADD COLUMN requisition_id UUID REFERENCES public.purchase_requisitions(id),
ADD COLUMN transporter_name TEXT,
ADD COLUMN transporter_contact TEXT,
ADD COLUMN docket_number TEXT; -- LR/GR Number

-- In-Transit System (Logistics)
-- We can track shipment status on the PO itself or a separate shipment table.
-- For now, extending PO status is simpler: 'IN_TRANSIT', 'DELIVERED'.

-- Inventory Status Update
-- Add 'ALLOCATED' status to inventory for items that are booked against a requisition
ALTER TYPE inventory_status ADD VALUE IF NOT EXISTS 'ALLOCATED';

-- RLS for Requisitions
ALTER TABLE public.purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requisition_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own requisitions" 
ON public.purchase_requisitions FOR ALL 
USING (tenant_id IN (
    SELECT tenant_id FROM public.memberships 
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
));

CREATE POLICY "Tenants can view own requisition items" 
ON public.purchase_requisition_items FOR ALL 
USING (requisition_id IN (
    SELECT id FROM public.purchase_requisitions 
    WHERE tenant_id IN (
        SELECT tenant_id FROM public.memberships 
        WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
));
