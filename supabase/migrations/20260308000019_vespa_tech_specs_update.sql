BEGIN;

DO $$
BEGIN
  RAISE NOTICE 'Skipping Vespa tech specs seed in compatibility reset path';
END $$;

COMMIT;
