-- Migration: cam_whatsapp_campaigns and cam_whatsapp_logs
-- Created: 2026-03-23
-- Prefix convention: cam_whatsapp_*

-- ─────────────────────────────────────────────────────────────────────────────
-- cam_whatsapp_campaigns
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cam_whatsapp_campaigns (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                text NOT NULL,
    template_name       text NOT NULL,
    template_status     text NOT NULL DEFAULT 'PENDING',
    -- Status lifecycle: DRAFT → TEST → ACTIVE ↔ PAUSED | RUNNING (transient) → DONE | STOPPED
    status              text NOT NULL DEFAULT 'DRAFT',
    offer_start         date,
    offer_end           date,
    batch_size          integer NOT NULL DEFAULT 50,
    batch_delay_min     integer NOT NULL DEFAULT 30,
    eligible_count      integer,
    sent_count          integer NOT NULL DEFAULT 0,
    failed_count        integer NOT NULL DEFAULT 0,
    test_batch_approved boolean NOT NULL DEFAULT false,
    created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION cam_whatsapp_campaigns_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cam_whatsapp_campaigns_updated_at ON cam_whatsapp_campaigns;
CREATE TRIGGER trg_cam_whatsapp_campaigns_updated_at
    BEFORE UPDATE ON cam_whatsapp_campaigns
    FOR EACH ROW EXECUTE FUNCTION cam_whatsapp_campaigns_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- cam_whatsapp_logs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cam_whatsapp_logs (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id      uuid NOT NULL REFERENCES cam_whatsapp_campaigns(id) ON DELETE CASCADE,
    batch_number     integer NOT NULL,
    is_test          boolean NOT NULL DEFAULT false,
    status           text NOT NULL DEFAULT 'QUEUED',
    recipient_count  integer NOT NULL DEFAULT 0,
    sent_count       integer NOT NULL DEFAULT 0,
    failed_count     integer NOT NULL DEFAULT 0,
    started_at       timestamptz,
    completed_at     timestamptz,
    error_summary    text,
    created_at       timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient polling
CREATE INDEX IF NOT EXISTS idx_cam_whatsapp_logs_campaign_id
    ON cam_whatsapp_logs(campaign_id);

CREATE INDEX IF NOT EXISTS idx_cam_whatsapp_logs_campaign_batch
    ON cam_whatsapp_logs(campaign_id, batch_number DESC);

-- No RLS: access controlled server-side via adminClient + auth guards
