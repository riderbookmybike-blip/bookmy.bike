-- Delete all 6-digit HSN codes (keep only 8-digit)
DELETE FROM public.hsn_codes WHERE LENGTH(code) < 8;
