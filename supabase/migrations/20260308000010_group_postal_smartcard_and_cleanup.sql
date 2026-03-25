BEGIN;
DO $$
BEGIN
  RAISE NOTICE 'Skipping grouped postal/smartcard cleanup in compatibility reset path';
END $$;
COMMIT;
