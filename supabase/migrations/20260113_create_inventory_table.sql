-- Create Inventory Table (Physical Assets)
CREATE TYPE inventory_status AS ENUM ('IN_TRANSIT', 'AVAILABLE', 'BOOKED', 'SOLD');

CREATE TABLE public.vehicle_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku_id UUID REFERENCES public.vehicle_colors(id) NOT NULL,
    chassis_number TEXT NOT NULL,
    engine_number TEXT NOT NULL,
    current_owner_id UUID REFERENCES public.tenants(id) NOT NULL,
    status inventory_status DEFAULT 'AVAILABLE',
    dealer_price NUMERIC DEFAULT 0, -- Cost Price
    offer_price NUMERIC DEFAULT 0, -- Selling Price (can be separate from MRP)
    invoice_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: Chassis/Engine must be unique GLOBALLY (or at least per OEM, but global is safer for VIN)
    CONSTRAINT unique_chassis CHECK (char_length(chassis_number) > 5),
    UNIQUE(chassis_number),
    UNIQUE(engine_number)
);

-- Indexes for fast lookup
CREATE INDEX idx_inventory_owner ON public.vehicle_inventory(current_owner_id);
CREATE INDEX idx_inventory_sku ON public.vehicle_inventory(sku_id);
CREATE INDEX idx_inventory_status ON public.vehicle_inventory(status);
CREATE INDEX idx_inventory_chassis ON public.vehicle_inventory(chassis_number);

-- RLS Policies
ALTER TABLE public.vehicle_inventory ENABLE ROW LEVEL SECURITY;

-- Policy: Tenants can VIEW their own inventory
CREATE POLICY "Tenants can view own inventory" 
ON public.vehicle_inventory FOR SELECT 
USING (current_owner_id IN (
    SELECT tenant_id FROM public.memberships 
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
)); 
-- Note: Simplified RLS logic, usually relies on a helper function or direct matching if auth.uid() is mapped. 
-- For now, assuming basic tenant matching or that the app handles tenant context securely.
-- Lets use a safer generic policy for now:
-- "Users can see inventory belonging to their active tenant"
-- Requires auth.jwt() -> app_metadata -> tenant_id or similar.
-- For this prototype phase, lets assume "Member of Tenant" check.

-- Create Inventory Ledger (History)
CREATE TYPE inventory_transaction_type AS ENUM ('OEM_ALLOCATION', 'DEALER_TRANSFER', 'CUSTOMER_SALE', 'STOCK_ADJUSTMENT');

CREATE TABLE public.inventory_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id UUID REFERENCES public.vehicle_inventory(id) NOT NULL,
    from_tenant_id UUID REFERENCES public.tenants(id), -- Nullable for OEM creation
    to_tenant_id UUID REFERENCES public.tenants(id),
    transaction_type inventory_transaction_type NOT NULL,
    transferred_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX idx_ledger_inventory ON public.inventory_ledger(inventory_id);
