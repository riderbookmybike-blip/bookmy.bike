# Supabase DB Health Review

Date: 2026-02-05 23:35 UTC

## Summary
- Public tables: 74
- Public views: 2
- Tables without PK: 1
- Tables with RLS disabled: 12
- FK constraints missing indexes: 36 across 20 tables
- Code references to missing tables: 27

## Public Table Inventory (Summary)
Columns: `table | cols | live_rows | dead_rows | rls | pk`

- analytics_events | 7 | 4010 | 0 | True | yes
- analytics_sessions | 13 | 160 | 49 | True | yes
- cat_assets | 13 | 225 | 59 | True | yes
- cat_brands | 12 | 15 | 8 | True | yes
- cat_hsn_codes | 11 | 32 | 36 | True | yes
- cat_ins_rules | 17 | 1 | 3 | True | yes
- cat_item_suitability | 5 | 0 | 0 | True | yes
- cat_items | 29 | 118 | 12 | True | yes
- cat_price_dealer | 17 | 118 | 20 | True | yes
- cat_price_state | 23 | 59 | 32 | True | yes
- cat_price_state_history | 9 | 0 | 0 | True | yes
- cat_price_state_trash | 23 | 98 | 0 | False | no
- cat_raw_items | 17 | 0 | 5 | True | yes
- cat_reg_rules | 14 | 1 | 3 | True | yes
- cat_regional_configs | 8 | 36 | 36 | True | yes
- cat_services | 11 | 7 | 0 | True | yes
- cat_templates | 9 | 6 | 26 | True | yes
- cat_tenure_config | 9 | 3 | 0 | True | yes
- crm_allotments | 10 | 0 | 0 | True | yes
- crm_assets | 11 | 0 | 0 | False | yes
- crm_bank_apps | 9 | 0 | 0 | True | yes
- crm_booking_assets | 10 | 0 | 0 | True | yes
- crm_bookings | 34 | 0 | 0 | True | yes
- crm_dealer_shares | 6 | 0 | 0 | True | yes
- crm_finance | 14 | 0 | 0 | False | yes
- crm_insurance | 11 | 0 | 0 | True | yes
- crm_lead_assets | 10 | 0 | 0 | True | yes
- crm_lead_events | 7 | 0 | 0 | True | yes
- crm_leads | 32 | 9 | 17 | True | yes
- crm_payments | 14 | 0 | 0 | False | yes
- crm_pdi | 11 | 0 | 0 | True | yes
- crm_quotes | 23 | 3 | 1 | True | yes
- crm_registration | 10 | 0 | 0 | True | yes
- debug_logs | 9 | 12 | 0 | True | yes
- i18n_languages | 8 | 4 | 32 | True | yes
- i18n_source_strings | 5 | 691 | 0 | True | yes
- i18n_sync_runs | 11 | 8 | 8 | True | yes
- i18n_translations | 8 | 691 | 0 | True | yes
- id_bank_accounts | 13 | 0 | 0 | True | yes
- id_dealer_pricing_rules | 20 | 0 | 0 | True | yes
- id_dealer_service_areas | 7 | 14 | 20 | True | yes
- id_documents | 13 | 0 | 0 | True | yes
- id_locations | 18 | 2 | 2 | True | yes
- id_member_addresses | 12 | 0 | 0 | False | yes
- id_member_assets | 10 | 3 | 16 | True | yes
- id_member_contacts | 8 | 0 | 0 | False | yes
- id_member_events | 7 | 0 | 0 | False | yes
- id_member_spins | 15 | 1 | 0 | True | yes
- id_member_tenants | 7 | 22281 | 3779 | False | yes
- id_members | 50 | 22284 | 16 | True | yes
- id_operating_hours | 8 | 0 | 0 | True | yes
- id_primary_dealer_districts | 7 | 11 | 4 | True | yes
- id_team | 8 | 6 | 4 | True | yes
- id_tenants | 14 | 7 | 29 | True | yes
- inv_ledger | 7 | 0 | 0 | False | yes
- inv_marketplace | 6 | 0 | 0 | True | yes
- inv_po_items | 6 | 0 | 0 | True | yes
- inv_purchase_orders | 14 | 0 | 0 | True | yes
- inv_req_items | 5 | 0 | 0 | True | yes
- inv_requisitions | 7 | 0 | 0 | True | yes
- inv_stock | 11 | 0 | 0 | True | yes
- loc_pincodes | 13 | 1604 | 1 | True | yes
- mat_market_summary | 10 | 5 | 0 | False | yes
- notifications | 8 | 0 | 0 | True | yes
- registration_rules | 13 | 1 | 0 | True | yes
- sys_analytics_events | 7 | 4721 | 0 | True | yes
- sys_analytics_sessions | 15 | 389 | 94 | True | yes
- sys_archived | 7 | 0 | 0 | True | yes
- sys_dashboard_templates | 9 | 15 | 3 | True | yes
- sys_error_log | 12 | 0 | 0 | False | yes
- sys_page_registry | 11 | 11 | 6 | True | yes
- sys_role_templates | 6 | 15 | 3 | True | yes
- sys_schema_registry | 10 | 20 | 0 | True | yes
- sys_settings | 3 | 1 | 1 | False | yes

