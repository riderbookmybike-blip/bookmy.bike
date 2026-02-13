-- ============================================================================
-- Migration: CRM Data Integrity Hardening
-- Date: 2026-02-13
-- Layers: Audit Log | Soft-Delete | FK RESTRICT | Snapshot Redundancy | Atomic Booking
-- Idempotent: All statements use IF NOT EXISTS / IF EXISTS guards
-- ============================================================================

-- ============================================================================
-- 1) IMMUTABLE AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    performed_by UUID,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source TEXT DEFAULT 'APP',
    ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.crm_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time   ON public.crm_audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.crm_audit_log(action);

-- RLS
ALTER TABLE public.crm_audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on audit log' AND tablename = 'crm_audit_log') THEN
    CREATE POLICY "Service role full access on audit log" ON crm_audit_log FOR ALL
      USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can read audit log' AND tablename = 'crm_audit_log') THEN
    CREATE POLICY "Authenticated users can read audit log" ON crm_audit_log FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ============================================================================
-- 2) GENERIC AUDIT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_crm_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_entity_type TEXT;
    v_changed TEXT[];
    v_col TEXT;
    v_old_val TEXT;
    v_new_val TEXT;
BEGIN
    v_entity_type := CASE TG_TABLE_NAME
        WHEN 'crm_leads' THEN 'LEAD'
        WHEN 'crm_quotes' THEN 'QUOTE'
        WHEN 'crm_bookings' THEN 'BOOKING'
        WHEN 'crm_payments' THEN 'PAYMENT'
        WHEN 'crm_quote_finance_attempts' THEN 'FINANCE_ATTEMPT'
        ELSE UPPER(TG_TABLE_NAME)
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO crm_audit_log (entity_type, entity_id, action, new_data, performed_by, source)
        VALUES (v_entity_type, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid(), 'TRIGGER');
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_changed := ARRAY[]::TEXT[];
        FOR v_col IN SELECT key FROM jsonb_each(to_jsonb(NEW))
        LOOP
            v_old_val := (to_jsonb(OLD) ->> v_col);
            v_new_val := (to_jsonb(NEW) ->> v_col);
            IF v_old_val IS DISTINCT FROM v_new_val THEN
                v_changed := array_append(v_changed, v_col);
            END IF;
        END LOOP;
        IF array_length(v_changed, 1) > 0 THEN
            INSERT INTO crm_audit_log (entity_type, entity_id, action, old_data, new_data, changed_fields, performed_by, source)
            VALUES (v_entity_type, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), v_changed, auth.uid(), 'TRIGGER');
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO crm_audit_log (entity_type, entity_id, action, old_data, performed_by, source)
        VALUES (v_entity_type, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid(), 'TRIGGER');
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3) AUDIT TRIGGERS (7 total)
-- ============================================================================

DROP TRIGGER IF EXISTS trg_audit_crm_leads ON crm_leads;
CREATE TRIGGER trg_audit_crm_leads
  AFTER INSERT OR UPDATE OR DELETE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION fn_crm_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_crm_quotes ON crm_quotes;
CREATE TRIGGER trg_audit_crm_quotes
  AFTER INSERT OR UPDATE OR DELETE ON crm_quotes
  FOR EACH ROW EXECUTE FUNCTION fn_crm_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_crm_bookings ON crm_bookings;
CREATE TRIGGER trg_audit_crm_bookings
  AFTER INSERT OR UPDATE OR DELETE ON crm_bookings
  FOR EACH ROW EXECUTE FUNCTION fn_crm_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_crm_payments ON crm_payments;
CREATE TRIGGER trg_audit_crm_payments
  AFTER INSERT OR UPDATE OR DELETE ON crm_payments
  FOR EACH ROW EXECUTE FUNCTION fn_crm_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_crm_finance ON crm_quote_finance_attempts;
CREATE TRIGGER trg_audit_crm_finance
  AFTER INSERT OR UPDATE OR DELETE ON crm_quote_finance_attempts
  FOR EACH ROW EXECUTE FUNCTION fn_crm_audit_trigger();

-- ============================================================================
-- 4) SOFT-DELETE COLUMNS (5 tables)
-- ============================================================================

ALTER TABLE IF EXISTS public.crm_leads ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.crm_leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.crm_leads ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE IF EXISTS public.crm_bookings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.crm_bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.crm_bookings ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE IF EXISTS public.crm_payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.crm_payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.crm_payments ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE IF EXISTS public.crm_quote_finance_attempts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.crm_quote_finance_attempts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.crm_quote_finance_attempts ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Partial indexes for active-record queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_active    ON crm_leads(tenant_id)    WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_crm_quotes_active   ON crm_quotes(tenant_id)   WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_crm_bookings_active ON crm_bookings(tenant_id) WHERE is_deleted = false;

-- ============================================================================
-- 5) SNAPSHOT REDUNDANCY (crm_quotes)
-- ============================================================================

ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS snap_brand TEXT;
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS snap_model TEXT;
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS snap_variant TEXT;
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS snap_color TEXT;
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS snap_dealer_name TEXT;

