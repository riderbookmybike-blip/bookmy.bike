-- Migration: AUMS Exact Intent Counts RPC
-- Description: Provides a single, highly-optimized query to calculate exact platform-wide intent numbers 
-- without doing 4 separate table scans. Resolves the severe dashboard loading bottleneck.

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
    SELECT 
        COUNT(*) as total_all,
        COUNT(*) FILTER (WHERE current_temperature = 'HOT' OR coalesce(quotes_count, 0) > 0) as total_hot,
        COUNT(*) FILTER (WHERE current_temperature = 'WARM' AND coalesce(quotes_count, 0) = 0) as total_warm,
        COUNT(*) FILTER (WHERE current_temperature = 'COLD' AND coalesce(quotes_count, 0) = 0) as total_cold
    FROM id_members;
$$;

-- Grant execute to authenticated users (and service role)
GRANT EXECUTE ON FUNCTION get_aums_intent_counts() TO authenticated, service_role;
