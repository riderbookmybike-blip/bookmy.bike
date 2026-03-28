alter table public.vahan_oem_brand_map
  add column if not exists brand_color_hex text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vahan_oem_brand_map_brand_color_hex_chk'
      and conrelid = 'public.vahan_oem_brand_map'::regclass
  ) then
    alter table public.vahan_oem_brand_map
      add constraint vahan_oem_brand_map_brand_color_hex_chk
      check (brand_color_hex is null or brand_color_hex ~* '^#([0-9A-F]{3}|[0-9A-F]{6})$');
  end if;
end$$;

comment on column public.vahan_oem_brand_map.brand_color_hex is 'Optional brand primary color in HEX format (#RRGGBB or #RGB) used by VAHAN charts.';
