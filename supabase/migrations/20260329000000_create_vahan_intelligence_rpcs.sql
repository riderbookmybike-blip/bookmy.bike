-- VAHAN Intelligence RPC Layer (Backend-heavy hybrid)
-- Prerequisite: public.vahan_two_wheeler_monthly_uploads must contain rto_code and rto_name.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'vahan_two_wheeler_monthly_uploads' 
          AND column_name = 'rto_name'
    ) THEN
        RAISE EXCEPTION 'CRITICAL: public.vahan_two_wheeler_monthly_uploads schema drift. Column "rto_name" is missing.';
    END IF;
END $$;

-- 1) Helper: grain bucket
create or replace function public.vahan_period_bucket(p_date date, p_grain text)
returns date
language sql
immutable
as $$
    select
        case lower(coalesce(p_grain, 'month'))
            when 'quarter' then date_trunc('quarter', p_date)::date
            when 'year' then date_trunc('year', p_date)::date
            when 'multi_year' then date_trunc('year', p_date)::date
            else date_trunc('month', p_date)::date
        end;
$$;

-- 2) Helper: canonical monthly fact extractor
create or replace function public.vahan_monthly_fact(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_rto_code text default null,
    p_brand_name text default null
)
returns table (
    state_code text,
    rto_code text,
    rto_name text,
    brand_name text,
    month_start date,
    units bigint
)
language sql
stable
as $$
    select
        m.state_code,
        coalesce(m.rto_code, 'ALL') as rto_code,
        coalesce(m.rto_name, 'All') as rto_name,
        coalesce(nullif(m.brand_name, ''), m.maker) as brand_name,
        make_date(m.year, m.month_no, 1) as month_start,
        m.units::bigint as units
    from public.vahan_two_wheeler_monthly_uploads m
    where m.state_code = p_state_code
      and (m.year, m.month_no) >= (extract(year from p_from_month)::int, extract(month from p_from_month)::int)
      and (m.year, m.month_no) <= (extract(year from p_to_month)::int, extract(month from p_to_month)::int)
      and (p_rto_code is null or p_rto_code = '' or m.rto_code = p_rto_code)
      and (p_brand_name is null or p_brand_name = '' or coalesce(nullif(m.brand_name, ''), m.maker) = p_brand_name);
$$;

-- 3) KPI summary (total, prev-window, MoM, YoY)
create or replace function public.vahan_kpi_summary(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_rto_code text default null,
    p_brand_name text default null
)
returns table (
    total_units bigint,
    prev_period_units bigint,
    yoy_units bigint,
    prev_period_pct numeric,
    yoy_pct numeric
)
language plpgsql
stable
as $$
declare
    v_months int;
    v_prev_from date;
    v_prev_to date;
    v_yoy_from date;
    v_yoy_to date;
    v_cur bigint;
    v_prev bigint;
    v_yoy bigint;
begin
    v_months := greatest(
        1,
        (
            extract(year from age(date_trunc('month', p_to_month), date_trunc('month', p_from_month)))::int * 12
            + extract(month from age(date_trunc('month', p_to_month), date_trunc('month', p_from_month)))::int
            + 1
        )
    );

    v_prev_from := (date_trunc('month', p_from_month) - make_interval(months => v_months))::date;
    v_prev_to := (date_trunc('month', p_to_month) - make_interval(months => v_months))::date;
    v_yoy_from := (date_trunc('month', p_from_month) - interval '1 year')::date;
    v_yoy_to := (date_trunc('month', p_to_month) - interval '1 year')::date;

    select coalesce(sum(f.units), 0)::bigint
      into v_cur
    from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_code, p_brand_name) f;

    select coalesce(sum(f.units), 0)::bigint
      into v_prev
    from public.vahan_monthly_fact(p_state_code, v_prev_from, v_prev_to, p_rto_code, p_brand_name) f;

    select coalesce(sum(f.units), 0)::bigint
      into v_yoy
    from public.vahan_monthly_fact(p_state_code, v_yoy_from, v_yoy_to, p_rto_code, p_brand_name) f;

    return query
    select
        v_cur as total_units,
        v_prev as prev_period_units,
        v_yoy as yoy_units,
        case when v_prev > 0 then round(((v_cur - v_prev)::numeric / v_prev::numeric) * 100, 2) else null end as prev_period_pct,
        case when v_yoy > 0 then round(((v_cur - v_yoy)::numeric / v_yoy::numeric) * 100, 2) else null end as yoy_pct;
