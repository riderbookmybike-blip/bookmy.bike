create schema if not exists sys_archived;

create table if not exists sys_archived.crm_refactor_phase0_runs (
    run_tag text primary key,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    started_by text,
    notes text
);

insert into sys_archived.crm_refactor_phase0_runs (run_tag, started_at, started_by, notes)
values ('20260221_202023', now(), 'codex', 'phase0 backup + schema snapshot before crm refactor')
on conflict (run_tag) do nothing;

create table if not exists sys_archived.crm_refactor_phase0_manifest (
    run_tag text not null,
    source_table text not null,
    backup_table text not null,
    row_count bigint not null,
    captured_at timestamptz not null default now(),
    primary key (run_tag, source_table)
);

create table if not exists sys_archived.crm_refactor_schema_columns_snapshot (
    run_tag text not null,
    table_schema text not null,
    table_name text not null,
    column_name text not null,
    ordinal_position int not null,
    data_type text not null,
    udt_name text not null,
    is_nullable text not null,
    column_default text,
    captured_at timestamptz not null default now(),
    primary key (run_tag, table_schema, table_name, column_name)
);

do $$
declare
    backup_run_tag constant text := '20260221_202023';
    src_table text;
    backup_table text;
    src_tables text[] := array[
        'id_members',
        'id_member_tenants',
        'id_member_contacts',
        'id_member_addresses',
        'id_member_assets',
        'id_member_events',
        'id_member_spins',
        'id_documents',
        'oclub_wallets',
        'oclub_coin_ledger',
        'oclub_referrals',
        'crm_leads',
        'crm_quotes',
        'crm_bookings',
        'crm_receipts',
        'crm_audit_log'
    ];
begin
    delete from sys_archived.crm_refactor_phase0_manifest m where m.run_tag = backup_run_tag;

    foreach src_table in array src_tables loop
        if to_regclass(format('public.%I', src_table)) is null then
            continue;
        end if;

        backup_table := format('%s_bkp_%s', src_table, backup_run_tag);

        execute format(
            'create table if not exists sys_archived.%I as table public.%I with data',
            backup_table,
            src_table
        );

        execute format(
            'comment on table sys_archived.%I is %L',
            backup_table,
            format('crm refactor phase0 backup from public.%s (%s)', src_table, backup_run_tag)
        );

        execute format(
            'insert into sys_archived.crm_refactor_phase0_manifest (run_tag, source_table, backup_table, row_count)
             select %L, %L, %L, count(*)::bigint from sys_archived.%I
             on conflict (run_tag, source_table) do update
               set backup_table = excluded.backup_table,
                   row_count = excluded.row_count,
                   captured_at = now()',
            backup_run_tag,
            src_table,
            format('sys_archived.%s', backup_table),
            backup_table
        );
    end loop;
end
$$;

insert into sys_archived.crm_refactor_schema_columns_snapshot (
    run_tag,
    table_schema,
    table_name,
    column_name,
    ordinal_position,
    data_type,
    udt_name,
    is_nullable,
    column_default
)
select
    '20260221_202023' as run_tag,
    c.table_schema,
    c.table_name,
    c.column_name,
    c.ordinal_position,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and (
      c.table_name like 'crm_%'
      or c.table_name in (
          'id_members',
          'id_member_tenants',
          'id_member_contacts',
          'id_member_addresses',
          'id_member_assets',
          'id_member_events',
          'id_member_spins',
          'id_documents',
          'oclub_wallets',
          'oclub_coin_ledger',
          'oclub_referrals'
      )
  )
on conflict (run_tag, table_schema, table_name, column_name) do nothing;

update sys_archived.crm_refactor_phase0_runs
set completed_at = now()
where run_tag = '20260221_202023';
