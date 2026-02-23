-- CRM Phase 0 Rollback SQL
-- Run this ONLY if Phase 1 migrations need to be reversed

-- crm_bookings: restore dropped columns
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'FINANCE'::text;
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS customer_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'PENDING'::text;
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS finance_status TEXT DEFAULT 'PENDING'::text;
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS insurance_status TEXT DEFAULT 'PENDING'::text;
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS inventory_status TEXT DEFAULT 'AVAILABLE'::text;
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING'::text;
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS pdi_status TEXT DEFAULT 'PENDING'::text;
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'PENDING'::text;
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS sales_order_snapshot JSONB;
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS vehicle_details JSONB DEFAULT '{}'::jsonb;

-- crm_leads: restore dropped columns  
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS events_log JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS price_snapshot JSONB;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS referral_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS utm_data JSONB;

-- Restore crm_audit_log from sys_archived
-- INSERT INTO crm_audit_log SELECT (data->>'id')::uuid, ... FROM sys_archived WHERE original_table = 'crm_audit_log';
