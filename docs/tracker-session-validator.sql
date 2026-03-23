-- =============================================================================
-- Member Session Quality Validator
-- bookmy.bike | id_member_events table
-- =============================================================================
-- Run in Supabase SQL Editor (or psql) to validate session tracking accuracy.
-- Requires: events with session_id in payload (tracker v2+, post 2026-03-24).
--
-- Interpretation:
--   delta = 0  → perfect, page_count matches PAGE_VIEW rows
--   delta > 0  → under-count (pre-fix sessions, or missed unmount flush)
--   delta < 0  → over-count (should not happen)
-- =============================================================================

-- ── 1. Per-session accuracy (session_id exact join) ──────────────────────────
-- Use this after deploying tracker v2. Exact, no multi-tab noise.

SELECT
    payload->>'session_id'                          AS session_id,
    member_id,
    MIN(created_at) FILTER (WHERE event_type = 'SESSION_START') AS started_at,
    MAX(created_at) FILTER (WHERE event_type = 'SESSION_END')   AS ended_at,
    MAX((payload->>'total_duration_ms')::bigint)
        FILTER (WHERE event_type = 'SESSION_END')               AS total_ms,
    MAX((payload->>'page_count')::int)
        FILTER (WHERE event_type = 'SESSION_END')               AS reported_page_count,
    COUNT(*) FILTER (WHERE event_type = 'PAGE_VIEW')            AS actual_page_views,
    MAX((payload->>'page_count')::int)
        FILTER (WHERE event_type = 'SESSION_END')
    - COUNT(*) FILTER (WHERE event_type = 'PAGE_VIEW')          AS delta
FROM id_member_events
WHERE payload->>'session_id' IS NOT NULL
GROUP BY payload->>'session_id', member_id
HAVING MAX((payload->>'page_count')::int) IS NOT NULL   -- skip open sessions
ORDER BY started_at DESC
LIMIT 100;


-- ── 2. Sessions with delta ≠ 0 (anomaly filter) ──────────────────────────────

SELECT
    payload->>'session_id'                                      AS session_id,
    member_id,
    MAX((payload->>'page_count')::int)
        FILTER (WHERE event_type = 'SESSION_END')               AS reported,
    COUNT(*) FILTER (WHERE event_type = 'PAGE_VIEW')            AS actual,
    MAX((payload->>'page_count')::int)
        FILTER (WHERE event_type = 'SESSION_END')
    - COUNT(*) FILTER (WHERE event_type = 'PAGE_VIEW')          AS delta,
    MIN(created_at)                                             AS started_at
FROM id_member_events
WHERE payload->>'session_id' IS NOT NULL
GROUP BY payload->>'session_id', member_id
HAVING
    MAX((payload->>'page_count')::int) IS NOT NULL
    AND (
        MAX((payload->>'page_count')::int)
        - COUNT(*) FILTER (WHERE event_type = 'PAGE_VIEW')
    ) <> 0
ORDER BY started_at DESC;


-- ── 3. Member-level summary (last 7 days) ────────────────────────────────────

SELECT
    member_id,
    COUNT(DISTINCT payload->>'session_id')
        FILTER (WHERE event_type = 'SESSION_START')             AS total_sessions,
    COUNT(*) FILTER (WHERE event_type = 'PAGE_VIEW')            AS total_page_views,
    ROUND(
        AVG((payload->>'duration_ms')::bigint)
            FILTER (WHERE event_type = 'PAGE_VIEW') / 1000.0, 1
    )                                                           AS avg_page_time_sec,
    ROUND(
        AVG((payload->>'total_duration_ms')::bigint)
            FILTER (WHERE event_type = 'SESSION_END') / 1000.0, 1
    )                                                           AS avg_session_time_sec
FROM id_member_events
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY member_id
ORDER BY total_sessions DESC
LIMIT 50;
