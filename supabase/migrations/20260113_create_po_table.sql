-- Purchase Order System (Indents)

CREATE TYPE po_status AS ENUM ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED');

CREATE TABLE public.purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
    order_number TEXT NOT NULL, -- Format: PO-{Year}-{Seq}
    status po_status DEFAULT 'DRAFT',
    vendor_name TEXT, -- e.g. "TVS Motor Company"
    expected_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID -- User ID
);

CREATE TABLE public.purchase_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    po_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
    sku_id UUID REFERENCES public.vehicle_colors(id) NOT NULL,
    ordered_qty INT NOT NULL CHECK (ordered_qty > 0),
    received_qty INT DEFAULT 0 CHECK (received_qty >= 0),
    unit_cost NUMERIC, -- Expected Cost
    CONSTRAINT valid_receipt CHECK (received_qty <= ordered_qty) -- Can be relaxed if excess is allowed
);

-- Indexes
CREATE INDEX idx_po_tenant ON public.purchase_orders(tenant_id);
CREATE INDEX idx_po_status ON public.purchase_orders(status);
CREATE INDEX idx_po_items_po ON public.purchase_order_items(po_id);

-- RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own POs" 
ON public.purchase_orders FOR ALL 
USING (tenant_id IN (
    SELECT tenant_id FROM public.memberships 
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
));

CREATE POLICY "Tenants can view own PO Items" 
ON public.purchase_order_items FOR ALL 
USING (po_id IN (
    SELECT id FROM public.purchase_orders 
    WHERE tenant_id IN (
        SELECT tenant_id FROM public.memberships 
        WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
));
