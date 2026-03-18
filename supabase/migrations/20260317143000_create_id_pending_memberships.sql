-- Pending membership intake for signup/login attempts without valid referral completion.
create table if not exists public.id_pending_memberships (
    id uuid primary key default gen_random_uuid(),
    phone text not null,
    full_name text null,
    pincode text null,
    state text null,
    district text null,
    taluka text null,
    area text null,
    latitude double precision null,
    longitude double precision null,
    referral_code_input text null,
    referral_code_from_link text null,
    source text not null default 'DIRECT_LINK',
    reason text null,
    status text not null default 'PENDING',
    metadata jsonb not null default '{}'::jsonb,
    first_seen_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint id_pending_memberships_phone_chk check (phone ~ '^[0-9]{10}$'),
    constraint id_pending_memberships_pincode_chk check (pincode is null or pincode ~ '^[0-9]{6}$'),
    constraint id_pending_memberships_status_chk check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CONVERTED'))
);

create unique index if not exists uq_id_pending_memberships_phone on public.id_pending_memberships (phone);
create index if not exists idx_id_pending_memberships_status on public.id_pending_memberships (status);
create index if not exists idx_id_pending_memberships_last_seen_at on public.id_pending_memberships (last_seen_at desc);
create index if not exists idx_id_pending_memberships_referral_input
    on public.id_pending_memberships (referral_code_input);

create or replace function public.set_id_pending_memberships_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_id_pending_memberships_updated_at on public.id_pending_memberships;
create trigger trg_id_pending_memberships_updated_at
before update on public.id_pending_memberships
for each row
execute function public.set_id_pending_memberships_updated_at();
