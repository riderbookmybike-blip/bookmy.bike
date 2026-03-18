-- Ensure super admins can manage cross-dealership offer overrides on cat_price_dealer.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cat_price_dealer'
      AND policyname = 'Super Admins can manage all pricing rules'
  ) THEN
    CREATE POLICY "Super Admins can manage all pricing rules"
      ON public.cat_price_dealer
      FOR ALL
      TO authenticated
      USING (public.check_is_super_admin(auth.uid()))
      WITH CHECK (public.check_is_super_admin(auth.uid()));
  END IF;
END $$;