## Missing Tables Referenced In Code
- app_settings | refs: crm.ts, lead.ts, route.ts, route.ts, page.tsx
- audit_logs | refs: page.tsx, audit.ts
- blog_posts | refs: page.tsx, BlogEditor.tsx
- cat_prices | refs: audit_dealers.js, audit_user_location.js, fix_palghar_data.js
- catalog_items | refs: fix-catalog-casing.ts
- catalog_services | refs: page.tsx
- documents | refs: crm.ts, ComplianceSettings.tsx, DocumentManager.tsx
- fin_schemes | refs: fix_palghar_data.js
- hsn_codes | refs: page.tsx
- id_tenant_reward_wheel_configs | refs: route.ts, page.tsx
- inventory_ledger | refs: InwardStockModal.tsx
- invitations | refs: invitations.ts
- items | refs: route.ts
- lead_dealer_shares | refs: lead.ts
- leads | refs: lead.ts, page.tsx
- memberships | refs: invitations.ts, ownership.ts, route.ts, route.ts, page.tsx …
- pincodes | refs: debug-missing.ts, enrich-districts.ts, enrich-pincodes-google.ts, migrate-pincodes-firebase.ts, route.ts
- profiles | refs: user.ts, route.ts, route.ts, route.ts, route.ts …
- purchase_order_items | refs: CreatePOModal.tsx, InwardStockModal.tsx
- purchase_orders | refs: CreatePOModal.tsx, page.tsx, InwardStockModal.tsx
- purchase_requisition_items | refs: CreatePOModal.tsx
- purchase_requisitions | refs: CreatePOModal.tsx, page.tsx, InwardStockModal.tsx
- tenants | refs: route.ts, route.ts, OverviewTab.tsx, page.tsx, page.tsx …
- users | refs: ProfileDropdown.tsx
- vehicle_inventory | refs: InwardStockModal.tsx, page.tsx
- vehicle_variants | refs: route.ts
- vehicles | refs: storage.ts, MediaUploadModal.tsx, SKUMediaManager.tsx

## Tables Not Referenced In Code (Potentially Unused)
- cat_item_suitability | live_rows=0
- cat_price_state_history | live_rows=0
- cat_price_state_trash | live_rows=98
- cat_raw_items | live_rows=0
- cat_tenure_config | live_rows=3
- crm_assets | live_rows=0
- crm_bank_apps | live_rows=0
- crm_booking_assets | live_rows=0
- crm_dealer_shares | live_rows=0
- crm_lead_assets | live_rows=0
- crm_lead_events | live_rows=0
- id_dealer_pricing_rules | live_rows=0
- id_operating_hours | live_rows=0
- inv_ledger | live_rows=0
- inv_marketplace | live_rows=0
- inv_po_items | live_rows=0
- inv_purchase_orders | live_rows=0
- inv_stock | live_rows=0
- registration_rules | live_rows=1
- sys_analytics_events | live_rows=4721
- sys_analytics_sessions | live_rows=389
- sys_error_log | live_rows=0
- sys_schema_registry | live_rows=20
- sys_settings | live_rows=1

## Tables Without Primary Key
- cat_price_state_trash

