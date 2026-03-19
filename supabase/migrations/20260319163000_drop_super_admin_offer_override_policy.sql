-- Drop the Super Admin offer override RLS policy from cat_price_dealer.
-- Safe: updateDealerOffer.ts used adminClient (bypasses RLS entirely).
-- No live non-override flow depends on this policy.
-- Companion to migration: 20260319090000_aums_super_admin_cat_price_dealer_policy.sql
DROP POLICY IF EXISTS "Super Admins can manage all pricing rules" ON public.cat_price_dealer;
