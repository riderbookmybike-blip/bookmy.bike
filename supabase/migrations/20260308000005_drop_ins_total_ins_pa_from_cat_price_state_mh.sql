BEGIN;

ALTER TABLE public.cat_price_state_mh
  DROP COLUMN IF EXISTS ins_total,
  DROP COLUMN IF EXISTS ins_pa;

COMMIT;
