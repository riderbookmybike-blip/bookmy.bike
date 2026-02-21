-- Backfill legacy CRM member documents into unified id_member_assets table.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'crm_member_documents'
    ) THEN
        INSERT INTO public.id_member_assets (
            entity_id,
            tenant_id,
            path,
            file_type,
            purpose,
            metadata,
            created_at,
            updated_at
        )
        SELECT
            d.member_id,
            m.tenant_id,
            d.file_path,
            d.file_type,
            COALESCE(NULLIF(d.category, ''), 'MEMBER_DOCUMENT'),
            jsonb_strip_nulls(
                jsonb_build_object(
                    'source', 'CRM_MEMBER_DOCUMENT_BACKFILL',
                    'name', d.name,
                    'originalName', d.name,
                    'category', d.category,
                    'label', d.label,
                    'file_size', d.file_size
                )
            ),
            COALESCE(d.created_at, now()),
            COALESCE(d.updated_at, d.created_at, now())
        FROM public.crm_member_documents d
        LEFT JOIN public.id_members m ON m.id = d.member_id
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.id_member_assets a
            WHERE a.entity_id = d.member_id
              AND a.path = d.file_path
        );
    END IF;
END $$;