-- Backfill existing quotes from commercials JSONB
UPDATE crm_quotes SET
    snap_brand       = COALESCE(commercials->>'brand', ''),
    snap_model       = COALESCE(commercials->>'model', ''),
    snap_variant     = COALESCE(commercials->>'variant', ''),
    snap_color       = COALESCE(commercials->>'color_name', commercials->>'color', ''),
    snap_dealer_name = COALESCE(commercials->'dealer'->>'dealer_name',
                                commercials->'pricing_snapshot'->'dealer'->>'dealer_name', '')
WHERE snap_brand IS NULL AND commercials IS NOT NULL;

-- ============================================================================
-- 6) FK RESTRICT PROTECTION (9 constraints)
-- ============================================================================

-- crm_quotes.variant_id → cat_items.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_quotes_variant_protect') THEN
    ALTER TABLE crm_quotes ADD CONSTRAINT fk_quotes_variant_protect
      FOREIGN KEY (variant_id) REFERENCES cat_items(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- crm_quotes.color_id → cat_items.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_quotes_color_protect') THEN
    ALTER TABLE crm_quotes ADD CONSTRAINT fk_quotes_color_protect
      FOREIGN KEY (color_id) REFERENCES cat_items(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- crm_quotes.lead_id → crm_leads.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_quotes_lead_protect') THEN
    ALTER TABLE crm_quotes ADD CONSTRAINT fk_quotes_lead_protect
      FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- crm_quotes.tenant_id → id_tenants.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_quotes_tenant_protect') THEN
    ALTER TABLE crm_quotes ADD CONSTRAINT fk_quotes_tenant_protect
      FOREIGN KEY (tenant_id) REFERENCES id_tenants(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- crm_quotes.studio_id → id_tenants.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_quotes_studio_protect') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='crm_quotes' AND column_name='studio_id') THEN
      ALTER TABLE crm_quotes ADD CONSTRAINT fk_quotes_studio_protect
        FOREIGN KEY (studio_id) REFERENCES id_tenants(id) ON DELETE RESTRICT;
    END IF;
  END IF;
END $$;

-- crm_bookings.quote_id → crm_quotes.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_quote_protect') THEN
    ALTER TABLE crm_bookings ADD CONSTRAINT fk_bookings_quote_protect
      FOREIGN KEY (quote_id) REFERENCES crm_quotes(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- crm_quote_finance_attempts.quote_id → crm_quotes.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_finance_quote_protect') THEN
    ALTER TABLE crm_quote_finance_attempts ADD CONSTRAINT fk_finance_quote_protect
      FOREIGN KEY (quote_id) REFERENCES crm_quotes(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- crm_leads.customer_id → id_members.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_leads_customer_protect') THEN
    ALTER TABLE crm_leads ADD CONSTRAINT fk_leads_customer_protect
      FOREIGN KEY (customer_id) REFERENCES id_members(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- crm_leads.tenant_id → id_tenants.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_leads_tenant_protect') THEN
    ALTER TABLE crm_leads ADD CONSTRAINT fk_leads_tenant_protect
      FOREIGN KEY (tenant_id) REFERENCES id_tenants(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================================================
-- 7) TRANSACTIONAL BOOKING CONVERSION (RPC)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_booking_from_quote(p_quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    q public.crm_quotes%ROWTYPE;
    booking_id uuid;
    v_grand_total numeric;
    v_base_price numeric;
BEGIN
    SELECT * INTO q FROM public.crm_quotes
    WHERE id = p_quote_id AND (is_deleted IS FALSE OR is_deleted IS NULL)
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Quote not found'; END IF;
    IF q.status <> 'CONFIRMED' THEN RAISE EXCEPTION 'Quote must be CONFIRMED before converting to Booking'; END IF;

    v_grand_total := COALESCE(q.on_road_price, NULLIF((q.commercials->>'grand_total')::numeric, 0), 0);
    v_base_price  := COALESCE(q.ex_showroom_price, NULLIF((q.commercials->>'ex_showroom')::numeric, 0), 0);

    INSERT INTO public.crm_bookings(
        tenant_id, quote_id, lead_id, variant_id, color_id,
        grand_total, base_price, vehicle_details, status, current_stage
    ) VALUES (
        q.tenant_id, q.id, q.lead_id, q.variant_id, q.color_id,
        v_grand_total, v_base_price,
        jsonb_build_object('variant_id', q.variant_id, 'commercial_snapshot', q.commercials),
        'BOOKED', 'BOOKING'
    )
    RETURNING id INTO booking_id;

    UPDATE public.crm_quotes SET status = 'BOOKED', updated_at = now() WHERE id = q.id;

    IF q.lead_id IS NOT NULL THEN
        UPDATE public.crm_leads SET status = 'CLOSED', updated_at = now()
        WHERE id = q.lead_id AND (is_deleted IS FALSE OR is_deleted IS NULL);

        UPDATE public.crm_quotes SET status = 'CANCELED', updated_at = now()
        WHERE lead_id = q.lead_id AND id <> q.id AND status NOT IN ('BOOKED','BOOKING');
    END IF;

    RETURN booking_id;
END;
$$;
