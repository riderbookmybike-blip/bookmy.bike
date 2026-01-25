-- Supabase Database Function: Generate Display ID
-- This function generates unique 9-character display IDs server-side

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
    -- Generate timestamp component (4 chars from last 20 bits of Unix timestamp)
    timestamp_component := encode_base33((EXTRACT(EPOCH FROM NOW())::INTEGER & 1048575), 4, alphabet, base);
    
    -- Generate random component (4 chars)
    random_component := encode_base33(FLOOR(RANDOM() * POWER(base, 4))::INTEGER, 4, alphabet, base);
    
    -- Combine to make 8-char base
    base_id := timestamp_component || random_component;
    
    -- Calculate checksum (Luhn-like)
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
    
    RETURN base_id || checksum_char;
END;
$$;

-- Helper function: Encode number to base-33
CREATE OR REPLACE FUNCTION encode_base33(num INTEGER, length INTEGER, alphabet TEXT, base INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result TEXT := '';
    temp_num INTEGER := num;
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := SUBSTRING(alphabet, (temp_num % base) + 1, 1) || result;
        temp_num := FLOOR(temp_num / base);
    END LOOP;
    
    RETURN result;
END;
$$;

-- Function to validate display ID checksum
CREATE OR REPLACE FUNCTION validate_display_id(input_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    alphabet TEXT := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    base INTEGER := 33;
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
    -- Check length
    IF LENGTH(input_id) != 9 THEN
        RETURN FALSE;
    END IF;
    
    -- Check characters
    IF input_id !~ '^[' || alphabet || ']+$' THEN
        RETURN FALSE;
    END IF;
    
    -- Extract components
    base_id := SUBSTRING(input_id, 1, 8);
    provided_checksum := SUBSTRING(input_id, 9, 1);
    
    -- Calculate checksum
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

-- Trigger function to auto-generate display_id on INSERT
CREATE OR REPLACE FUNCTION auto_generate_display_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_id TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
    id_exists BOOLEAN;
BEGIN
    -- Only generate if display_id is NULL
    IF NEW.display_id IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Try to generate unique ID with retries
    LOOP
        new_id := generate_display_id();
        
        -- Check if ID already exists in this table
        EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE display_id = $1)', TG_TABLE_NAME)
        INTO id_exists
        USING new_id;
        
        EXIT WHEN NOT id_exists;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique display_id after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    NEW.display_id := new_id;
    RETURN NEW;
END;
$$;

-- Apply triggers to all relevant tables
DROP TRIGGER IF EXISTS trigger_generate_display_id ON id_members;
CREATE TRIGGER trigger_generate_display_id
    BEFORE INSERT ON id_members
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_display_id();

DROP TRIGGER IF EXISTS trigger_generate_display_id ON id_team;
CREATE TRIGGER trigger_generate_display_id
    BEFORE INSERT ON id_team
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_display_id();

DROP TRIGGER IF EXISTS trigger_generate_display_id ON crm_leads;
CREATE TRIGGER trigger_generate_display_id
    BEFORE INSERT ON crm_leads
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_display_id();

DROP TRIGGER IF EXISTS trigger_generate_display_id ON crm_quotes;
CREATE TRIGGER trigger_generate_display_id
    BEFORE INSERT ON crm_quotes
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_display_id();

DROP TRIGGER IF EXISTS trigger_generate_display_id ON crm_bookings;
CREATE TRIGGER trigger_generate_display_id
    BEFORE INSERT ON crm_bookings
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_display_id();

DROP TRIGGER IF EXISTS trigger_generate_display_id ON crm_payments;
CREATE TRIGGER trigger_generate_display_id
    BEFORE INSERT ON crm_payments
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_display_id();

DROP TRIGGER IF EXISTS trigger_generate_display_id ON crm_finance;
CREATE TRIGGER trigger_generate_display_id
    BEFORE INSERT ON crm_finance
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_display_id();

DROP TRIGGER IF EXISTS trigger_generate_display_id ON inv_purchase_orders;
CREATE TRIGGER trigger_generate_display_id
    BEFORE INSERT ON inv_purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_display_id();

DROP TRIGGER IF EXISTS trigger_generate_display_id ON inv_requisitions;
CREATE TRIGGER trigger_generate_display_id
    BEFORE INSERT ON inv_requisitions
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_display_id();
