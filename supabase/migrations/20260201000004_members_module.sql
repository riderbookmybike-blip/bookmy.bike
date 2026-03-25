-- Members Module: identity + contacts + addresses + tenant links + events

-- 0. Ensure primary members table exists (rename if needed)
DO $$
BEGIN
    IF to_regclass('public.id_members') IS NULL THEN
        IF to_regclass('public.crm_members') IS NOT NULL THEN
            EXECUTE 'ALTER TABLE public.crm_members RENAME TO id_members';
        ELSIF to_regclass('public.profiles') IS NOT NULL THEN
            EXECUTE 'ALTER TABLE public.profiles RENAME TO id_members';
        ELSE
            EXECUTE 'CREATE TABLE public.id_members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz DEFAULT now())';
        END IF;
    END IF;
END $$;

-- 1. Backward-compatible view
DO $$
BEGIN
    IF to_regclass('public.crm_members') IS NULL THEN
        EXECUTE 'CREATE VIEW public.crm_members AS SELECT * FROM public.id_members';
    END IF;
END $$;

-- 2. Core columns
ALTER TABLE public.id_members
    ADD COLUMN IF NOT EXISTS display_id text,
    ADD COLUMN IF NOT EXISTS referral_code text,
    ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.id_tenants(id),
    ADD COLUMN IF NOT EXISTS primary_phone text,
    ADD COLUMN IF NOT EXISTS primary_email text,
    ADD COLUMN IF NOT EXISTS pan_number text,
    ADD COLUMN IF NOT EXISTS aadhaar_number text,
    ADD COLUMN IF NOT EXISTS member_status text DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS last_visit_at timestamptz,
    ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 3. Unique indexes for identifiers (nullable safe)
CREATE UNIQUE INDEX IF NOT EXISTS idx_id_members_display_id
    ON public.id_members(display_id)
    WHERE display_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_id_members_referral_code
    ON public.id_members(referral_code)
    WHERE referral_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_id_members_primary_phone
    ON public.id_members(primary_phone)
    WHERE primary_phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_id_members_pan_number
    ON public.id_members(pan_number)
    WHERE pan_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_id_members_aadhaar_number
    ON public.id_members(aadhaar_number)
    WHERE aadhaar_number IS NOT NULL;

-- 4. Helper generator (no confusing chars, uppercase)
CREATE OR REPLACE FUNCTION public.generate_short_code(p_length int)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result text := '';
    i int;
    idx int;
BEGIN
    FOR i IN 1..p_length LOOP
        idx := (get_byte(gen_random_bytes(1), 0) % length(alphabet)) + 1;
        result := result || substr(alphabet, idx, 1);
    END LOOP;
    RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.generate_unique_member_display_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    candidate text;
BEGIN
    LOOP
        candidate := public.generate_short_code(9);
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM public.id_members WHERE display_id = candidate
        );
    END LOOP;
    RETURN candidate;
END $$;

CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    candidate text;
BEGIN
    LOOP
        candidate := public.generate_short_code(9);
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM public.id_members WHERE referral_code = candidate
        );
    END LOOP;
    RETURN candidate;
END $$;

CREATE OR REPLACE FUNCTION public.set_member_codes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.display_id IS NULL OR NEW.display_id = '' THEN
        NEW.display_id := public.generate_unique_member_display_id();
    END IF;
    IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
        NEW.referral_code := public.generate_unique_referral_code();
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_set_member_codes ON public.id_members;
CREATE TRIGGER tr_set_member_codes
BEFORE INSERT ON public.id_members
FOR EACH ROW EXECUTE FUNCTION public.set_member_codes();

-- 5. Tenant links (multi-tenant sharing)
CREATE TABLE IF NOT EXISTS public.id_member_tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid REFERENCES public.id_members(id) ON DELETE CASCADE,
    tenant_id uuid REFERENCES public.id_tenants(id) ON DELETE CASCADE,
    status text DEFAULT 'ACTIVE',
    joined_at timestamptz DEFAULT now(),
    last_seen_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(member_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_member_tenants_member
    ON public.id_member_tenants(member_id);
CREATE INDEX IF NOT EXISTS idx_member_tenants_tenant
    ON public.id_member_tenants(tenant_id);

-- 6. Contacts
CREATE TABLE IF NOT EXISTS public.id_member_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid REFERENCES public.id_members(id) ON DELETE CASCADE,
    contact_type text NOT NULL, -- PHONE, WHATSAPP, EMAIL
    label text,
    value text NOT NULL,
    is_primary boolean DEFAULT false,
    verified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(member_id, contact_type, value)
);

CREATE INDEX IF NOT EXISTS idx_member_contacts_value
    ON public.id_member_contacts(value);
CREATE INDEX IF NOT EXISTS idx_member_contacts_member
    ON public.id_member_contacts(member_id);

-- 7. Addresses
CREATE TABLE IF NOT EXISTS public.id_member_addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid REFERENCES public.id_members(id) ON DELETE CASCADE,
    label text NOT NULL, -- Permanent, Current, Office, Other
    line1 text,
    line2 text,
    line3 text,
    city text,
    state text,
    country text DEFAULT 'India',
    pincode text,
    is_current boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_addresses_member
    ON public.id_member_addresses(member_id);

-- 8. Member events (timeline)
CREATE TABLE IF NOT EXISTS public.id_member_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid REFERENCES public.id_members(id) ON DELETE CASCADE,
    tenant_id uuid REFERENCES public.id_tenants(id) ON DELETE SET NULL,
    event_type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_events_member
    ON public.id_member_events(member_id);

-- 9. RLS (minimal for self profile)
ALTER TABLE public.id_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_member_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_member_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_member_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read own profile" ON public.id_members;
CREATE POLICY "Members read own profile" ON public.id_members
    FOR SELECT TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS "Members read own contacts" ON public.id_member_contacts;
CREATE POLICY "Members read own contacts" ON public.id_member_contacts
    FOR SELECT TO authenticated
    USING (member_id = auth.uid());

DROP POLICY IF EXISTS "Members read own addresses" ON public.id_member_addresses;
CREATE POLICY "Members read own addresses" ON public.id_member_addresses
    FOR SELECT TO authenticated
    USING (member_id = auth.uid());

DROP POLICY IF EXISTS "Members read own events" ON public.id_member_events;
CREATE POLICY "Members read own events" ON public.id_member_events
    FOR SELECT TO authenticated
    USING (member_id = auth.uid());