end;
$$;

-- 4) State timeline
create or replace function public.vahan_state_timeline(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_grain text default 'month',
    p_rto_code text default null,
    p_brand_name text default null
)
returns table (
    period_start date,
    units bigint
)
language sql
stable
as $$
    select
        public.vahan_period_bucket(f.month_start, p_grain) as period_start,
        sum(f.units)::bigint as units
    from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_code, p_brand_name) f
    group by 1
    order by 1;
$$;

-- 5) RTO share
create or replace function public.vahan_rto_share(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_brand_name text default null,
    p_top_n int default 20
)
returns table (
    rto_code text,
    rto_name text,
    units bigint,
    share_pct numeric
)
language sql
stable
as $$
    with s as (
        select
            f.rto_code,
            f.rto_name,
            sum(f.units)::bigint as units
        from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, null, p_brand_name) f
        group by 1, 2
    ),
    t as (
        select coalesce(sum(units), 0)::numeric as total_units from s
    )
    select
        s.rto_code,
        s.rto_name,
        s.units,
        case when t.total_units > 0 then round((s.units::numeric / t.total_units) * 100, 2) else 0 end as share_pct
    from s
    cross join t
    order by s.units desc
    limit greatest(coalesce(p_top_n, 20), 1);
$$;

-- 6) RTO Pareto
create or replace function public.vahan_rto_pareto(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_brand_name text default null,
    p_top_n int default 30
)
returns table (
    rank int,
    rto_code text,
    rto_name text,
    units bigint,
    share_pct numeric,
    cum_share_pct numeric
)
language sql
stable
as $$
    with s as (
        select
            f.rto_code,
            f.rto_name,
            sum(f.units)::bigint as units
        from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, null, p_brand_name) f
        group by 1, 2
    ),
    r as (
        select
            row_number() over (order by s.units desc)::int as rank,
            s.rto_code,
            s.rto_name,
            s.units,
            sum(s.units) over ()::numeric as total_units,
            sum(s.units) over (order by s.units desc rows between unbounded preceding and current row)::numeric as running_units
        from s
    )
    select
        r.rank,
        r.rto_code,
        r.rto_name,
        r.units,
        case when r.total_units > 0 then round((r.units::numeric / r.total_units) * 100, 2) else 0 end as share_pct,
        case when r.total_units > 0 then round((r.running_units / r.total_units) * 100, 2) else 0 end as cum_share_pct
    from r
    where r.rank <= greatest(coalesce(p_top_n, 30), 1)
    order by r.rank;
$$;

-- 7) RTO heatmap
create or replace function public.vahan_rto_heatmap(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_grain text default 'month',
    p_brand_name text default null
)
returns table (
    rto_code text,
    rto_name text,
    period_start date,
    units bigint
)
language sql
stable
as $$
    select
        f.rto_code,
        f.rto_name,
        public.vahan_period_bucket(f.month_start, p_grain) as period_start,
        sum(f.units)::bigint as units
    from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, null, p_brand_name) f
    group by 1, 2, 3
    order by 1, 3;
$$;

-- 8) RTO volatility
create or replace function public.vahan_rto_volatility(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_brand_name text default null
)
returns table (
    rto_code text,
    rto_name text,
    avg_units numeric,
    stddev_units numeric,
    cv_pct numeric,
    min_units bigint,
    max_units bigint
)
language sql
stable
as $$
    with m as (
        select
            f.rto_code,
            f.rto_name,
            f.month_start,
            sum(f.units)::bigint as units
        from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, null, p_brand_name) f
        group by 1, 2, 3
    )
    select
        m.rto_code,
        max(m.rto_name) as rto_name,
        round(avg(m.units)::numeric, 2) as avg_units,
        round(coalesce(stddev_pop(m.units), 0)::numeric, 2) as stddev_units,
        case
            when avg(m.units) > 0 then round((coalesce(stddev_pop(m.units), 0)::numeric / avg(m.units)::numeric) * 100, 2)
            else 0
        end as cv_pct,
        min(m.units)::bigint as min_units,
        max(m.units)::bigint as max_units
    from m
    group by m.rto_code
    order by avg_units desc;
$$;

