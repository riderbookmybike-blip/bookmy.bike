BEGIN;

DO $$
DECLARE
    src_exists BOOLEAN := to_regclass('public.vehicle_prices') IS NOT NULL;
    col_list TEXT;
BEGIN
    IF src_exists THEN
        IF to_regclass('public.vehicle_prices_archive') IS NULL THEN
            EXECUTE 'CREATE TABLE public.vehicle_prices_archive (LIKE public.vehicle_prices INCLUDING ALL)';
        END IF;

        SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
        INTO col_list
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vehicle_prices';

        IF col_list IS NOT NULL THEN
            EXECUTE format(
                'INSERT INTO public.vehicle_prices_archive (%1$s) SELECT %1$s FROM public.vehicle_prices ON CONFLICT DO NOTHING',
                col_list
            );
        END IF;

        EXECUTE 'DROP TABLE public.vehicle_prices';
    END IF;

    EXECUTE 'DROP FUNCTION IF EXISTS public.upsert_vehicle_prices_bypass(jsonb)';
END
$$;

COMMIT;
