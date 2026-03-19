-- Dealer enrichment HIGH-confidence patch (business-confirmed)
-- Date: 2026-03-20

BEGIN;

-- 1) Automax Yamaha: resolve ambiguity to Vasai and clear pending flags.
UPDATE public.id_tenants t
SET
  name = 'Yamaha - Automax Automotive',
  location = 'Vasai',
  config = (
    (COALESCE(t.config, '{}'::jsonb) - 'pending_note' - 'pending_confirmation')
    || jsonb_build_object(
      'legal_name', 'Automax Automotive',
      'legal_name_source', 'BUSINESS_CONFIRMED_2026-03-20',
      'legal_name_updated', '2026-03-20',
      'legal_name_confidence', 'HIGH'
    )
  )
WHERE t.slug = 'automax-yamaha';

-- 2) Myscooty legal name confirmed by business.
UPDATE public.id_tenants t
SET
  name = 'Myscooty',
  config = (
    (COALESCE(t.config, '{}'::jsonb) - 'pending_note' - 'manual_verification_required')
    || jsonb_build_object(
      'legal_name', 'Myscooty',
      'legal_name_source', 'BUSINESS_CONFIRMED_2026-03-20',
      'legal_name_updated', '2026-03-20',
      'legal_name_confidence', 'HIGH'
    )
  )
WHERE t.slug = 'myscooty';

-- 3) Suryodaya legal name and branch updates.
UPDATE public.id_tenants t
SET
  name = 'Bajaj - Suryodaya Motors Private Limited',
  location = 'Vasai',
  pincode = '401208',
  config = (
    (COALESCE(t.config, '{}'::jsonb) - 'needs_address_verification')
    || jsonb_build_object(
      'legal_name', 'SURYODAYA MOTORS PRIVATE LIMITED',
      'legal_name_source', 'BUSINESS_CONFIRMED_2026-03-20',
      'legal_name_updated', '2026-03-20',
      'legal_name_confidence', 'HIGH'
    )
  )
WHERE t.slug = 'suryodaya-bajaj';

-- Ensure existing primary showroom row is Vasai East.
UPDATE public.id_locations l
SET
  type = 'SHOWROOM',
  address_line_1 = 'Vishant Regency, Near Fatherwadi, Gokhivare, Near Range Office',
  address_line_2 = NULL,
  city = 'Vasai',
  pincode = '401208',
  is_primary = TRUE,
  is_active = TRUE,
  updated_at = NOW()
WHERE l.id = (
  SELECT l2.id
  FROM public.id_locations l2
  JOIN public.id_tenants t2 ON t2.id = l2.tenant_id
  WHERE t2.slug = 'suryodaya-bajaj'
  ORDER BY l2.is_primary DESC, l2.created_at ASC
  LIMIT 1
);

-- Insert Vasai West showroom branch if missing.
INSERT INTO public.id_locations (
  tenant_id,
  type,
  address_line_1,
  address_line_2,
  city,
  pincode,
  is_primary,
  is_active,
  created_at,
  updated_at
)
SELECT
  t.id,
  'SHOWROOM',
  'Vartak Arcade, Near Flyover, Ambadi Road, Vasai West, Palghar',
  NULL,
  'Vasai',
  '401202',
  FALSE,
  TRUE,
  NOW(),
  NOW()
FROM public.id_tenants t
WHERE t.slug = 'suryodaya-bajaj'
  AND NOT EXISTS (
    SELECT 1
    FROM public.id_locations l
    WHERE l.tenant_id = t.id
      AND COALESCE(l.address_line_1, '') = 'Vartak Arcade, Near Flyover, Ambadi Road, Vasai West, Palghar'
      AND COALESCE(l.pincode, '') = '401202'
  );

COMMIT;
