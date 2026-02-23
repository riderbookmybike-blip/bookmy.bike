-- ============================================================
-- INV-001: Strict Relational Inventory Schema (Zero JSONB)
-- Drop all 16 legacy inv_* tables + old enums, create 7 new.
-- ============================================================

-- ==========================================
-- PHASE 1: DROP LEGACY TABLES (all 0 rows)
-- ==========================================
DROP TABLE IF EXISTS public.inv_grn_vehicle_details CASCADE;
DROP TABLE IF EXISTS public.inv_grn_accessory_details CASCADE;
DROP TABLE IF EXISTS public.inv_grn_items CASCADE;
DROP TABLE IF EXISTS public.inv_grn CASCADE;
DROP TABLE IF EXISTS public.inv_delivery_challan_items CASCADE;
DROP TABLE IF EXISTS public.inv_delivery_challans CASCADE;
DROP TABLE IF EXISTS public.inv_purchase_order_items CASCADE;
DROP TABLE IF EXISTS public.inv_procurement_quotes CASCADE;
DROP TABLE IF EXISTS public.inv_purchase_orders CASCADE;
DROP TABLE IF EXISTS public.inv_requisition_items CASCADE;
DROP TABLE IF EXISTS public.inv_requisitions CASCADE;
DROP TABLE IF EXISTS public.inv_stock_transfers CASCADE;
DROP TABLE IF EXISTS public.inv_stock_ledger CASCADE;
DROP TABLE IF EXISTS public._archived_inv_ledger CASCADE;
DROP TABLE IF EXISTS public.inv_stock CASCADE;
DROP TABLE IF EXISTS public._archived_inv_marketplace CASCADE;

DROP TYPE IF EXISTS public.inventory_status CASCADE;
DROP TYPE IF EXISTS public.inventory_transaction_type CASCADE;
DROP TYPE IF EXISTS public.po_status CASCADE;

-- ==========================================
-- PHASE 2: CREATE NEW ENUMS
-- ==========================================
CREATE TYPE public.inv_request_status AS ENUM ('QUOTING', 'ORDERED', 'RECEIVED', 'CANCELLED');
CREATE TYPE public.inv_cost_type AS ENUM ('EX_SHOWROOM', 'INSURANCE_TP', 'INSURANCE_ZD', 'RTO_REGISTRATION', 'HYPOTHECATION', 'TRANSPORT', 'ACCESSORY', 'OTHER');
CREATE TYPE public.inv_quote_status AS ENUM ('SUBMITTED', 'SELECTED', 'REJECTED');
CREATE TYPE public.inv_payment_status AS ENUM ('UNPAID', 'PARTIAL_PAID', 'FULLY_PAID');
CREATE TYPE public.inv_po_status AS ENUM ('DRAFT', 'SENT', 'SHIPPED', 'RECEIVED');
CREATE TYPE public.inv_qc_status AS ENUM ('PENDING', 'PASSED', 'FAILED_DAMAGE', 'FAILED_MISSING');
CREATE TYPE public.inv_stock_status AS ENUM ('AVAILABLE', 'SOFT_LOCKED', 'HARD_LOCKED', 'SOLD', 'IN_TRANSIT');
CREATE TYPE public.inv_ledger_action AS ENUM ('RECEIVED', 'QC_PASSED', 'QC_FAILED', 'SOFT_LOCKED', 'HARD_LOCKED', 'UNLOCKED', 'SOLD', 'TRANSFERRED', 'DAMAGED');
CREATE TYPE public.inv_source_type AS ENUM ('BOOKING', 'DIRECT');

-- ==========================================
-- PHASE 3: CREATE NEW TABLES
-- ==========================================

CREATE TABLE public.inv_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.id_tenants(id),
  booking_id UUID REFERENCES public.crm_bookings(id),
  sku_id UUID NOT NULL,
  source_type public.inv_source_type NOT NULL DEFAULT 'DIRECT',
  status public.inv_request_status NOT NULL DEFAULT 'QUOTING',
  delivery_branch_id UUID REFERENCES public.id_locations(id),
  display_id VARCHAR(9) UNIQUE DEFAULT SUBSTRING(upper(md5(random()::text)) FROM 1 FOR 9),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.inv_requests IS 'Procurement requests - what we need and where it should go.';

CREATE TABLE public.inv_request_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.inv_requests(id) ON DELETE CASCADE,
  cost_type public.inv_cost_type NOT NULL,
  expected_amount NUMERIC NOT NULL DEFAULT 0 CHECK (expected_amount >= 0),
  description TEXT,
  UNIQUE(request_id, cost_type)
);
COMMENT ON TABLE public.inv_request_items IS 'Cost components for a request with expected baseline amounts from catalog.';

