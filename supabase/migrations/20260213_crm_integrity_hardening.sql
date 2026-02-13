-- Migration: CRM Integrity Hardening (audit log, soft delete, FK protection, snapshots, transactional booking)

-- 1) Immutable audit log
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
    source TEXT NOT NULL DEFAULT 'APP'
);

CREATE INDEX IF NOT EXISTS idx_crm_audit_entity ON public.crm_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_time ON public.crm_audit_log(performed_at DESC);

CREATE OR REPLACE FUNCTION public.crm_audit_log_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old jsonb;
    v_new jsonb;
    v_changed text[];
    v_entity text;
    v_action text;
    v_performed_by uuid;
    v_source text;
    v_entity_id uuid;
BEGIN
    v_action := TG_OP;

    IF TG_OP = 'INSERT' THEN
        v_old := NULL;
        v_new := to_jsonb(NEW);
        v_entity_id := NEW.id;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_entity_id := NEW.id;
        SELECT array_agg(key) INTO v_changed
        FROM jsonb_object_keys(v_new) key
        WHERE (v_old->key) IS DISTINCT FROM (v_new->key);
    ELSIF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        v_new := NULL;
        v_entity_id := OLD.id;
    END IF;

    v_entity := CASE TG_TABLE_NAME
        WHEN 'crm_leads' THEN 'LEAD'
        WHEN 'crm_quotes' THEN 'QUOTE'
        WHEN 'crm_bookings' THEN 'BOOKING'
        WHEN 'crm_payments' THEN 'PAYMENT'
        WHEN 'crm_disbursals' THEN 'DISBURSAL'
        ELSE upper(TG_TABLE_NAME)
    END;

    v_performed_by := auth.uid();
    v_source := COALESCE(current_setting('app.audit_source', true), 'APP');

    INSERT INTO public.crm_audit_log(
        entity_type,
        entity_id,
        action,
        old_data,
        new_data,
        changed_fields,
        performed_by,
        source
    ) VALUES (
        v_entity,
        v_entity_id,
        v_action,
        v_old,
        v_new,
        v_changed,
        v_performed_by,
        v_source
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['crm_leads','crm_quotes','crm_bookings','crm_payments','crm_disbursals'] LOOP
        IF to_regclass('public.' || t) IS NOT NULL THEN
            EXECUTE format('DROP TRIGGER IF EXISTS tr_%s_audit_log ON public.%I', t, t);
            EXECUTE format('CREATE TRIGGER tr_%s_audit_log AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.crm_audit_log_fn()', t, t);
        END IF;
    END LOOP;
END $$;

-- 2) Soft delete columns
ALTER TABLE IF EXISTS public.crm_leads ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.crm_leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.crm_leads ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE IF EXISTS public.crm_bookings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.crm_bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.crm_bookings ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE IF EXISTS public.crm_payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.crm_payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.crm_payments ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE IF EXISTS public.crm_disbursals ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.crm_disbursals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.crm_disbursals ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- 3) Snapshot redundancy (flat columns)
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS snap_brand TEXT;
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS snap_model TEXT;
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS snap_variant TEXT;
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS snap_color TEXT;
ALTER TABLE IF EXISTS public.crm_quotes ADD COLUMN IF NOT EXISTS snap_dealer_name TEXT;

