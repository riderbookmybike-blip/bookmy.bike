-- INV-007: Quote component breakdown + payment terms for requisition RFQ

create table if not exists public.inv_quote_line_items (
    id uuid default gen_random_uuid() primary key,
    quote_id uuid not null references public.inv_dealer_quotes(id) on delete cascade,
    request_item_id uuid not null references public.inv_request_items(id) on delete cascade,
    offered_amount numeric not null default 0 check (offered_amount >= 0),
    notes text,
    created_at timestamptz not null default now(),
    unique (quote_id, request_item_id)
);

comment on table public.inv_quote_line_items is 'Component-wise quoted amount per requisition cost line.';

create table if not exists public.inv_quote_terms (
    quote_id uuid primary key references public.inv_dealer_quotes(id) on delete cascade,
    payment_mode text check (payment_mode in ('ADVANCE', 'PARTIAL', 'CREDIT', 'OTHER')),
    credit_days integer check (credit_days >= 0),
    advance_percent numeric check (advance_percent >= 0 and advance_percent <= 100),
    expected_dispatch_days integer check (expected_dispatch_days >= 0),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.inv_quote_terms is 'Commercial payment/credit terms captured alongside dealer quote.';

create index if not exists idx_inv_quote_line_items_quote on public.inv_quote_line_items(quote_id);
create index if not exists idx_inv_quote_line_items_request_item on public.inv_quote_line_items(request_item_id);

alter table public.inv_quote_line_items enable row level security;
alter table public.inv_quote_terms enable row level security;

drop policy if exists "inv_quote_line_items_access" on public.inv_quote_line_items;
create policy "inv_quote_line_items_access" on public.inv_quote_line_items for all using (true) with check (true);

drop policy if exists "inv_quote_terms_access" on public.inv_quote_terms;
create policy "inv_quote_terms_access" on public.inv_quote_terms for all using (true) with check (true);
