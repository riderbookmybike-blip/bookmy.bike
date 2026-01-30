-- Migration: 20260207_add_tenant_display_id.sql
-- Description: Add display_id column to id_tenants for alphanumeric identification

ALTER TABLE public.id_tenants 
    ADD COLUMN IF NOT EXISTS display_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_id_tenants_display_id ON public.id_tenants(display_id);