-- 4) FK chain protection (RESTRICT) with safe validation
DO $$
BEGIN
    -- crm_quotes.variant_id -> cat_items.id
    IF to_regclass('public.crm_quotes') IS NOT NULL
       AND to_regclass('public.cat_items') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_quotes' AND column_name = 'variant_id')
       AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_crm_quotes_variant_id') THEN
        ALTER TABLE public.crm_quotes
            ADD CONSTRAINT fk_crm_quotes_variant_id
            FOREIGN KEY (variant_id) REFERENCES public.cat_items(id)
            ON DELETE RESTRICT
            NOT VALID;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_crm_quotes_variant_id') THEN
        IF (SELECT COUNT(*)
            FROM public.crm_quotes q
            LEFT JOIN public.cat_items c ON q.variant_id = c.id
            WHERE q.variant_id IS NOT NULL AND c.id IS NULL) = 0 THEN
            ALTER TABLE public.crm_quotes VALIDATE CONSTRAINT fk_crm_quotes_variant_id;
        END IF;
    END IF;

    -- crm_quotes.studio_id -> id_tenants.id
    IF to_regclass('public.crm_quotes') IS NOT NULL
       AND to_regclass('public.id_tenants') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_quotes' AND column_name = 'studio_id')
       AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_crm_quotes_studio_id') THEN
        ALTER TABLE public.crm_quotes
            ADD CONSTRAINT fk_crm_quotes_studio_id
            FOREIGN KEY (studio_id) REFERENCES public.id_tenants(id)
            ON DELETE RESTRICT
            NOT VALID;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_crm_quotes_studio_id') THEN
        IF (SELECT COUNT(*)
            FROM public.crm_quotes q
            LEFT JOIN public.id_tenants t ON q.studio_id = t.id
            WHERE q.studio_id IS NOT NULL AND t.id IS NULL) = 0 THEN
            ALTER TABLE public.crm_quotes VALIDATE CONSTRAINT fk_crm_quotes_studio_id;
        END IF;
    END IF;

    -- crm_leads.customer_id -> id_members.id
    IF to_regclass('public.crm_leads') IS NOT NULL
       AND to_regclass('public.id_members') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_leads' AND column_name = 'customer_id')
       AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_crm_leads_customer_id') THEN
        ALTER TABLE public.crm_leads
            ADD CONSTRAINT fk_crm_leads_customer_id
            FOREIGN KEY (customer_id) REFERENCES public.id_members(id)
            ON DELETE RESTRICT
            NOT VALID;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_crm_leads_customer_id') THEN
        IF (SELECT COUNT(*)
            FROM public.crm_leads l
            LEFT JOIN public.id_members m ON l.customer_id = m.id
            WHERE l.customer_id IS NOT NULL AND m.id IS NULL) = 0 THEN
            ALTER TABLE public.crm_leads VALIDATE CONSTRAINT fk_crm_leads_customer_id;
        END IF;
    END IF;
END $$;

-- 5) Transactional booking conversion
CREATE OR REPLACE FUNCTION public.create_booking_from_quote(quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    q public.crm_quotes%ROWTYPE;
    booking_id uuid;
    grand_total numeric;
    base_price numeric;
BEGIN
    SELECT * INTO q
    FROM public.crm_quotes
    WHERE id = quote_id
      AND (is_deleted IS FALSE OR is_deleted IS NULL)
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quote not found';
    END IF;

    IF q.status <> 'CONFIRMED' THEN
        RAISE EXCEPTION 'Quote must be CONFIRMED before converting to Booking';
    END IF;

    grand_total := COALESCE(q.on_road_price, NULLIF((q.commercials->>'grand_total')::numeric, 0), 0);
    base_price := COALESCE(q.ex_showroom_price, NULLIF((q.commercials->>'ex_showroom')::numeric, 0), 0);

    INSERT INTO public.crm_bookings(
        tenant_id,
        quote_id,
        lead_id,
        variant_id,
        color_id,
        grand_total,
        base_price,
        vehicle_details,
        status,
        current_stage
    ) VALUES (
        q.tenant_id,
        q.id,
        q.lead_id,
        q.variant_id,
        q.color_id,
        grand_total,
        base_price,
        jsonb_build_object('variant_id', q.variant_id, 'commercial_snapshot', q.commercials),
        'BOOKED',
        'BOOKING'
    )
    RETURNING id INTO booking_id;

    UPDATE public.crm_quotes
    SET status = 'BOOKED',
        updated_at = now()
    WHERE id = q.id;

    IF q.lead_id IS NOT NULL THEN
        UPDATE public.crm_leads
        SET status = 'CLOSED',
            updated_at = now()
        WHERE id = q.lead_id
          AND (is_deleted IS FALSE OR is_deleted IS NULL);

        UPDATE public.crm_quotes
        SET status = 'CANCELED',
            updated_at = now()
        WHERE lead_id = q.lead_id
          AND id <> q.id
          AND status NOT IN ('BOOKED','BOOKING');
    END IF;

    RETURN booking_id;
END;
$$;
