-- Clarify legacy naming: vehicle_color_id points to SKU (cat_items.id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cat_price_state' AND column_name = 'vehicle_color_id'
  ) THEN
    COMMENT ON COLUMN public.cat_price_state.vehicle_color_id IS 'SKU id (cat_items.id). Legacy name from vehicle_color.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cat_price_state_history' AND column_name = 'vehicle_color_id'
  ) THEN
    COMMENT ON COLUMN public.cat_price_state_history.vehicle_color_id IS 'SKU id (cat_items.id). Legacy name from vehicle_color.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cat_price_state_trash' AND column_name = 'vehicle_color_id'
  ) THEN
    COMMENT ON COLUMN public.cat_price_state_trash.vehicle_color_id IS 'SKU id (cat_items.id). Legacy name from vehicle_color.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cat_price_dealer' AND column_name = 'vehicle_color_id'
  ) THEN
    COMMENT ON COLUMN public.cat_price_dealer.vehicle_color_id IS 'SKU id (cat_items.id). Legacy name from vehicle_color.';
  END IF;
END$$;
