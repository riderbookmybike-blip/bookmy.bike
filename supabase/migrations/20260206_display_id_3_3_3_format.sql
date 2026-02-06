-- Migration: 20260206_display_id_3_3_3_format
-- Description: Store display_id in 3-3-3 format and backfill existing values safely.

-- 1) Helper: format display id to AAA-BBB-CCC (upper, alnum only)
CREATE OR REPLACE FUNCTION format_display_id(input_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    clean TEXT;
BEGIN
    IF input_id IS NULL OR input_id = '' THEN
        RETURN NULL;
    END IF;
    clean := regexp_replace(upper(input_id), '[^A-Z0-9]', '', 'g');
    IF length(clean) < 9 THEN
        RETURN NULL;
    END IF;
    clean := substr(clean, 1, 9);
    RETURN substr(clean, 1, 3) || '-' || substr(clean, 4, 3) || '-' || substr(clean, 7, 3);
END;
$$;

-- 2) Update generator to return formatted value
CREATE OR REPLACE FUNCTION generate_display_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    alphabet TEXT := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    base INTEGER := 33;
    timestamp_component TEXT;
    random_component TEXT;
    base_id TEXT;
    checksum_char TEXT;
    checksum_value INTEGER;
    sum_val INTEGER := 0;
    i INTEGER;
    char_val INTEGER;
    multiplier INTEGER;
    product INTEGER;
BEGIN
    timestamp_component := encode_base33((EXTRACT(EPOCH FROM NOW())::INTEGER & 1048575), 4, alphabet, base);
    random_component := encode_base33(FLOOR(RANDOM() * POWER(base, 4))::INTEGER, 4, alphabet, base);
    base_id := timestamp_component || random_component;

    FOR i IN 1..LENGTH(base_id) LOOP
        char_val := POSITION(SUBSTRING(base_id, i, 1) IN alphabet) - 1;
        multiplier := CASE WHEN (i - 1) % 2 = 0 THEN 2 ELSE 1 END;
        product := char_val * multiplier;
        IF product >= base THEN
            product := FLOOR(product / base) + (product % base);
        END IF;
        sum_val := sum_val + product;
    END LOOP;

    checksum_value := (base - (sum_val % base)) % base;
    checksum_char := SUBSTRING(alphabet, checksum_value + 1, 1);

    RETURN format_display_id(base_id || checksum_char);
END;
$$;

-- 3) Update validator to accept formatted IDs
CREATE OR REPLACE FUNCTION validate_display_id(input_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    alphabet TEXT := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    base INTEGER := 33;
    clean TEXT;
    base_id TEXT;
    provided_checksum TEXT;
    calculated_checksum TEXT;
    sum_val INTEGER := 0;
    i INTEGER;
    char_val INTEGER;
    multiplier INTEGER;
    product INTEGER;
    checksum_value INTEGER;
BEGIN
    IF input_id IS NULL THEN
        RETURN FALSE;
    END IF;
    clean := regexp_replace(upper(input_id), '[^A-Z0-9]', '', 'g');
    IF length(clean) <> 9 THEN
        RETURN FALSE;
    END IF;

    base_id := substr(clean, 1, 8);
    provided_checksum := substr(clean, 9, 1);

    FOR i IN 1..LENGTH(base_id) LOOP
        char_val := POSITION(SUBSTRING(base_id, i, 1) IN alphabet) - 1;
        multiplier := CASE WHEN (i - 1) % 2 = 0 THEN 2 ELSE 1 END;
        product := char_val * multiplier;
        IF product >= base THEN
            product := FLOOR(product / base) + (product % base);
        END IF;
        sum_val := sum_val + product;
    END LOOP;

    checksum_value := (base - (sum_val % base)) % base;
    calculated_checksum := SUBSTRING(alphabet, checksum_value + 1, 1);

    RETURN provided_checksum = calculated_checksum;
END;
$$;

-- 4) Member display_id generator updated to 3-3-3 format
CREATE OR REPLACE FUNCTION public.generate_unique_member_display_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    candidate text;
BEGIN
    LOOP
        candidate := format_display_id(public.generate_short_code(9));
        EXIT WHEN candidate IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.id_members WHERE display_id = candidate
        );
    END LOOP;
    RETURN candidate;
END $$;

-- 5) Backfill existing display_id values to formatted 3-3-3.
--    If collision happens, regenerate.
DO $$
DECLARE
    tbl TEXT;
    rec RECORD;
    new_id TEXT;
    id_exists BOOLEAN;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'id_members',
        'id_team',
        'crm_leads',
        'crm_quotes',
        'crm_bookings',
        'crm_payments',
        'crm_finance',
        'inv_purchase_orders',
        'inv_requisitions'
    ]
    LOOP
        FOR rec IN EXECUTE format('SELECT id, display_id FROM public.%I WHERE display_id IS NOT NULL', tbl)
        LOOP
            new_id := format_display_id(rec.display_id);
            IF new_id IS NULL THEN
                new_id := generate_display_id();
            END IF;
            -- ensure uniqueness in table
            EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE display_id = $1 AND id <> $2)', tbl)
            INTO id_exists
            USING new_id, rec.id;
            IF id_exists THEN
                new_id := generate_display_id();
            END IF;
            EXECUTE format('UPDATE public.%I SET display_id = $1 WHERE id = $2', tbl)
            USING new_id, rec.id;
        END LOOP;
    END LOOP;
END $$;
