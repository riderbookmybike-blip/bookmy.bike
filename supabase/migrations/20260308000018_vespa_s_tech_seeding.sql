BEGIN;

DO $$
BEGIN
  RAISE NOTICE 'Skipping Vespa S Tech seed in compatibility reset path';
END $$;

COMMIT;
