-- Database Health Remediation: RLS + FK Indexes
-- Task 1: RLS policies (create policies first, then enable RLS)

-- crm_finance: tenant via booking_id -> crm_bookings.tenant_id
DROP POLICY IF EXISTS "CRM Finance tenant access" ON public.crm_finance;
CREATE POLICY "CRM Finance tenant access" ON public.crm_finance
  FOR ALL TO authenticated
  USING (
    public.check_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.crm_bookings b
      JOIN public.id_team t ON t.tenant_id = b.tenant_id
      WHERE b.id = crm_finance.booking_id
        AND t.user_id = auth.uid()
        AND t.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    public.check_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.crm_bookings b
      JOIN public.id_team t ON t.tenant_id = b.tenant_id
      WHERE b.id = crm_finance.booking_id
        AND t.user_id = auth.uid()
        AND t.status = 'ACTIVE'
    )
  );

-- crm_payments: tenant_id match (id_team) or super admin
DROP POLICY IF EXISTS "CRM Payments tenant access" ON public.crm_payments;
CREATE POLICY "CRM Payments tenant access" ON public.crm_payments
  FOR ALL TO authenticated
  USING (public.check_is_super_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.id_team t WHERE t.user_id = auth.uid() AND t.tenant_id = crm_payments.tenant_id AND t.status = 'ACTIVE'))
  WITH CHECK (public.check_is_super_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.id_team t WHERE t.user_id = auth.uid() AND t.tenant_id = crm_payments.tenant_id AND t.status = 'ACTIVE'));

-- crm_assets: tenant_id match (id_team) or super admin
DROP POLICY IF EXISTS "CRM Assets tenant access" ON public.crm_assets;
CREATE POLICY "CRM Assets tenant access" ON public.crm_assets
  FOR ALL TO authenticated
  USING (public.check_is_super_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.id_team t WHERE t.user_id = auth.uid() AND t.tenant_id = crm_assets.tenant_id AND t.status = 'ACTIVE'))
  WITH CHECK (public.check_is_super_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.id_team t WHERE t.user_id = auth.uid() AND t.tenant_id = crm_assets.tenant_id AND t.status = 'ACTIVE'));

-- id_member_addresses: member_id = auth.uid()
DROP POLICY IF EXISTS "id_member_addresses self access" ON public.id_member_addresses;
DROP POLICY IF EXISTS "Members read own addresses" ON public.id_member_addresses;
CREATE POLICY "id_member_addresses self access" ON public.id_member_addresses
  FOR ALL TO authenticated
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- id_member_contacts: member_id = auth.uid()
DROP POLICY IF EXISTS "id_member_contacts self access" ON public.id_member_contacts;
DROP POLICY IF EXISTS "Members read own contacts" ON public.id_member_contacts;
CREATE POLICY "id_member_contacts self access" ON public.id_member_contacts
  FOR ALL TO authenticated
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- id_member_events: member_id = auth.uid()
DROP POLICY IF EXISTS "id_member_events self access" ON public.id_member_events;
DROP POLICY IF EXISTS "Members read own events" ON public.id_member_events;
CREATE POLICY "id_member_events self access" ON public.id_member_events
  FOR ALL TO authenticated
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- id_member_tenants: member_id = auth.uid()
DROP POLICY IF EXISTS "id_member_tenants self access" ON public.id_member_tenants;
DROP POLICY IF EXISTS "Members read own tenants" ON public.id_member_tenants;
CREATE POLICY "id_member_tenants self access" ON public.id_member_tenants
  FOR ALL TO authenticated
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- inv_ledger: tenant membership on from_tenant_id or to_tenant_id, or super admin
DROP POLICY IF EXISTS "Inventory Ledger tenant access" ON public.inv_ledger;
CREATE POLICY "Inventory Ledger tenant access" ON public.inv_ledger
  FOR ALL TO authenticated
  USING (
    public.check_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.id_team t
      WHERE t.user_id = auth.uid()
        AND t.status = 'ACTIVE'
        AND (t.tenant_id = inv_ledger.from_tenant_id OR t.tenant_id = inv_ledger.to_tenant_id)
    )
  )
  WITH CHECK (
    public.check_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.id_team t
      WHERE t.user_id = auth.uid()
        AND t.status = 'ACTIVE'
        AND (t.tenant_id = inv_ledger.from_tenant_id OR t.tenant_id = inv_ledger.to_tenant_id)
    )
  );

