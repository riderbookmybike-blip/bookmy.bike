-- Fix: Add missing unique constraint for dealer pricing rules
ALTER TABLE public.id_dealer_pricing_rules
ADD CONSTRAINT id_dealer_pricing_rules_tenant_sku_state_key UNIQUE (tenant_id, vehicle_color_id, state_code);
