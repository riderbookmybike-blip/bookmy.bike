-- Add member-level activity tracking to id_members
-- last_pdp_slug was already in 20260321001000 but last_active_at was missing.
-- This migration adds both safely (IF NOT EXISTS).
alter table public.id_members
  add column if not exists last_active_at timestamptz,
  add column if not exists last_pdp_slug  text;

-- Index: recently active members (CRM list sorting)
create index if not exists idx_id_members_last_active_at
  on public.id_members(last_active_at desc nulls last)
  where last_active_at is not null;

-- Index: last PDP visited (filter by bike interest)
create index if not exists idx_id_members_last_pdp_slug
  on public.id_members(last_pdp_slug)
  where last_pdp_slug is not null;
