-- Security hardening for store SOT-related functions:
-- enforce fixed search_path to avoid function_search_path_mutable warnings.

DO $$
BEGIN
  IF to_regprocedure('public.get_dealer_offers(uuid, text)') IS NOT NULL THEN
    ALTER FUNCTION public.get_dealer_offers(uuid, text) SET search_path = public;
  END IF;

  IF to_regprocedure('public.get_nearest_pincode(double precision, double precision)') IS NOT NULL THEN
    ALTER FUNCTION public.get_nearest_pincode(double precision, double precision) SET search_path = public;
  END IF;

  IF to_regprocedure('public.sync_linear_ex_showroom_mh()') IS NOT NULL THEN
    ALTER FUNCTION public.sync_linear_ex_showroom_mh() SET search_path = public;
  END IF;

  IF to_regprocedure('public.fn_cat_price_state_mh_compute_pa_addon()') IS NOT NULL THEN
    ALTER FUNCTION public.fn_cat_price_state_mh_compute_pa_addon() SET search_path = public;
  END IF;

  IF to_regprocedure('public.upsert_dealer_offers(jsonb)') IS NOT NULL THEN
    ALTER FUNCTION public.upsert_dealer_offers(jsonb) SET search_path = public;
  END IF;
END $$;
