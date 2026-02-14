-- Books core tables: chart of accounts, journal, bank transactions, recon rules
-- Note: id_bank_accounts already exists (20260205_dms_org_expansion.sql)

begin;

-- 1) Chart of Accounts
create table if not exists public.accounts (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null,
    code text not null,
    name text not null,
    type text not null check (type in ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')),
    parent_id uuid references public.accounts(id) on delete set null,
    is_bank boolean default false,
    is_cash boolean default false,
    currency text default 'INR',
    active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create unique index if not exists accounts_tenant_code_idx on public.accounts(tenant_id, code);
create index if not exists accounts_tenant_type_idx on public.accounts(tenant_id, type);

-- 2) Journal entries (header)
create table if not exists public.journal_entries (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null,
    entry_date date not null default current_date,
    memo text,
    source_type text,   -- e.g. RECEIPT, PAYMENT, INVOICE, BILL, ADJUSTMENT
    source_id uuid,
    created_by uuid,
    created_at timestamptz default now()
);

create index if not exists journal_entries_tenant_date_idx on public.journal_entries(tenant_id, entry_date);
create index if not exists journal_entries_source_idx on public.journal_entries(tenant_id, source_type, source_id);

-- 3) Journal lines (detail) – enforce DR/CR on application side
create table if not exists public.journal_lines (
    id uuid primary key default gen_random_uuid(),
    entry_id uuid not null references public.journal_entries(id) on delete cascade,
    account_id uuid not null references public.accounts(id),
    description text,
    dr_amount numeric(14,2) default 0 check (dr_amount >= 0),
    cr_amount numeric(14,2) default 0 check (cr_amount >= 0)
);

create index if not exists journal_lines_entry_idx on public.journal_lines(entry_id);
create index if not exists journal_lines_account_idx on public.journal_lines(account_id);

-- 4) Bank transactions (for import/reconciliation)
create table if not exists public.bank_transactions (
    id uuid primary key default gen_random_uuid(),
    bank_account_id uuid not null references public.id_bank_accounts(id) on delete cascade,
    tenant_id uuid not null,
    txn_date date not null,
    amount numeric(14,2) not null,
    txn_type text not null check (txn_type in ('DEBIT','CREDIT')),
    description text,
    ref_no text,
    source text default 'import',
    matched_entry_id uuid references public.journal_entries(id),
    status text not null default 'UNMATCHED' check (status in ('UNMATCHED','MATCHED','PARTIAL')),
    created_at timestamptz default now()
);

create index if not exists bank_txn_tenant_date_idx on public.bank_transactions(tenant_id, txn_date);
create index if not exists bank_txn_match_idx on public.bank_transactions(matched_entry_id);

-- 5) Reconciliation rules (simple patterns)
create table if not exists public.reconciliation_rules (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null,
    bank_account_id uuid references public.id_bank_accounts(id) on delete cascade,
    pattern text not null, -- ILIKE pattern to match description or ref
    amount numeric(14,2), -- optional exact amount match
    account_id uuid references public.accounts(id),
    created_at timestamptz default now(),
    active boolean default true
);

create index if not exists reconciliation_rules_tenant_idx on public.reconciliation_rules(tenant_id, bank_account_id);

-- TODO: add RLS policies per tenant; enforce DR=CR in a SECDEF function when posting entries.

commit;
