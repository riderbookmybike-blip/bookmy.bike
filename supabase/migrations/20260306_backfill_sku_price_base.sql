-- Backfill SKU price_base from cat_price_state or ancestor chain
WITH RECURSIVE ancestry AS (
    SELECT id, parent_id, price_base, type, 0 AS depth
    FROM public.cat_items
    WHERE type = 'SKU' AND (price_base IS NULL OR price_base = 0)
    UNION ALL
    SELECT a.id, ci.parent_id, ci.price_base, ci.type, a.depth + 1
    FROM ancestry a
    JOIN public.cat_items ci ON a.parent_id = ci.id
    WHERE a.depth < 4 AND (a.price_base IS NULL OR a.price_base = 0)
),
ancestor_price AS (
    SELECT DISTINCT ON (id)
        id,
        price_base AS ancestor_price
    FROM ancestry
    WHERE price_base IS NOT NULL AND price_base > 0
    ORDER BY id, depth ASC
),
state_price AS (
    SELECT vehicle_color_id AS id, MAX(ex_showroom_price) AS state_price
    FROM public.cat_price_state
    GROUP BY vehicle_color_id
)
UPDATE public.cat_items i
SET price_base = COALESCE(sp.state_price, ap.ancestor_price, i.price_base, 0)
FROM state_price sp
FULL OUTER JOIN ancestor_price ap ON ap.id = sp.id
WHERE i.id = COALESCE(sp.id, ap.id)
  AND i.type = 'SKU'
  AND (i.price_base IS NULL OR i.price_base = 0)
  AND COALESCE(sp.state_price, ap.ancestor_price, 0) > 0;
