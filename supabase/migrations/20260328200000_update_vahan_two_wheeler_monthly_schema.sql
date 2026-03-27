-- Add rto_code and rto_name to tracking table for granular metrics
alter table public.vahan_two_wheeler_monthly_uploads
add column rto_code text not null default 'XX',
add column rto_name text not null default 'Unknown';

-- Drop the old constraint
alter table public.vahan_two_wheeler_monthly_uploads
drop constraint if exists vahan_two_wheeler_monthly_uploads_uq;

-- Recreate the unique constraint including rto_code
alter table public.vahan_two_wheeler_monthly_uploads
add constraint vahan_two_wheeler_monthly_uploads_uq unique (state_code, year, month_no, rto_code, maker);

-- Create index on rto_code
create index if not exists idx_vahan_two_wheeler_monthly_uploads_rto_code
on public.vahan_two_wheeler_monthly_uploads (rto_code);