-- mat_market_summary: public read
DROP POLICY IF EXISTS "Market summary public read" ON public.mat_market_summary;
CREATE POLICY "Market summary public read" ON public.mat_market_summary
  FOR SELECT TO public
  USING (true);

-- sys_error_log: admin only
DROP POLICY IF EXISTS "Sys error log admin" ON public.sys_error_log;
CREATE POLICY "Sys error log admin" ON public.sys_error_log
  FOR ALL TO authenticated
  USING (public.check_is_super_admin(auth.uid()))
  WITH CHECK (public.check_is_super_admin(auth.uid()));

-- sys_settings: admin only
DROP POLICY IF EXISTS "Sys settings admin" ON public.sys_settings;
CREATE POLICY "Sys settings admin" ON public.sys_settings
  FOR ALL TO authenticated
  USING (public.check_is_super_admin(auth.uid()))
  WITH CHECK (public.check_is_super_admin(auth.uid()));

-- cat_price_state_trash: admin only
DROP POLICY IF EXISTS "Cat price state trash admin" ON public.cat_price_state_trash;
CREATE POLICY "Cat price state trash admin" ON public.cat_price_state_trash
  FOR ALL TO authenticated
  USING (public.check_is_super_admin(auth.uid()))
  WITH CHECK (public.check_is_super_admin(auth.uid()));

-- Enable RLS after policies
ALTER TABLE public.crm_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_member_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_member_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_member_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_member_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mat_market_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_error_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_price_state_trash ENABLE ROW LEVEL SECURITY;

