
create table if not exists migration_field_mappings (
    collection_name text primary key,
    mapping_config jsonb not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS (standard practice, though admins bypass it)
alter table migration_field_mappings enable row level security;

create policy "Admins can manage mappings"
    on migration_field_mappings
    for all
    using (true) -- Simplified for internal dashboard usage
    with check (true);
