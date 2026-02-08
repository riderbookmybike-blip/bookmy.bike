-- Migration: 20260207_add_ingestion_ignore_rules.sql
-- Description: Persist ignore rules for ingestion discovery per brand.

CREATE TABLE IF NOT EXISTS public.cat_ingestion_ignore_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.cat_brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.id_tenants(id),
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('URL', 'NAME', 'TYPE')),
  pattern_value TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_cat_ingestion_ignore_rules_unique
  ON public.cat_ingestion_ignore_rules(brand_id, pattern_type, pattern_value)
  WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_cat_ingestion_ignore_rules_brand_id
  ON public.cat_ingestion_ignore_rules(brand_id);