CREATE TABLE public.inv_dealer_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.inv_requests(id) ON DELETE CASCADE,
  dealer_tenant_id UUID NOT NULL REFERENCES public.id_tenants(id),
  quoted_by_user_id UUID REFERENCES auth.users(id),
  bundled_item_ids UUID[] NOT NULL DEFAULT '{}',
  bundled_amount NUMERIC NOT NULL CHECK (bundled_amount > 0),
  expected_total NUMERIC NOT NULL DEFAULT 0 CHECK (expected_total >= 0),
  variance_amount NUMERIC GENERATED ALWAYS AS (bundled_amount - expected_total) STORED,
  transport_amount NUMERIC NOT NULL DEFAULT 0 CHECK (transport_amount >= 0),
  freebie_description TEXT,
  freebie_sku_id UUID,
  status public.inv_quote_status NOT NULL DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.inv_dealer_quotes IS 'Bundled offers from supplier dealerships with auto-computed variance.';

CREATE TABLE public.inv_purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.inv_requests(id),
  quote_id UUID NOT NULL REFERENCES public.inv_dealer_quotes(id),
  dealer_tenant_id UUID NOT NULL REFERENCES public.id_tenants(id),
  total_po_value NUMERIC NOT NULL CHECK (total_po_value > 0),
  payment_status public.inv_payment_status NOT NULL DEFAULT 'UNPAID',
  po_status public.inv_po_status NOT NULL DEFAULT 'DRAFT',
  display_id VARCHAR(9) UNIQUE DEFAULT SUBSTRING(upper(md5(random()::text)) FROM 1 FOR 9),
  transporter_name TEXT,
  docket_number TEXT,
  expected_delivery_date DATE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.inv_purchase_orders IS 'Financial commitment to a supplier dealership, linked to Books for payments.';

CREATE TABLE public.inv_po_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES public.inv_purchase_orders(id) ON DELETE CASCADE,
  transaction_id UUID,
  amount_paid NUMERIC NOT NULL CHECK (amount_paid > 0),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
COMMENT ON TABLE public.inv_po_payments IS 'Advance/full payments against POs, maps to Books ledger.';
COMMENT ON COLUMN public.inv_po_payments.transaction_id IS 'FK to acc_transactions - constraint added when Books module lands.';

CREATE TABLE public.inv_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.id_tenants(id),
  po_id UUID NOT NULL REFERENCES public.inv_purchase_orders(id),
  sku_id UUID NOT NULL,
  branch_id UUID NOT NULL REFERENCES public.id_locations(id),
  chassis_number TEXT NOT NULL UNIQUE CHECK (char_length(chassis_number) > 5),
  engine_number TEXT NOT NULL,
  battery_make TEXT,
  media_chassis_url TEXT NOT NULL,
  media_engine_url TEXT NOT NULL,
  media_sticker_url TEXT,
  media_damage_urls TEXT[],
  media_qc_video_url TEXT NOT NULL,
  qc_status public.inv_qc_status NOT NULL DEFAULT 'PENDING',
  qc_notes TEXT,
  status public.inv_stock_status NOT NULL DEFAULT 'AVAILABLE',
  is_shared BOOLEAN NOT NULL DEFAULT false,
  locked_by_tenant_id UUID REFERENCES public.id_tenants(id),
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.inv_stock IS 'Physical vehicle units with mandatory QC media and cross-tenant sharing.';

CREATE TABLE public.inv_stock_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_id UUID NOT NULL REFERENCES public.inv_stock(id) ON DELETE CASCADE,
  action public.inv_ledger_action NOT NULL,
  actor_tenant_id UUID REFERENCES public.id_tenants(id),
  actor_user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.inv_stock_ledger IS 'Immutable audit trail for all stock movements.';

-- ==========================================
-- PHASE 4: INDEXES
-- ==========================================
CREATE INDEX idx_inv_requests_tenant ON public.inv_requests(tenant_id);
CREATE INDEX idx_inv_requests_booking ON public.inv_requests(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_inv_requests_status ON public.inv_requests(status);
CREATE INDEX idx_inv_dealer_quotes_request ON public.inv_dealer_quotes(request_id);
CREATE INDEX idx_inv_purchase_orders_request ON public.inv_purchase_orders(request_id);
CREATE INDEX idx_inv_stock_tenant ON public.inv_stock(tenant_id);
CREATE INDEX idx_inv_stock_sku ON public.inv_stock(sku_id);
CREATE INDEX idx_inv_stock_status ON public.inv_stock(status);
CREATE INDEX idx_inv_stock_shared ON public.inv_stock(is_shared) WHERE is_shared = true;
CREATE INDEX idx_inv_stock_ledger_stock ON public.inv_stock_ledger(stock_id);

-- ==========================================
-- PHASE 5: RLS
-- ==========================================
ALTER TABLE public.inv_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_dealer_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_po_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_stock_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_requests_tenant_access" ON public.inv_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "inv_request_items_access" ON public.inv_request_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "inv_dealer_quotes_access" ON public.inv_dealer_quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "inv_purchase_orders_access" ON public.inv_purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "inv_po_payments_access" ON public.inv_po_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "inv_stock_access" ON public.inv_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "inv_stock_ledger_access" ON public.inv_stock_ledger FOR ALL USING (true) WITH CHECK (true);
