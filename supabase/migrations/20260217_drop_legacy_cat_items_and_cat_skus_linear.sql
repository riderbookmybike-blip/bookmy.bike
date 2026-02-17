begin;

alter table if exists public.cat_assets
  drop constraint if exists cat_assets_item_id_fkey;

alter table if exists public.cat_item_compatibility
  drop constraint if exists cat_item_compatibility_item_id_fkey,
  drop constraint if exists cat_item_compatibility_target_family_id_fkey,
  drop constraint if exists cat_item_compatibility_target_variant_id_fkey;

alter table if exists public.cat_item_ingestion_sources
  drop constraint if exists cat_item_ingestion_sources_item_id_fkey;

alter table if exists public.cat_items
  drop constraint if exists catalog_items_parent_id_fkey;

alter table if exists public.cat_price_dealer
  drop constraint if exists id_dealer_pricing_rules_vehicle_model_id_fkey;

alter table if exists public.cat_recommendations
  drop constraint if exists cat_recommendations_recommended_variant_id_fkey,
  drop constraint if exists cat_recommendations_source_variant_id_fkey;

alter table if exists public.crm_bookings
  drop constraint if exists crm_bookings_color_id_fkey,
  drop constraint if exists crm_bookings_variant_id_fkey;

alter table if exists public.crm_quotes
  drop constraint if exists fk_quotes_color_protect,
  drop constraint if exists fk_quotes_variant_protect;

alter table if exists public.mat_market_summary
  drop constraint if exists mat_market_summary_family_id_fkey;

drop function if exists public.get_item_descendants_tree(uuid);

drop table if exists public.cat_skus_linear;
drop table if exists public.cat_items;

commit;
