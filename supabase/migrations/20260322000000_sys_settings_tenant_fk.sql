-- Compatibility-safe: only add FK when table and column exist.
DO $$
BEGIN
  IF to_regclass('public.sys_settings') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema='public'
         AND table_name='sys_settings'
         AND column_name='default_owner_tenant_id'
     ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sys_settings_owner_tenant') THEN
      ALTER TABLE public.sys_settings
        ADD CONSTRAINT fk_sys_settings_owner_tenant
        FOREIGN KEY (default_owner_tenant_id)
        REFERENCES public.id_tenants(id)
        ON DELETE RESTRICT;
    END IF;
  ELSE
    RAISE NOTICE 'Skipping sys_settings owner tenant FK: table/column not found';
  END IF;
END $$;
