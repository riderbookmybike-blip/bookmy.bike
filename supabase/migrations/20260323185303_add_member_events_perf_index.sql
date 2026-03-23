-- Member events performance index
-- Accelerates per-member timeline queries ordered by recency.
CREATE INDEX IF NOT EXISTS idx_member_events_member_created
    ON id_member_events (member_id, created_at DESC);
