-- Description: Refines get_aums_intent_counts to strictly enforce 'HOT' intent based on active presence matching the UI definition.

CREATE OR REPLACE FUNCTION get_aums_intent_counts()
RETURNS TABLE (
    total_all bigint,
    total_hot bigint,
    total_warm bigint,
    total_cold bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH live_members AS (
        SELECT member_id FROM id_member_presence WHERE updated_at >= NOW() - INTERVAL '10 minutes'
    )
    SELECT 
        COUNT(*) as total_all,
        -- HOT: Has a quote OR (is live AND currentTemp is HOT)
        COUNT(*) FILTER (WHERE coalesce(quotes_count, 0) > 0 OR (current_temperature = 'HOT' AND id IN (SELECT member_id FROM live_members))) as total_hot,
        -- WARM: No quotes AND ((was HOT but now offline) OR is WARM)
        COUNT(*) FILTER (WHERE coalesce(quotes_count, 0) = 0 AND ((current_temperature = 'HOT' AND id NOT IN (SELECT member_id FROM live_members)) OR current_temperature = 'WARM')) as total_warm,
        -- COLD: current_temperature = COLD and no quotes
        COUNT(*) FILTER (WHERE coalesce(quotes_count, 0) = 0 AND current_temperature = 'COLD') as total_cold
    FROM id_members;
$$;

-- Grant execute to authenticated users (and service role)
GRANT EXECUTE ON FUNCTION get_aums_intent_counts() TO authenticated, service_role;
