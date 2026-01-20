-- Add Parent/Child Hierarchy support to accessories
ALTER TABLE public.accessories
ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES public.accessories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS hierarchy_type TEXT DEFAULT 'ITEM' CHECK (hierarchy_type IN ('FAMILY', 'VARIANT', 'ITEM'));

-- Index for growing families
CREATE INDEX IF NOT EXISTS accessories_parent_id_idx ON public.accessories (parent_id);
CREATE INDEX IF NOT EXISTS accessories_hierarchy_type_idx ON public.accessories (hierarchy_type);
