-- Align DB objects with catalog_normalization_plan v4.2
-- Forward-only, idempotent migration. Does not rewrite historical migrations.

BEGIN;

-- 1) Create cat_price_mh (state table with state_code retained for compatibility) if it does not exist yet.
DO $$
BEGIN
  IF to_regclass('public.cat_skus') IS NOT NULL
     AND to_regclass('public.cat_price_mh') IS NULL THEN
    EXECUTE $ddl$
      CREATE TABLE public.cat_price_mh (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sku_id UUID NOT NULL REFERENCES public.cat_skus(id) ON DELETE CASCADE,
        state_code TEXT NOT NULL DEFAULT 'MH',
        ex_showroom INTEGER NOT NULL CHECK (ex_showroom > 0),
        on_road_price INTEGER NOT NULL CHECK (on_road_price >= ex_showroom),
        gst_rate NUMERIC(4,2) DEFAULT 0.18,
        hsn_code TEXT,
        rto_total INTEGER,
        rto_default_type TEXT,
        rto_state_road_tax INTEGER,
        rto_state_cess INTEGER,
        rto_state_postal INTEGER,
        rto_state_smart_card INTEGER,
        rto_state_registration INTEGER,
        rto_state_total INTEGER,
        rto_bh_road_tax INTEGER,
        rto_bh_cess INTEGER,
        rto_bh_postal INTEGER,
        rto_bh_smart_card INTEGER,
        rto_bh_registration INTEGER,
        rto_bh_total INTEGER,
        rto_company_road_tax INTEGER,
        rto_company_cess INTEGER,
        rto_company_postal INTEGER,
        rto_company_smart_card INTEGER,
        rto_company_registration INTEGER,
        rto_company_total INTEGER,
        ins_od_base INTEGER,
        ins_od_gst INTEGER,
        ins_od_total INTEGER,
        ins_tp_base INTEGER,
        ins_tp_gst INTEGER,
        ins_tp_total INTEGER,
        ins_pa INTEGER,
        ins_gst_total INTEGER,
        ins_gst_rate INTEGER,
        ins_base_total INTEGER,
        ins_net_premium INTEGER,
        ins_total INTEGER NOT NULL,
        addon1_label TEXT,
        addon1_price INTEGER,
        addon1_gst INTEGER,
        addon1_total INTEGER,
        addon1_default BOOLEAN,
        addon2_label TEXT,
        addon2_price INTEGER,
        addon2_gst INTEGER,
        addon2_total INTEGER,
        addon2_default BOOLEAN,
        publish_stage TEXT,
        published_at TIMESTAMPTZ,
        published_by UUID,
        is_popular BOOLEAN,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    $ddl$;
  END IF;
END$$;

DO $$
BEGIN
  IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uq_cat_price_mh_sku_state ON public.cat_price_mh (sku_id, state_code)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS ix_cat_price_mh_publish_stage ON public.cat_price_mh (publish_stage)';
  END IF;
END$$;

-- 2) Create cat_suitable_for (cascading Brand->Model->Variant) if absent.
DO $$
BEGIN
  IF to_regclass('public.cat_skus') IS NOT NULL
     AND to_regclass('public.cat_suitable_for') IS NULL THEN
    EXECUTE $ddl$
      CREATE TABLE public.cat_suitable_for (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sku_id UUID NOT NULL REFERENCES public.cat_skus(id) ON DELETE CASCADE,
        target_brand_id UUID REFERENCES public.cat_brands(id) ON DELETE CASCADE,
        target_model_id UUID REFERENCES public.cat_models(id) ON DELETE CASCADE,
        target_variant_id UUID REFERENCES public.cat_skus(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    $ddl$;
  END IF;
END$$;

DO $$
BEGIN
  IF to_regclass('public.cat_suitable_for') IS NOT NULL THEN
    EXECUTE $ddl$
      CREATE UNIQUE INDEX IF NOT EXISTS uq_cat_suitable_for_scope
      ON public.cat_suitable_for (
        sku_id,
        COALESCE(target_brand_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(target_model_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(target_variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
      )
    $ddl$;
    EXECUTE 'CREATE INDEX IF NOT EXISTS ix_cat_suitable_for_sku_id ON public.cat_suitable_for (sku_id)';

    EXECUTE 'ALTER TABLE public.cat_suitable_for DROP CONSTRAINT IF EXISTS chk_cat_suitable_for_hierarchy';
    EXECUTE $ddl$
      ALTER TABLE public.cat_suitable_for
      ADD CONSTRAINT chk_cat_suitable_for_hierarchy CHECK (
        (target_variant_id IS NULL OR target_model_id IS NOT NULL) AND
        (target_model_id IS NULL OR target_brand_id IS NOT NULL)
      )
    $ddl$;

    EXECUTE 'ALTER TABLE public.cat_suitable_for ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "cat_suitable_for service role" ON public.cat_suitable_for';
    EXECUTE $ddl$
      CREATE POLICY "cat_suitable_for service role"
      ON public.cat_suitable_for
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true)
    $ddl$;
    EXECUTE 'DROP POLICY IF EXISTS "cat_suitable_for authenticated" ON public.cat_suitable_for';
    EXECUTE $ddl$
      CREATE POLICY "cat_suitable_for authenticated"
      ON public.cat_suitable_for
      FOR SELECT
      TO authenticated
      USING (true)
    $ddl$;
  END IF;
END$$;

-- 4) Backfill attempt from legacy cat_item_compatibility if both tables exist.
-- This inserts only rows where legacy sku_id already matches a row in cat_skus.id.
-- Legacy note: cat_item_compatibility.target_family_id maps to new target_model_id.
DO $$
BEGIN
  IF to_regclass('public.cat_item_compatibility') IS NOT NULL
     AND to_regclass('public.cat_suitable_for') IS NOT NULL
     AND to_regclass('public.cat_skus') IS NOT NULL THEN
    INSERT INTO public.cat_suitable_for (sku_id, target_brand_id, target_model_id, target_variant_id)
    SELECT
      c.sku_id,
      c.target_brand_id,
      c.target_family_id AS target_model_id,
      c.target_variant_id
    FROM public.cat_item_compatibility c
    JOIN public.cat_skus s ON s.id = c.sku_id
    ON CONFLICT DO NOTHING;
  END IF;
END$$;

COMMIT;
