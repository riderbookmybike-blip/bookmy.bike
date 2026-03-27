create table if not exists public.sys_cache_audit_runs (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    started_at timestamptz not null default now(),
    completed_at timestamptz null,
    status text not null check (status in ('PASS', 'MISMATCH', 'ERROR')),
    actor text not null default 'SYSTEM',
    state_code text not null default 'MH',
    checked_skus integer not null default 0,
    mismatch_count integer not null default 0,
    auto_fixed boolean not null default false,
    fixed_tags text[] not null default '{}',
    notes text null,
    duration_ms integer null
);

create index if not exists idx_sys_cache_audit_runs_created_at
    on public.sys_cache_audit_runs (created_at desc);

create index if not exists idx_sys_cache_audit_runs_status_created_at
    on public.sys_cache_audit_runs (status, created_at desc);

create table if not exists public.sys_cache_audit_mismatches (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    run_id uuid not null references public.sys_cache_audit_runs(id) on delete cascade,
    sku_id text not null,
    model_slug text null,
    field_name text not null,
    cached_value text null,
    fresh_value text null,
    mismatch_type text not null default 'PRICE_DRIFT'
);

create index if not exists idx_sys_cache_audit_mismatch_run_id
    on public.sys_cache_audit_mismatches (run_id);
