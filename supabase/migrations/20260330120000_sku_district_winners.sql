-- ============================================================
-- Migration: sku_district_winners + recompute queue + triggers
-- Applied via Supabase MCP: 2026-03-30
-- ============================================================

-- ── TABLE: sku_district_winners ──────────────────────────────
-- Pre-computed winner (dealer) per SKU per district.
-- Winner = dealer with lowest offer_amount (most negative discount)
-- from cat_price_dealer. Base price / RTO / insurance NOT used.

CREATE TABLE IF NOT EXISTS sku_district_winners (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id              uuid NOT NULL REFERENCES cat_skus(id) ON DELETE CASCADE,
    district            text NOT NULL,
    state_code          text NOT NULL DEFAULT 'MH',
    tenant_id           uuid NOT NULL REFERENCES id_tenants(id) ON DELETE CASCADE,
    winning_offer_amount numeric NOT NULL DEFAULT 0,
    tat_days            integer,
    tat_effective_hours integer,
    computed_at         timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- One winner per SKU per district per state
CREATE UNIQUE INDEX IF NOT EXISTS idx_sku_district_winners_unique
    ON sku_district_winners (sku_id, district, state_code);

CREATE INDEX IF NOT EXISTS idx_sku_district_winners_district
    ON sku_district_winners (district, state_code);

CREATE INDEX IF NOT EXISTS idx_sku_district_winners_sku
    ON sku_district_winners (sku_id);

-- ── TABLE: sku_winner_recompute_queue ────────────────────────
-- Async queue for winner recompute jobs.
-- Triggers enqueue here; GET /api/internal/winner-worker processes.

CREATE TABLE IF NOT EXISTS sku_winner_recompute_queue (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id      uuid NOT NULL REFERENCES cat_skus(id) ON DELETE CASCADE,
    state_code  text NOT NULL DEFAULT 'MH',
    reason      text NOT NULL DEFAULT 'MANUAL',
    status      text NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'PROCESSING', 'DONE', 'FAILED')),
    retries     integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_winner_queue_status
    ON sku_winner_recompute_queue (status, created_at);

CREATE INDEX IF NOT EXISTS idx_winner_queue_sku
    ON sku_winner_recompute_queue (sku_id, state_code);

-- ── FUNCTION: auto-set updated_at ────────────────────────────
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trgr_sku_district_winners_updated_at ON sku_district_winners;
CREATE TRIGGER trgr_sku_district_winners_updated_at
    BEFORE UPDATE ON sku_district_winners
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS trgr_winner_queue_updated_at ON sku_winner_recompute_queue;
CREATE TRIGGER trgr_winner_queue_updated_at
    BEFORE UPDATE ON sku_winner_recompute_queue
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ── FUNCTION: enqueue helper ──────────────────────────────────
CREATE OR REPLACE FUNCTION fn_enqueue_winner_recompute(
    p_sku_id    uuid,
    p_state_code text,
    p_reason    text
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM sku_winner_recompute_queue
        WHERE sku_id = p_sku_id
          AND state_code = p_state_code
          AND status IN ('PENDING', 'PROCESSING')
    ) THEN
        RETURN;
    END IF;
    INSERT INTO sku_winner_recompute_queue (sku_id, state_code, reason)
    VALUES (p_sku_id, p_state_code, p_reason);
END;
$$;

-- ── TRIGGER: cat_price_dealer → enqueue ──────────────────────
-- Fires on offer changes ONLY. Does NOT fire on cat_price_state_mh.
CREATE OR REPLACE FUNCTION trg_cat_price_dealer_enqueue_winner()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_sku_id    uuid;
    v_state     text;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_sku_id := OLD.vehicle_color_id;
        v_state  := COALESCE(OLD.state_code, 'MH');
    ELSE
        v_sku_id := NEW.vehicle_color_id;
        v_state  := COALESCE(NEW.state_code, 'MH');
    END IF;

    IF v_sku_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Enqueue for concrete state; normalize ALL → MH
    PERFORM fn_enqueue_winner_recompute(
        v_sku_id,
        CASE WHEN v_state = 'ALL' THEN 'MH' ELSE v_state END,
        'CAT_PRICE_DEALER_' || TG_OP
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trgr_cat_price_dealer_winner ON cat_price_dealer;
CREATE TRIGGER trgr_cat_price_dealer_winner
    AFTER INSERT OR UPDATE OR DELETE ON cat_price_dealer
    FOR EACH ROW EXECUTE FUNCTION trg_cat_price_dealer_enqueue_winner();

-- ── TRIGGER: id_primary_dealer_districts → enqueue ───────────
CREATE OR REPLACE FUNCTION trg_dealer_districts_enqueue_winner()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_tenant_id uuid;
    v_state     text;
    r           RECORD;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_tenant_id := OLD.tenant_id;
        v_state     := COALESCE(OLD.state_code, 'MH');
    ELSE
        v_tenant_id := NEW.tenant_id;
        v_state     := COALESCE(NEW.state_code, 'MH');
    END IF;

    FOR r IN
        SELECT DISTINCT vehicle_color_id AS sku_id
        FROM cat_price_dealer
        WHERE tenant_id = v_tenant_id
          AND vehicle_color_id IS NOT NULL
    LOOP
        PERFORM fn_enqueue_winner_recompute(
            r.sku_id,
            CASE WHEN v_state = 'ALL' THEN 'MH' ELSE v_state END,
            'DEALER_DISTRICT_' || TG_OP
        );
    END LOOP;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trgr_dealer_districts_winner ON id_primary_dealer_districts;
CREATE TRIGGER trgr_dealer_districts_winner
    AFTER INSERT OR UPDATE OR DELETE ON id_primary_dealer_districts
    FOR EACH ROW EXECUTE FUNCTION trg_dealer_districts_enqueue_winner();

-- ── VIEW: v_serviceable_districts ────────────────────────────
CREATE OR REPLACE VIEW v_serviceable_districts AS
SELECT DISTINCT
    district,
    state_code
FROM id_primary_dealer_districts
WHERE is_active = true
  AND district NOT IN ('ALL')
ORDER BY district;
