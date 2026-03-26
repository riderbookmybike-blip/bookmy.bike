-- Rename table cat_prices to cat_price_state
DO $$
BEGIN
  IF to_regclass('public.cat_prices') IS NOT NULL
     AND to_regclass('public.cat_price_state') IS NULL THEN
    ALTER TABLE public.cat_prices RENAME TO cat_price_state;
  END IF;
END $$;

-- Rename table id_dealer_pricing_rules to cat_price_dealer
DO $$
BEGIN
  IF to_regclass('public.id_dealer_pricing_rules') IS NOT NULL
     AND to_regclass('public.cat_price_dealer') IS NULL THEN
    ALTER TABLE public.id_dealer_pricing_rules RENAME TO cat_price_dealer;
  END IF;
END $$;

-- Rename table cat_price_history to cat_price_state_history
DO $$
BEGIN
  IF to_regclass('public.cat_price_history') IS NOT NULL
     AND to_regclass('public.cat_price_state_history') IS NULL THEN
    ALTER TABLE public.cat_price_history RENAME TO cat_price_state_history;
  END IF;
END $$;

-- Update RLS policies (optional, but good for clarity if policy names include table name)
-- Note: Policies themselves are attached to the table OID so they persist, but their names might be confusing.
-- We will leave policy names as is for now to minimize risk, as Postgres handles internal references.

-- Re-create or update views/functions if necessary
-- Dynamic SQL functions (using text string 'cat_prices') need manual update.
-- Codebase search found usage in RPCs. We must update the RPCs in subsequent steps or via a separate migration.
-- This migration focuses strictly on the DDL RENAME to be atomic.
