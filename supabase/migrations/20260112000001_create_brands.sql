create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_url text,
  logo_svg text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);