## FK Constraints Missing Indexes
- cat_price_dealer | FOREIGN KEY (brand_id) REFERENCES cat_brands(id) ON DELETE CASCADE
- cat_price_dealer | FOREIGN KEY (vehicle_model_id) REFERENCES cat_items(id) ON DELETE CASCADE
- crm_booking_assets | FOREIGN KEY (uploaded_by) REFERENCES auth.users(id)
- crm_booking_assets | FOREIGN KEY (tenant_id) REFERENCES id_tenants(id)
- crm_bookings | FOREIGN KEY (user_id) REFERENCES auth.users(id)
- crm_bookings | FOREIGN KEY (color_id) REFERENCES cat_items(id)
- crm_bookings | FOREIGN KEY (variant_id) REFERENCES cat_items(id)
- crm_insurance | FOREIGN KEY (tenant_id) REFERENCES id_tenants(id)
- crm_lead_assets | FOREIGN KEY (tenant_id) REFERENCES id_tenants(id)
- crm_lead_assets | FOREIGN KEY (uploaded_by) REFERENCES auth.users(id)
- crm_lead_assets | FOREIGN KEY (entity_id) REFERENCES crm_leads(id)
- crm_lead_events | FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE
- crm_leads | FOREIGN KEY (referred_by_id) REFERENCES id_members(id)
- crm_payments | FOREIGN KEY (booking_id) REFERENCES crm_bookings(id)
- crm_payments | FOREIGN KEY (lead_id) REFERENCES crm_leads(id)
- crm_payments | FOREIGN KEY (member_id) REFERENCES id_members(id)
- crm_payments | FOREIGN KEY (tenant_id) REFERENCES id_tenants(id)
- crm_pdi | FOREIGN KEY (tenant_id) REFERENCES id_tenants(id)
- crm_quotes | FOREIGN KEY (created_by) REFERENCES auth.users(id)
- crm_quotes | FOREIGN KEY (lead_id) REFERENCES crm_leads(id)
- crm_quotes | FOREIGN KEY (parent_quote_id) REFERENCES crm_quotes(id)
- crm_registration | FOREIGN KEY (tenant_id) REFERENCES id_tenants(id)
- id_documents | FOREIGN KEY (tenant_id) REFERENCES id_tenants(id) ON DELETE CASCADE
- id_member_addresses | FOREIGN KEY (member_id) REFERENCES id_members(id) ON DELETE CASCADE
- id_member_assets | FOREIGN KEY (uploaded_by) REFERENCES auth.users(id)
- id_member_assets | FOREIGN KEY (tenant_id) REFERENCES id_tenants(id)
- id_member_assets | FOREIGN KEY (entity_id) REFERENCES id_members(id)
- id_member_events | FOREIGN KEY (tenant_id) REFERENCES id_tenants(id) ON DELETE SET NULL
- id_member_events | FOREIGN KEY (member_id) REFERENCES id_members(id) ON DELETE CASCADE
- id_primary_dealer_districts | FOREIGN KEY (tenant_id) REFERENCES id_tenants(id) ON DELETE CASCADE
- id_team | FOREIGN KEY (tenant_id) REFERENCES id_tenants(id)
- id_team | FOREIGN KEY (reports_to) REFERENCES id_team(id)
- id_team | FOREIGN KEY (user_id) REFERENCES auth.users(id)
- inv_purchase_orders | FOREIGN KEY (requisition_id) REFERENCES inv_requisitions(id)
- sys_archived | FOREIGN KEY (archived_by) REFERENCES auth.users(id)
- sys_role_templates | FOREIGN KEY (template_id) REFERENCES sys_dashboard_templates(id) ON DELETE SET NULL

## RLS Disabled (Public Tables)
- cat_price_state_trash
- crm_assets
- crm_finance
- crm_payments
- id_member_addresses
- id_member_contacts
- id_member_events
- id_member_tenants
- inv_ledger
- mat_market_summary
- sys_error_log
- sys_settings

## Public Views
- view_risk_page_dependencies
- view_risk_schema_impact

## Supabase Advisor Findings

Security lints: 64
Performance lints: 314

Security highlights:
- rls_disabled_in_public: 12 | sample: cat_price_state_trash, crm_assets, crm_finance, crm_payments, id_member_addresses, id_member_contacts, id_member_events, id_member_tenants, inv_ledger, mat_market_summary
- rls_enabled_no_policy: 4 | sample: i18n_languages, i18n_source_strings, i18n_sync_runs, i18n_translations
- rls_policy_always_true: 25 | sample: analytics_events, analytics_sessions, cat_ins_rules, cat_reg_rules, cat_regional_configs, cat_tenure_config, crm_allotments, crm_booking_assets, crm_insurance, crm_lead_assets
- function_search_path_mutable: 20 | sample: auto_generate_display_id, encode_base33, generate_display_id, get_dealer_offers, get_market_best_offers, get_my_tenant_id, get_nearest_pincode, get_nearest_serviceable_district, handle_updated_at, is_marketplace_admin

Performance highlights:
- unindexed_foreign_keys: 40
- unused_index: 55
- multiple_permissive_policies: 168
- auth_rls_initplan: 48
- duplicate_index: 2
- no_primary_key: 1

## True Unused Tables (After DB Logic Scan)
Used sources: code `.from()` refs + triggers + functions + views.
- cat_item_suitability
- cat_price_state_history
- cat_price_state_trash
- cat_raw_items
- cat_tenure_config
- crm_assets
- crm_bank_apps
- crm_booking_assets
- crm_dealer_shares
- crm_lead_assets
- crm_lead_events
- id_operating_hours
- inv_ledger
- inv_marketplace
- inv_po_items
- inv_stock
- registration_rules
- sys_analytics_events
- sys_analytics_sessions
- sys_error_log
- sys_schema_registry
- sys_settings