-- Task 3: FK indexes (dedup by existing leading-column index)
DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['brand_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.cat_price_dealer'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_cat_price_dealer_brand_id on public.cat_price_dealer: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.cat_price_dealer'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_cat_price_dealer_brand_id ON public.cat_price_dealer (brand_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['vehicle_model_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.cat_price_dealer'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_cat_price_dealer_vehicle_model_id on public.cat_price_dealer: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.cat_price_dealer'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_cat_price_dealer_vehicle_model_id ON public.cat_price_dealer (vehicle_model_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['tenant_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_booking_assets'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_booking_assets_tenant_id on public.crm_booking_assets: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_booking_assets'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_booking_assets_tenant_id ON public.crm_booking_assets (tenant_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['uploaded_by']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_booking_assets'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_booking_assets_uploaded_by on public.crm_booking_assets: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_booking_assets'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_booking_assets_uploaded_by ON public.crm_booking_assets (uploaded_by)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['user_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_bookings'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_bookings_user_id on public.crm_bookings: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_bookings'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_bookings_user_id ON public.crm_bookings (user_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['color_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_bookings'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_bookings_color_id on public.crm_bookings: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_bookings'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_bookings_color_id ON public.crm_bookings (color_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['variant_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_bookings'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_bookings_variant_id on public.crm_bookings: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_bookings'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_bookings_variant_id ON public.crm_bookings (variant_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['tenant_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_insurance'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_insurance_tenant_id on public.crm_insurance: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_insurance'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_insurance_tenant_id ON public.crm_insurance (tenant_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['entity_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_lead_assets'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_lead_assets_entity_id on public.crm_lead_assets: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_lead_assets'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_lead_assets_entity_id ON public.crm_lead_assets (entity_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['tenant_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_lead_assets'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_lead_assets_tenant_id on public.crm_lead_assets: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_lead_assets'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_lead_assets_tenant_id ON public.crm_lead_assets (tenant_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['uploaded_by']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_lead_assets'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_lead_assets_uploaded_by on public.crm_lead_assets: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_lead_assets'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_lead_assets_uploaded_by ON public.crm_lead_assets (uploaded_by)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['lead_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_lead_events'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_lead_events_lead_id on public.crm_lead_events: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_lead_events'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_lead_events_lead_id ON public.crm_lead_events (lead_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['referred_by_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_leads'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_leads_referred_by_id on public.crm_leads: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_leads'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_leads_referred_by_id ON public.crm_leads (referred_by_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['booking_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_payments'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_payments_booking_id on public.crm_payments: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_payments'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_payments_booking_id ON public.crm_payments (booking_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['lead_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_payments'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_payments_lead_id on public.crm_payments: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_payments'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_payments_lead_id ON public.crm_payments (lead_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['member_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_payments'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_payments_member_id on public.crm_payments: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_payments'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_payments_member_id ON public.crm_payments (member_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['tenant_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_payments'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_payments_tenant_id on public.crm_payments: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_payments'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_payments_tenant_id ON public.crm_payments (tenant_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['tenant_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_pdi'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_pdi_tenant_id on public.crm_pdi: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_pdi'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_pdi_tenant_id ON public.crm_pdi (tenant_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['created_by']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_quotes'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_quotes_created_by on public.crm_quotes: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_quotes'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_quotes_created_by ON public.crm_quotes (created_by)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['lead_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_quotes'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_quotes_lead_id on public.crm_quotes: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_quotes'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_quotes_lead_id ON public.crm_quotes (lead_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['parent_quote_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_quotes'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_quotes_parent_quote_id on public.crm_quotes: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_quotes'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_quotes_parent_quote_id ON public.crm_quotes (parent_quote_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['tenant_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.crm_registration'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_crm_registration_tenant_id on public.crm_registration: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.crm_registration'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_registration_tenant_id ON public.crm_registration (tenant_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['tenant_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.id_documents'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_id_documents_tenant_id on public.id_documents: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.id_documents'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_documents_tenant_id ON public.id_documents (tenant_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['member_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.id_member_addresses'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_id_member_addresses_member_id on public.id_member_addresses: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.id_member_addresses'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_member_addresses_member_id ON public.id_member_addresses (member_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['entity_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.id_member_assets'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_id_member_assets_entity_id on public.id_member_assets: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.id_member_assets'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_member_assets_entity_id ON public.id_member_assets (entity_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['tenant_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.id_member_assets'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_id_member_assets_tenant_id on public.id_member_assets: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.id_member_assets'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_member_assets_tenant_id ON public.id_member_assets (tenant_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['uploaded_by']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.id_member_assets'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_id_member_assets_uploaded_by on public.id_member_assets: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.id_member_assets'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_member_assets_uploaded_by ON public.id_member_assets (uploaded_by)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['member_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.id_member_events'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_id_member_events_member_id on public.id_member_events: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.id_member_events'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_member_events_member_id ON public.id_member_events (member_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['tenant_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.id_member_events'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_id_member_events_tenant_id on public.id_member_events: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.id_member_events'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_member_events_tenant_id ON public.id_member_events (tenant_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['tenant_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.id_primary_dealer_districts'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_id_primary_dealer_districts_tenant_id on public.id_primary_dealer_districts: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.id_primary_dealer_districts'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_primary_dealer_districts_tenant_id ON public.id_primary_dealer_districts (tenant_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['reports_to']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.id_team'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_id_team_reports_to on public.id_team: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.id_team'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_team_reports_to ON public.id_team (reports_to)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['tenant_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.id_team'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_id_team_tenant_id on public.id_team: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.id_team'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_team_tenant_id ON public.id_team (tenant_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['user_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.id_team'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_id_team_user_id on public.id_team: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.id_team'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_team_user_id ON public.id_team (user_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['requisition_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.inv_purchase_orders'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_inv_purchase_orders_requisition_id on public.inv_purchase_orders: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.inv_purchase_orders'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_inv_purchase_orders_requisition_id ON public.inv_purchase_orders (requisition_id)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['archived_by']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.sys_archived'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_sys_archived_archived_by on public.sys_archived: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.sys_archived'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sys_archived_archived_by ON public.sys_archived (archived_by)';
  END IF;
END $$;

DO $$
DECLARE
  cols int2[];
BEGIN
  SELECT array_agg(a.attnum ORDER BY u.ord)
  INTO cols
  FROM unnest(ARRAY['template_id']) WITH ORDINALITY u(col, ord)
  JOIN pg_attribute a ON a.attrelid = 'public.sys_role_templates'::regclass AND a.attname = u.col;
  IF cols IS NULL THEN
    RAISE NOTICE 'Skip index idx_sys_role_templates_template_id on public.sys_role_templates: column(s) not found';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.sys_role_templates'::regclass
      AND i.indisvalid AND i.indisready
      AND i.indkey::int2[][:array_length(cols,1)] = cols
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sys_role_templates_template_id ON public.sys_role_templates (template_id)';
  END IF;
END $$;
