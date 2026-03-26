-- INV-007 PHASE-B (DRAFT)
-- Additive compliance schema for delivery note, vendor invoice, 3-way match.
-- Date: 2026-03-03
-- NOTE: Draft for audit review. Do not apply without approval.

begin;

-- Compatibility bootstrap for legacy environments.
create table if not exists public.cat_skus (
    id uuid primary key default gen_random_uuid()
);

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'inv_cost_type'
  ) then
    create type public.inv_cost_type as enum ('MATERIAL', 'LABOUR', 'LOGISTICS', 'TAX', 'OTHER');
  end if;
end
$$;

create table if not exists public.inv_request_items (
    id uuid primary key default gen_random_uuid()
);

-- 1) Delivery Notes ----------------------------------------------------------

create table if not exists public.inv_delivery_notes (
    id uuid primary key default gen_random_uuid(),
    po_id uuid not null references public.inv_purchase_orders(id) on delete cascade,
    note_number text not null,
    note_date date not null,
    transporter_name text,
    vehicle_number text,
    docket_number text,
    status text not null default 'RECEIVED' check (status in ('RECEIVED', 'VERIFIED', 'DISCREPANCY', 'CLOSED')),
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (po_id, note_number)
);

create table if not exists public.inv_delivery_note_items (
    id uuid primary key default gen_random_uuid(),
    delivery_note_id uuid not null references public.inv_delivery_notes(id) on delete cascade,
    sku_id uuid not null references public.cat_skus(id),
    qty_sent numeric(12,2) not null check (qty_sent >= 0),
    qty_received numeric(12,2) not null default 0 check (qty_received >= 0),
    qty_rejected numeric(12,2) not null default 0 check (qty_rejected >= 0),
    remarks text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_inv_delivery_notes_po_id on public.inv_delivery_notes(po_id);
create index if not exists idx_inv_delivery_notes_status on public.inv_delivery_notes(status);
create index if not exists idx_inv_delivery_note_items_note_id on public.inv_delivery_note_items(delivery_note_id);

comment on table public.inv_delivery_notes is 'Supplier dispatch/delivery note documents linked to PO.';
comment on table public.inv_delivery_note_items is 'Line-level dispatch/receive quantities per delivery note.';

-- 2) Vendor Invoices ---------------------------------------------------------

create table if not exists public.inv_vendor_invoices (
    id uuid primary key default gen_random_uuid(),
    po_id uuid not null references public.inv_purchase_orders(id) on delete cascade,
    invoice_number text not null,
    invoice_date date not null,
    taxable_amount numeric(14,2) not null check (taxable_amount >= 0),
    tax_amount numeric(14,2) not null default 0 check (tax_amount >= 0),
    total_amount numeric(14,2) not null check (total_amount >= 0),
    status text not null default 'PENDING_MATCH' check (status in ('PENDING_MATCH', 'MATCHED', 'HOLD', 'APPROVED_FOR_PAYMENT', 'PAID')),
    hold_reason text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (po_id, invoice_number)
);

create table if not exists public.inv_vendor_invoice_items (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid not null references public.inv_vendor_invoices(id) on delete cascade,
    request_item_id uuid references public.inv_request_items(id) on delete set null,
    cost_type public.inv_cost_type,
    amount numeric(14,2) not null check (amount >= 0),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_inv_vendor_invoices_po_id on public.inv_vendor_invoices(po_id);
create index if not exists idx_inv_vendor_invoices_status on public.inv_vendor_invoices(status);
create index if not exists idx_inv_vendor_invoice_items_invoice_id on public.inv_vendor_invoice_items(invoice_id);

comment on table public.inv_vendor_invoices is 'Vendor invoices against purchase orders.';
comment on table public.inv_vendor_invoice_items is 'Invoice line items mapped to requisition cost lines where available.';

-- 3) Three-way Match ---------------------------------------------------------

create table if not exists public.inv_three_way_matches (
    id uuid primary key default gen_random_uuid(),
    po_id uuid not null references public.inv_purchase_orders(id) on delete cascade,
    invoice_id uuid not null references public.inv_vendor_invoices(id) on delete cascade,
    match_status text not null check (match_status in ('MATCHED', 'MISMATCH', 'HOLD')),
    qty_variance numeric(14,2),
    value_variance numeric(14,2),
    tolerance_used jsonb,
    notes text,
    checked_by uuid,
    checked_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists idx_inv_three_way_matches_po_id on public.inv_three_way_matches(po_id);
create index if not exists idx_inv_three_way_matches_invoice_id on public.inv_three_way_matches(invoice_id);
create index if not exists idx_inv_three_way_matches_status on public.inv_three_way_matches(match_status);

comment on table public.inv_three_way_matches is 'Audit trail of PO vs receipt vs invoice reconciliation outcomes.';

-- 4) Updated-at trigger helper ----------------------------------------------

create or replace function public.inv_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_inv_delivery_notes_updated_at on public.inv_delivery_notes;
create trigger trg_inv_delivery_notes_updated_at
before update on public.inv_delivery_notes
for each row execute function public.inv_set_updated_at();

drop trigger if exists trg_inv_delivery_note_items_updated_at on public.inv_delivery_note_items;
create trigger trg_inv_delivery_note_items_updated_at
before update on public.inv_delivery_note_items
for each row execute function public.inv_set_updated_at();

drop trigger if exists trg_inv_vendor_invoices_updated_at on public.inv_vendor_invoices;
create trigger trg_inv_vendor_invoices_updated_at
before update on public.inv_vendor_invoices
for each row execute function public.inv_set_updated_at();

drop trigger if exists trg_inv_vendor_invoice_items_updated_at on public.inv_vendor_invoice_items;
create trigger trg_inv_vendor_invoice_items_updated_at
before update on public.inv_vendor_invoice_items
for each row execute function public.inv_set_updated_at();

-- 5) RLS placeholders (align with current inventory broad-access pattern) ----

alter table public.inv_delivery_notes enable row level security;
alter table public.inv_delivery_note_items enable row level security;
alter table public.inv_vendor_invoices enable row level security;
alter table public.inv_vendor_invoice_items enable row level security;
alter table public.inv_three_way_matches enable row level security;

drop policy if exists "inv_delivery_notes_access" on public.inv_delivery_notes;
create policy "inv_delivery_notes_access" on public.inv_delivery_notes for all using (true) with check (true);

drop policy if exists "inv_delivery_note_items_access" on public.inv_delivery_note_items;
create policy "inv_delivery_note_items_access" on public.inv_delivery_note_items for all using (true) with check (true);

drop policy if exists "inv_vendor_invoices_access" on public.inv_vendor_invoices;
create policy "inv_vendor_invoices_access" on public.inv_vendor_invoices for all using (true) with check (true);

drop policy if exists "inv_vendor_invoice_items_access" on public.inv_vendor_invoice_items;
create policy "inv_vendor_invoice_items_access" on public.inv_vendor_invoice_items for all using (true) with check (true);

drop policy if exists "inv_three_way_matches_access" on public.inv_three_way_matches;
create policy "inv_three_way_matches_access" on public.inv_three_way_matches for all using (true) with check (true);

commit;
