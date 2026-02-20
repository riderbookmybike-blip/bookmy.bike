alter table public.id_members
add column if not exists preferences jsonb not null default '{}'::jsonb;

comment on column public.id_members.preferences is 'Stores member-level UI preferences such as theme selection.';
