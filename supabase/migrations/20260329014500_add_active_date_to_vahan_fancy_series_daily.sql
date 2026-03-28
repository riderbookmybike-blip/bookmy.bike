alter table public.vahan_fancy_series_daily
  add column if not exists open_on_text text,
  add column if not exists active_on_date date;

create index if not exists idx_vahan_fancy_series_active_on_date
  on public.vahan_fancy_series_daily (active_on_date);
