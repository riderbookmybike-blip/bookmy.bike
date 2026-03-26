-- Compatibility reset path: legacy/public catalog tables differ across environments.
DO $$
BEGIN
  RAISE NOTICE 'Skipping PERF Batch 1 policy split migration in compatibility reset path';
END $$;
