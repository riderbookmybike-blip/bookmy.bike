-- Add missing crm_bookings fields required by booking stage panels (PDI / Insurance / Registration)

ALTER TABLE public.crm_bookings
  ADD COLUMN IF NOT EXISTS pdi_remarks TEXT,
  ADD COLUMN IF NOT EXISTS pdi_checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pdi_status TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS insurance_premium NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS insurance_start_date DATE,
  ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS insurance_status TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS tax_token TEXT,
  ADD COLUMN IF NOT EXISTS permit_type TEXT,
  ADD COLUMN IF NOT EXISTS registration_date DATE,
  ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'PENDING';

-- Status guards for stage-panel controlled fields
ALTER TABLE public.crm_bookings
  DROP CONSTRAINT IF EXISTS crm_bookings_pdi_status_check,
  ADD CONSTRAINT crm_bookings_pdi_status_check
    CHECK (pdi_status IN ('PENDING','IN_PROGRESS','PASSED','FAILED'));

ALTER TABLE public.crm_bookings
  DROP CONSTRAINT IF EXISTS crm_bookings_insurance_status_check,
  ADD CONSTRAINT crm_bookings_insurance_status_check
    CHECK (insurance_status IN ('PENDING','APPLIED','ISSUED','FAILED'));

ALTER TABLE public.crm_bookings
  DROP CONSTRAINT IF EXISTS crm_bookings_registration_status_check,
  ADD CONSTRAINT crm_bookings_registration_status_check
    CHECK (registration_status IN ('PENDING','APPLIED','APPROVED','FAILED'));

-- Helpful comments
COMMENT ON COLUMN public.crm_bookings.pdi_remarks IS 'Technician notes captured during PDI stage.';
COMMENT ON COLUMN public.crm_bookings.pdi_checklist IS 'Structured checklist state for PDI checkpoints.';
COMMENT ON COLUMN public.crm_bookings.insurance_premium IS 'Final insurance premium amount.';
COMMENT ON COLUMN public.crm_bookings.tax_token IS 'RTO tax token/receipt reference.';
COMMENT ON COLUMN public.crm_bookings.permit_type IS 'Registration permit classification (PRIVATE/COMMERCIAL/etc).';
