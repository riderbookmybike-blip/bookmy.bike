-- One-time cleanup: merge duplicate active leads
-- Strategy:
-- 1) Merge by customer_id within owner_tenant_id (oldest active lead wins)
-- 2) Merge by customer_phone only when customer_id IS NULL (oldest active lead wins)
-- Notes:
-- - Active lead = is_deleted = false AND status <> 'CLOSED'
-- - Duplicate leads are soft-deleted and marked CLOSED

-- Pass 1: merge by customer_id
WITH ranked AS (
    SELECT
        id,
        owner_tenant_id,
        customer_id,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY owner_tenant_id, customer_id
            ORDER BY created_at ASC
        ) AS rn
    FROM public.crm_leads
    WHERE is_deleted = false
      AND status <> 'CLOSED'
      AND customer_id IS NOT NULL
),
canonical AS (
    SELECT owner_tenant_id, customer_id, id AS canonical_id
    FROM ranked
    WHERE rn = 1
),
dupes AS (
    SELECT r.id AS dup_id, c.canonical_id
    FROM ranked r
    JOIN canonical c
      ON c.owner_tenant_id = r.owner_tenant_id
     AND c.customer_id = r.customer_id
    WHERE r.rn > 1
)
UPDATE public.crm_quotes q
SET lead_id = d.canonical_id
FROM dupes d
WHERE q.lead_id = d.dup_id;

WITH ranked AS (
    SELECT
        id,
        owner_tenant_id,
        customer_id,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY owner_tenant_id, customer_id
            ORDER BY created_at ASC
        ) AS rn
    FROM public.crm_leads
    WHERE is_deleted = false
      AND status <> 'CLOSED'
      AND customer_id IS NOT NULL
),
canonical AS (
    SELECT owner_tenant_id, customer_id, id AS canonical_id
    FROM ranked
    WHERE rn = 1
),
dupes AS (
    SELECT r.id AS dup_id, c.canonical_id
    FROM ranked r
    JOIN canonical c
      ON c.owner_tenant_id = r.owner_tenant_id
     AND c.customer_id = r.customer_id
    WHERE r.rn > 1
)
UPDATE public.crm_leads l
SET status = 'CLOSED',
    is_deleted = true,
    deleted_at = now(),
    deleted_by = NULL
FROM dupes d
WHERE l.id = d.dup_id;

-- Pass 2: merge by phone (only when customer_id IS NULL)
WITH ranked AS (
    SELECT
        id,
        owner_tenant_id,
        customer_phone,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY owner_tenant_id, customer_phone
            ORDER BY created_at ASC
        ) AS rn
    FROM public.crm_leads
    WHERE is_deleted = false
      AND status <> 'CLOSED'
      AND customer_id IS NULL
      AND customer_phone IS NOT NULL
),
canonical AS (
    SELECT owner_tenant_id, customer_phone, id AS canonical_id
    FROM ranked
    WHERE rn = 1
),
dupes AS (
    SELECT r.id AS dup_id, c.canonical_id
    FROM ranked r
    JOIN canonical c
      ON c.owner_tenant_id = r.owner_tenant_id
     AND c.customer_phone = r.customer_phone
    WHERE r.rn > 1
)
UPDATE public.crm_quotes q
SET lead_id = d.canonical_id
FROM dupes d
WHERE q.lead_id = d.dup_id;

WITH ranked AS (
    SELECT
        id,
        owner_tenant_id,
        customer_phone,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY owner_tenant_id, customer_phone
            ORDER BY created_at ASC
        ) AS rn
    FROM public.crm_leads
    WHERE is_deleted = false
      AND status <> 'CLOSED'
      AND customer_id IS NULL
      AND customer_phone IS NOT NULL
),
canonical AS (
    SELECT owner_tenant_id, customer_phone, id AS canonical_id
    FROM ranked
    WHERE rn = 1
),
dupes AS (
    SELECT r.id AS dup_id, c.canonical_id
    FROM ranked r
    JOIN canonical c
      ON c.owner_tenant_id = r.owner_tenant_id
     AND c.customer_phone = r.customer_phone
    WHERE r.rn > 1
)
UPDATE public.crm_leads l
SET status = 'CLOSED',
    is_deleted = true,
    deleted_at = now(),
    deleted_by = NULL
FROM dupes d
WHERE l.id = d.dup_id;

-- Enforce unique primary phone for members (global)
CREATE UNIQUE INDEX IF NOT EXISTS ux_id_members_primary_phone
ON public.id_members(primary_phone)
WHERE primary_phone IS NOT NULL;