-- 9) Top brand per RTO
create or replace function public.vahan_top_brand_per_rto(
    p_state_code text,
    p_from_month date,
    p_to_month date
)
returns table (
    rto_code text,
    rto_name text,
    top_brand text,
    top_brand_units bigint,
    top_brand_share_pct numeric,
    rto_total_units bigint
)
language sql
stable
as $$
    with rb as (
        select
            f.rto_code,
            f.rto_name,
            f.brand_name,
            sum(f.units)::bigint as units
        from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, null, null) f
        group by 1, 2, 3
    ),
    ranked as (
        select
            rb.*,
            sum(rb.units) over (partition by rb.rto_code)::bigint as rto_total_units,
            row_number() over (partition by rb.rto_code order by rb.units desc, rb.brand_name asc) as rn
        from rb
    )
    select
        ranked.rto_code,
        ranked.rto_name,
        ranked.brand_name as top_brand,
        ranked.units as top_brand_units,
        case when ranked.rto_total_units > 0 then round((ranked.units::numeric / ranked.rto_total_units::numeric) * 100, 2) else 0 end as top_brand_share_pct,
        ranked.rto_total_units
    from ranked
    where ranked.rn = 1
    order by ranked.rto_total_units desc;
$$;

-- 10) Brand share
create or replace function public.vahan_brand_share(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_rto_code text default null,
    p_top_n int default 20
)
returns table (
    brand_name text,
    units bigint,
    share_pct numeric
)
language sql
stable
as $$
    with b as (
        select
            f.brand_name,
            sum(f.units)::bigint as units
        from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_code, null) f
        group by 1
    ),
    t as (
        select coalesce(sum(units), 0)::numeric as total_units from b
    )
    select
        b.brand_name,
        b.units,
        case when t.total_units > 0 then round((b.units::numeric / t.total_units) * 100, 2) else 0 end as share_pct
    from b
    cross join t
    order by b.units desc
    limit greatest(coalesce(p_top_n, 20), 1);
$$;

-- 11) Brand trend
create or replace function public.vahan_brand_trend(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_grain text default 'month',
    p_rto_code text default null,
    p_top_n int default 12
)
returns table (
    brand_name text,
    period_start date,
    units bigint
)
language sql
stable
as $$
    with top_brands as (
        select
            f.brand_name,
            sum(f.units)::bigint as units
        from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_code, null) f
        group by 1
        order by units desc
        limit greatest(coalesce(p_top_n, 12), 1)
    )
    select
        f.brand_name,
        public.vahan_period_bucket(f.month_start, p_grain) as period_start,
        sum(f.units)::bigint as units
    from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_code, null) f
    join top_brands tb on tb.brand_name = f.brand_name
    group by 1, 2
    order by 2, 1;
$$;

-- 12) Brand growth matrix (share vs growth vs volume)
create or replace function public.vahan_brand_growth_matrix(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_rto_code text default null,
    p_top_n int default 20
)
returns table (
    brand_name text,
    units bigint,
    share_pct numeric,
    growth_pct numeric
)
language plpgsql
stable
as $$
declare
    v_months int;
    v_prev_from date;
    v_prev_to date;
begin
    v_months := greatest(
        1,
        (
            extract(year from age(date_trunc('month', p_to_month), date_trunc('month', p_from_month)))::int * 12
            + extract(month from age(date_trunc('month', p_to_month), date_trunc('month', p_from_month)))::int
            + 1
        )
    );
    v_prev_from := (date_trunc('month', p_from_month) - make_interval(months => v_months))::date;
    v_prev_to := (date_trunc('month', p_to_month) - make_interval(months => v_months))::date;

    return query
    with cur as (
        select f.brand_name, sum(f.units)::bigint as units
        from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_code, null) f
        group by 1
    ),
    prev as (
        select f.brand_name, sum(f.units)::bigint as units
        from public.vahan_monthly_fact(p_state_code, v_prev_from, v_prev_to, p_rto_code, null) f
        group by 1
    ),
    t as (
        select coalesce(sum(cur.units), 0)::numeric as total_units from cur
    )
    select
        cur.brand_name,
        cur.units,
        case when t.total_units > 0 then round((cur.units::numeric / t.total_units) * 100, 2) else 0 end as share_pct,
        case when coalesce(prev.units, 0) > 0 then round(((cur.units - prev.units)::numeric / prev.units::numeric) * 100, 2) else null end as growth_pct
    from cur
    left join prev on prev.brand_name = cur.brand_name
    cross join t
    order by cur.units desc
    limit greatest(coalesce(p_top_n, 20), 1);
end;
$$;

