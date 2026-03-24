-- AUMS presence helpers for platform-wide member monitoring.

CREATE INDEX IF NOT EXISTS idx_member_events_presence
    ON public.id_member_events (event_type, created_at DESC);

CREATE OR REPLACE FUNCTION public.aums_presence_summary()
RETURNS TABLE (
    live_now_count BIGINT,
    active_1h_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH latest AS (
        SELECT DISTINCT ON (member_id)
            member_id,
            event_type
        FROM public.id_member_events
        WHERE created_at > NOW() - INTERVAL '15 minutes'
          AND event_type IN ('SESSION_START', 'SESSION_END')
        ORDER BY member_id, created_at DESC
    )
    SELECT
        COUNT(*) FILTER (WHERE event_type = 'SESSION_START') AS live_now_count,
        (
            SELECT COUNT(DISTINCT member_id)
            FROM public.id_member_events
            WHERE created_at > NOW() - INTERVAL '60 minutes'
        ) AS active_1h_count
    FROM latest;
$$;

CREATE OR REPLACE FUNCTION public.aums_presence_for_members(member_ids UUID[])
RETURNS TABLE (
    member_id UUID,
    is_live BOOLEAN,
    is_recent BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH input_ids AS (
        SELECT DISTINCT UNNEST(member_ids) AS member_id
    ),
    latest AS (
        SELECT DISTINCT ON (e.member_id)
            e.member_id,
            e.event_type
        FROM public.id_member_events e
        WHERE e.member_id = ANY(member_ids)
          AND e.created_at > NOW() - INTERVAL '15 minutes'
          AND e.event_type IN ('SESSION_START', 'SESSION_END')
        ORDER BY e.member_id, e.created_at DESC
    ),
    recent AS (
        SELECT DISTINCT e.member_id
        FROM public.id_member_events e
        WHERE e.member_id = ANY(member_ids)
          AND e.created_at > NOW() - INTERVAL '60 minutes'
    )
    SELECT
        i.member_id,
        COALESCE(l.event_type = 'SESSION_START', FALSE) AS is_live,
        (r.member_id IS NOT NULL) AS is_recent
    FROM input_ids i
    LEFT JOIN latest l ON l.member_id = i.member_id
    LEFT JOIN recent r ON r.member_id = i.member_id;
$$;

REVOKE ALL ON FUNCTION public.aums_presence_summary() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aums_presence_for_members(UUID[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.aums_presence_summary() TO service_role;
GRANT EXECUTE ON FUNCTION public.aums_presence_for_members(UUID[]) TO service_role;
