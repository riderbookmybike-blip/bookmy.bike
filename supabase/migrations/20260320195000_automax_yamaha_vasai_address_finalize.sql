-- Automax Yamaha — Finalize primary location to Vasai West
-- Corrects the Goregaon West placeholder set during interim patch.
-- Business confirmed: primary showroom is Vasai West.
-- Date: 2026-03-19
-- Applied via Supabase MCP as migration: automax_yamaha_vasai_address_finalize_20260320

UPDATE id_locations
SET
  name           = 'Automax Yamaha - Vasai West',
  address_line_1 = 'Shop No. 3, Sai Datta Complex, S.V. Road, Vasai West',
  address_line_2 = NULL,
  city           = 'Vasai',
  pincode        = '401202',
  updated_at     = NOW()
WHERE id = 'f7acf697-d809-41ea-a81f-b8ec62b9ac29';

UPDATE id_tenants
SET config = config
  - 'pending_confirmation'
  - 'needs_address_verification'
  - 'interim_address_note'
WHERE slug = 'automax-yamaha';