-- 13) Brand vs RTO matrix
create or replace function public.vahan_brand_rto_matrix(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_top_brands int default 12,
    p_top_rtos int default 20
)
returns table (
    brand_name text,
    rto_code text,
    rto_name text,
    units bigint,
    share_in_rto_pct numeric,
    share_in_brand_pct numeric
)
language sql
stable
as $$
    with rb as (
        select
            f.brand_name,
            f.rto_code,
            f.rto_name,
            sum(f.units)::bigint as units
        from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, null, null) f
        group by 1, 2, 3
    ),
    top_b as (
        select brand_name
        from rb
        group by 1
        order by sum(units) desc
        limit greatest(coalesce(p_top_brands, 12), 1)
    ),
    top_r as (
        select rto_code
        from rb
        group by 1
        order by sum(units) desc
        limit greatest(coalesce(p_top_rtos, 20), 1)
    ),
    f as (
        select rb.*
        from rb
        join top_b on top_b.brand_name = rb.brand_name
        join top_r on top_r.rto_code = rb.rto_code
    ),
    rto_tot as (
        select rto_code, sum(units)::numeric as total_units
        from f
        group by 1
    ),
    brand_tot as (
        select brand_name, sum(units)::numeric as total_units
        from f
        group by 1
    )
    select
        f.brand_name,
        f.rto_code,
        f.rto_name,
        f.units,
        case when rt.total_units > 0 then round((f.units::numeric / rt.total_units) * 100, 2) else 0 end as share_in_rto_pct,
        case when bt.total_units > 0 then round((f.units::numeric / bt.total_units) * 100, 2) else 0 end as share_in_brand_pct
    from f
    join rto_tot rt on rt.rto_code = f.rto_code
    join brand_tot bt on bt.brand_name = f.brand_name
    order by f.brand_name, f.units desc;
$$;

-- 14) Selected RTO: brand mix
create or replace function public.vahan_rto_brand_mix(
    p_state_code text,
    p_rto_code text,
    p_from_month date,
    p_to_month date,
    p_top_n int default 20
)
returns table (
    brand_name text,
    units bigint,
    share_pct numeric
)
language sql
stable
as $$
    with b as (
        select
            f.brand_name,
            sum(f.units)::bigint as units
        from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_code, null) f
        group by 1
    ),
    t as (
        select coalesce(sum(units), 0)::numeric as total_units from b
    )
    select
        b.brand_name,
        b.units,
        case when t.total_units > 0 then round((b.units::numeric / t.total_units) * 100, 2) else 0 end as share_pct
    from b
    cross join t
    order by b.units desc
    limit greatest(coalesce(p_top_n, 20), 1);
$$;

-- 15) Selected RTO timeline
create or replace function public.vahan_selected_rto_timeline(
    p_state_code text,
    p_rto_code text,
    p_from_month date,
    p_to_month date,
    p_grain text default 'month'
)
returns table (
    period_start date,
    units bigint
)
language sql
stable
as $$
    select
        public.vahan_period_bucket(f.month_start, p_grain) as period_start,
        sum(f.units)::bigint as units
    from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_code, null) f
    group by 1
    order by 1;
$$;

-- 16) Selected brand timeline
create or replace function public.vahan_selected_brand_timeline(
    p_state_code text,
    p_brand_name text,
    p_from_month date,
    p_to_month date,
    p_grain text default 'month',
    p_rto_code text default null
)
returns table (
    period_start date,
    units bigint
)
language sql
stable
as $$
    select
        public.vahan_period_bucket(f.month_start, p_grain) as period_start,
        sum(f.units)::bigint as units
    from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_code, p_brand_name) f
    group by 1
    order by 1;
$$;

-- 17) Selected brand RTO spread
create or replace function public.vahan_selected_brand_rto_spread(
    p_state_code text,
    p_brand_name text,
    p_from_month date,
    p_to_month date,
    p_top_n int default 25
)
returns table (
    rto_code text,
    rto_name text,
    units bigint,
    share_pct numeric
)
language sql
stable
as $$
    with r as (
        select
            f.rto_code,
            f.rto_name,
            sum(f.units)::bigint as units
        from public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, null, p_brand_name) f
        group by 1, 2
    ),
    t as (
        select coalesce(sum(units), 0)::numeric as total_units from r
    )
    select
        r.rto_code,
        r.rto_name,
        r.units,
        case when t.total_units > 0 then round((r.units::numeric / t.total_units) * 100, 2) else 0 end as share_pct
    from r
    cross join t
    order by r.units desc
    limit greatest(coalesce(p_top_n, 25), 1);
$$;
