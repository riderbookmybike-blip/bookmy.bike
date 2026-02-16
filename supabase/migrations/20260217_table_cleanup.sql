-- Table cleanup per implementation_plan_table_cleanup.md.resolved
-- Archives cat_item_hierarchy, then drops unused/duplicate tables.

BEGIN;

-- Archive cat_item_hierarchy before drop (if present)
DO $$
BEGIN
    IF to_regclass('public.cat_item_hierarchy') IS NOT NULL THEN
        -- Create archive table if not exists
        EXECUTE 'CREATE TABLE IF NOT EXISTS public.cat_item_hierarchy_archive AS TABLE public.cat_item_hierarchy WITH NO DATA';
        -- Append current data
        EXECUTE 'INSERT INTO public.cat_item_hierarchy_archive SELECT * FROM public.cat_item_hierarchy';
    END IF;
END$$;

-- Tier 1: Safe drops
DROP TABLE IF EXISTS public.registration_rules;
DROP TABLE IF EXISTS public.cat_tenure_config;
DROP TABLE IF EXISTS public.id_dealer_pricing_rules;
DROP TABLE IF EXISTS public.cat_price_state_trash;
DROP TABLE IF EXISTS public.cat_price_state_history CASCADE;
DROP TABLE IF EXISTS public.cat_item_suitability CASCADE;
DROP TABLE IF EXISTS public.sys_error_log;

-- Tier 2: Duplicate analytics (sys_*)
DROP TABLE IF EXISTS public.sys_analytics_events;
DROP TABLE IF EXISTS public.sys_analytics_sessions CASCADE;

-- Tier 3: Orphaned catalog (optional in plan) – dropping per plan after archiving
DROP TABLE IF EXISTS public.cat_item_hierarchy;
DROP TABLE IF EXISTS public.cat_ingestion_ignore_rules CASCADE;

COMMIT;
