-- RLS for books tables + seed helper for default chart of accounts

begin;

-- Enable RLS
alter table if exists public.accounts enable row level security;
alter table if exists public.journal_entries enable row level security;
alter table if exists public.journal_lines enable row level security;
alter table if exists public.bank_transactions enable row level security;
alter table if exists public.reconciliation_rules enable row level security;

-- Helper to read tenant_id from JWT claims
create or replace function public.current_tenant_id() returns uuid
language sql stable
security definer
set search_path = public
as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'tenant_id','')::uuid;
$$;

-- Policies: tenant isolation using JWT tenant_id claim
create policy if not exists accounts_tenant_isolation on public.accounts
    for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

create policy if not exists journal_entries_tenant_isolation on public.journal_entries
    for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

create policy if not exists journal_lines_tenant_isolation on public.journal_lines
    for all using (
        exists (select 1 from public.journal_entries je where je.id = entry_id and je.tenant_id = public.current_tenant_id())
    ) with check (
        exists (select 1 from public.journal_entries je where je.id = entry_id and je.tenant_id = public.current_tenant_id())
    );

create policy if not exists bank_txn_tenant_isolation on public.bank_transactions
    for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

create policy if not exists recon_rules_tenant_isolation on public.reconciliation_rules
    for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

-- Seed function for default chart of accounts per tenant
create or replace function public.seed_default_accounts(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_exists int;
begin
    select count(*) into v_exists from public.accounts where tenant_id = p_tenant_id;
    if v_exists > 0 then
        return; -- already seeded
    end if;

    -- Default cash account (requested): code CA-1001
    insert into public.accounts (tenant_id, code, name, type, is_cash) values
        (p_tenant_id, 'CA-1001', 'Cash Account', 'ASSET', true);

    insert into public.accounts (tenant_id, code, name, type, is_bank) values
        (p_tenant_id, 'BANK-UNSPEC', 'Bank - Unspecified', 'ASSET', true);

    insert into public.accounts (tenant_id, code, name, type) values
        (p_tenant_id, 'AR', 'Accounts Receivable', 'ASSET'),
        (p_tenant_id, 'AP', 'Accounts Payable', 'LIABILITY'),
        (p_tenant_id, 'REV-VEH', 'Vehicle Revenue', 'REVENUE'),
        (p_tenant_id, 'REV-ACC', 'Accessories Revenue', 'REVENUE'),
        (p_tenant_id, 'TAX-OUTPUT', 'Output Tax', 'LIABILITY'),
        (p_tenant_id, 'TAX-INPUT', 'Input Tax', 'ASSET'),
        (p_tenant_id, 'EXP-MISC', 'Misc Expenses', 'EXPENSE');
end;
$$;

comment on function public.seed_default_accounts is 'Seeds a minimal chart of accounts for a tenant if empty.';

commit;
