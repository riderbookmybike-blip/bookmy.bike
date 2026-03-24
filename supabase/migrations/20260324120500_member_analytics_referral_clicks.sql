-- Enrich AUMS member analytics with referral/share metrics.

DROP FUNCTION IF EXISTS public.get_member_analytics_batch(uuid[]);

CREATE OR REPLACE FUNCTION public.get_member_analytics_batch(p_member_ids uuid[])
RETURNS TABLE(
    member_id uuid,
    total_sessions bigint,
    total_time_ms bigint,
    last_active_at timestamptz,
    pdp_interests text[],
    share_earn_clicks bigint,
    referral_link_clicks bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
WITH input_members AS (
    SELECT DISTINCT UNNEST(p_member_ids)::uuid AS member_id
),
member_codes AS (
    SELECT
        im.member_id,
        regexp_replace(upper(coalesce(m.referral_code, '')), '[^A-Z0-9]', '', 'g') AS referral_code_norm
    FROM input_members im
    LEFT JOIN public.id_members m ON m.id = im.member_id
),
member_events AS (
    SELECT
        e.member_id,
        e.event_type,
        e.created_at,
        (e.payload->>'duration_ms')::bigint AS duration_ms,
        (e.payload->>'url') AS url
    FROM public.id_member_events e
    WHERE e.member_id = ANY(p_member_ids)
      AND e.event_type IN ('SESSION_START', 'PAGE_VIEW', 'REFERRAL_SHARED')
),
sessions AS (
    SELECT member_id, COUNT(*)::bigint AS total_sessions
    FROM member_events
    WHERE event_type = 'SESSION_START'
    GROUP BY member_id
),
time_spent AS (
    SELECT member_id, COALESCE(SUM(duration_ms), 0)::bigint AS total_time_ms
    FROM member_events
    WHERE event_type = 'PAGE_VIEW' AND duration_ms IS NOT NULL
    GROUP BY member_id
),
last_active AS (
    SELECT member_id, MAX(created_at) AS last_active_at
    FROM member_events
    GROUP BY member_id
),
pdp_pages AS (
    SELECT
        e.member_id,
        CONCAT_WS(
            ' · ',
            INITCAP(REPLACE(split_part(ltrim(e.url, '/store/'), '/', 1), '-', ' ')) || ' ' ||
            INITCAP(REPLACE(split_part(ltrim(e.url, '/store/'), '/', 2), '-', ' ')),
            NULLIF(INITCAP(REPLACE(split_part(ltrim(e.url, '/store/'), '/', 3), '-', ' ')), '')
        ) AS product_label
    FROM member_events e
    WHERE e.event_type = 'PAGE_VIEW'
      AND e.url ~ '^/store/[^/]+/[^/]+'
      AND split_part(ltrim(e.url, '/store/'), '/', 1) NOT IN (
          'catalog', 'compare', 'search', 'ocircle', 'login',
          'booking', 'cart', 'checkout', 'wishlist', 'payment'
      )
),
pdp_agg AS (
    SELECT member_id, ARRAY_AGG(DISTINCT product_label ORDER BY product_label) AS pdp_interests
    FROM pdp_pages
    GROUP BY member_id
),
share_clicks AS (
    SELECT member_id, COUNT(*)::bigint AS share_earn_clicks
    FROM member_events
    WHERE event_type = 'REFERRAL_SHARED'
    GROUP BY member_id
),
referral_clicks AS (
    SELECT
        mc.member_id,
        COUNT(*)::bigint AS referral_link_clicks
    FROM member_codes mc
    JOIN public.id_member_events e
      ON e.event_type = 'REFERRAL_CAPTURED'
     AND regexp_replace(upper(coalesce(e.payload->>'referral_code', '')), '[^A-Z0-9]', '', 'g') = mc.referral_code_norm
    WHERE mc.referral_code_norm <> ''
    GROUP BY mc.member_id
)
SELECT
    im.member_id,
    COALESCE(s.total_sessions, 0) AS total_sessions,
    COALESCE(t.total_time_ms, 0) AS total_time_ms,
    la.last_active_at,
    COALESCE(p.pdp_interests[1:5], ARRAY[]::text[]) AS pdp_interests,
    COALESCE(sc.share_earn_clicks, 0) AS share_earn_clicks,
    COALESCE(rc.referral_link_clicks, 0) AS referral_link_clicks
FROM input_members im
LEFT JOIN sessions s ON s.member_id = im.member_id
LEFT JOIN time_spent t ON t.member_id = im.member_id
LEFT JOIN last_active la ON la.member_id = im.member_id
LEFT JOIN pdp_agg p ON p.member_id = im.member_id
LEFT JOIN share_clicks sc ON sc.member_id = im.member_id
LEFT JOIN referral_clicks rc ON rc.member_id = im.member_id;
$function$;
