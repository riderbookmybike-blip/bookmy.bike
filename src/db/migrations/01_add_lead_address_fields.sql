ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS current_address text,
    ADD COLUMN IF NOT EXISTS permanent_address text,
    ADD COLUMN IF NOT EXISTS current_address_type text,
    ADD COLUMN IF NOT EXISTS permanent_address_type text;

ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS events_log jsonb DEFAULT '[]'::jsonb;
