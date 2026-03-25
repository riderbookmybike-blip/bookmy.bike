-- Description: Refines get_aums_intent_counts to strictly enforce 'HOT' intent based on active presence matching the UI definition.

CREATE OR REPLACE FUNCTION get_aums_intent_counts()
RETURNS TABLE (
    total_all bigint,
    total_hot bigint,
    total_warm bigint,
    total_cold bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Compatibility path: if presence table is missing, treat everyone as offline.
    IF to_regclass('public.id_member_presence') IS NULL THEN
        RETURN QUERY
        SELECT
            COUNT(*) AS total_all,
            COUNT(*) FILTER (
                WHERE coalesce(quotes_count, 0) > 0
            ) AS total_hot,
            COUNT(*) FILTER (
                WHERE coalesce(quotes_count, 0) = 0
                  AND (current_temperature = 'HOT' OR current_temperature = 'WARM')
            ) AS total_warm,
            COUNT(*) FILTER (
                WHERE coalesce(quotes_count, 0) = 0
                  AND current_temperature = 'COLD'
            ) AS total_cold
        FROM public.id_members;
        RETURN;
    END IF;

    RETURN QUERY
    WITH live_members AS (
        SELECT member_id
        FROM public.id_member_presence
        WHERE updated_at >= NOW() - INTERVAL '10 minutes'
    )
    SELECT
        COUNT(*) AS total_all,
        COUNT(*) FILTER (
            WHERE coalesce(quotes_count, 0) > 0
               OR (current_temperature = 'HOT' AND id IN (SELECT member_id FROM live_members))
        ) AS total_hot,
        COUNT(*) FILTER (
            WHERE coalesce(quotes_count, 0) = 0
              AND (
                    (current_temperature = 'HOT' AND id NOT IN (SELECT member_id FROM live_members))
                    OR current_temperature = 'WARM'
              )
        ) AS total_warm,
        COUNT(*) FILTER (
            WHERE coalesce(quotes_count, 0) = 0
              AND current_temperature = 'COLD'
        ) AS total_cold
    FROM public.id_members;
END;
$$;

-- Grant execute to authenticated users (and service role)
GRANT EXECUTE ON FUNCTION get_aums_intent_counts() TO authenticated, service_role;
