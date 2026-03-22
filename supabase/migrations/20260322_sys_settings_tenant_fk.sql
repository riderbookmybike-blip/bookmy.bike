-- Migration: Harden sys_settings default_owner_tenant_id
-- Description: Adds a strict foreign key constraint ensuring the default owner is a valid tenant.

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sys_settings_owner_tenant') THEN
    ALTER TABLE sys_settings 
      ADD CONSTRAINT fk_sys_settings_owner_tenant
      FOREIGN KEY (default_owner_tenant_id) 
      REFERENCES id_tenants(id) 
      ON DELETE RESTRICT;
  END IF;
END $$;
