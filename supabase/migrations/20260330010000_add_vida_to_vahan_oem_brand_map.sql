insert into public.vahan_oem_brand_map (row_label_key, brand_name, logo_slug)
values ('VIDA', 'Hero', 'hero')
on conflict (row_label_key) do update
set brand_name = excluded.brand_name,
    logo_slug = excluded.logo_slug;

