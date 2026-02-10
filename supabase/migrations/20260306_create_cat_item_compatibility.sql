-- Create compatibility mapping for SKUs (Suitable For)
CREATE TABLE IF NOT EXISTS public.cat_item_compatibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id UUID NOT NULL REFERENCES public.cat_items(id) ON DELETE CASCADE,
    target_brand_id UUID REFERENCES public.cat_brands(id),
    target_family_id UUID REFERENCES public.cat_items(id),
    target_variant_id UUID REFERENCES public.cat_items(id),
    is_universal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure universal rows do not specify targets
ALTER TABLE public.cat_item_compatibility
    ADD CONSTRAINT IF NOT EXISTS cat_item_compatibility_universal_chk
    CHECK (
        (is_universal = true AND target_brand_id IS NULL AND target_family_id IS NULL AND target_variant_id IS NULL)
        OR (is_universal = false)
    );

-- Prevent duplicate entries for same compatibility mapping
CREATE UNIQUE INDEX IF NOT EXISTS idx_cat_item_compatibility_unique
    ON public.cat_item_compatibility (
        sku_id,
        COALESCE(target_brand_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(target_family_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(target_variant_id, '00000000-0000-0000-0000-000000000000'::uuid),
        is_universal
    );

CREATE INDEX IF NOT EXISTS idx_cat_item_compatibility_sku
    ON public.cat_item_compatibility (sku_id);

CREATE INDEX IF NOT EXISTS idx_cat_item_compatibility_family
    ON public.cat_item_compatibility (target_family_id);

CREATE INDEX IF NOT EXISTS idx_cat_item_compatibility_variant
    ON public.cat_item_compatibility (target_variant_id);

-- RLS
ALTER TABLE public.cat_item_compatibility ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "cat_item_compatibility service role" ON public.cat_item_compatibility;
CREATE POLICY "cat_item_compatibility service role"
    ON public.cat_item_compatibility
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users: allow access (catalog is shared). Tighten later if tenant scoping is added to cat_items.
DROP POLICY IF EXISTS "cat_item_compatibility authenticated" ON public.cat_item_compatibility;
CREATE POLICY "cat_item_compatibility authenticated"
    ON public.cat_item_compatibility
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
