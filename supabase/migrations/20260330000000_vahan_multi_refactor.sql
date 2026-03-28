-- -----------------------------------------------------------------------------
-- REFACTOR VAHAN INTELLIGENCE RPCS FOR MULTI-SELECT & DATA FIDELITY
-- -----------------------------------------------------------------------------

-- Drop old signatures
DROP FUNCTION IF EXISTS public.vahan_monthly_fact(text, date, date, text, text);
DROP FUNCTION IF EXISTS public.vahan_kpi_summary(text, date, date, text, text);
DROP FUNCTION IF EXISTS public.vahan_state_timeline(text, date, date, text, text, text);
DROP FUNCTION IF EXISTS public.vahan_rto_share(text, date, date, text, int);
DROP FUNCTION IF EXISTS public.vahan_brand_share(text, date, date, text, int);
DROP FUNCTION IF EXISTS public.vahan_brand_trend(text, date, date, text, text, int);

-- 1) Monthly Fact Helper (Multi-Select + Robust Brand Matching)
CREATE OR REPLACE FUNCTION public.vahan_monthly_fact(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_rto_codes text[] default null,
    p_brand_names text[] default null
)
RETURNS TABLE (
    state_code text,
    rto_code text,
    rto_name text,
    brand_name text,
    month_start date,
    units bigint
) LANGUAGE sql STABLE AS $$
    SELECT
        m.state_code,
        COALESCE(m.rto_code, 'ALL'),
        COALESCE(m.rto_name, 'All'),
        COALESCE(NULLIF(m.brand_name, ''), m.maker),
        make_date(m.year, m.month_no, 1),
        m.units::bigint
    FROM public.vahan_two_wheeler_monthly_uploads m
    WHERE m.state_code = p_state_code
      AND (m.year, m.month_no) >= (EXTRACT(YEAR FROM p_from_month)::int, EXTRACT(MONTH FROM p_from_month)::int)
      AND (m.year, m.month_no) <= (EXTRACT(YEAR FROM p_to_month)::int, EXTRACT(MONTH FROM p_to_month)::int)
      AND (p_rto_codes IS NULL OR p_rto_codes = '{}' OR m.rto_code = ANY(p_rto_codes))
      AND (p_brand_names IS NULL OR p_brand_names = '{}' OR 
           UPPER(COALESCE(NULLIF(m.brand_name, ''), m.maker)) = ANY(
               SELECT UPPER(b) FROM unnest(p_brand_names) b
           )
      );
$$;

-- 2) KPI Summary (Correct MoM/YoY Calculation)
CREATE OR REPLACE FUNCTION public.vahan_kpi_summary(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_rto_codes text[] default null,
    p_brand_names text[] default null
)
RETURNS TABLE (
    total_units bigint,
    prev_period_units bigint,
    yoy_units bigint,
    prev_period_pct numeric,
    yoy_pct numeric
)
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_months int;
    v_prev_from date; v_prev_to date;
    v_yoy_from date; v_yoy_to date;
    v_cur bigint; v_prev bigint; v_yoy bigint;
BEGIN
    -- Calculate interval length in months
    v_months := GREATEST(1, (EXTRACT(YEAR FROM AGE(p_to_month, p_from_month))::int * 12 + EXTRACT(MONTH FROM AGE(p_to_month, p_from_month))::int + 1));
    
    -- Date ranges
    v_prev_from := (date_trunc('month', p_from_month) - MAKE_INTERVAL(months => v_months))::date;
    v_prev_to := (date_trunc('month', p_to_month) - MAKE_INTERVAL(months => v_months))::date;
    v_yoy_from := (date_trunc('month', p_from_month) - INTERVAL '1 year')::date;
    v_yoy_to := (date_trunc('month', p_to_month) - INTERVAL '1 year')::date;

    -- Unit Aggregations
    SELECT COALESCE(SUM(units), 0) INTO v_cur FROM public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_codes, p_brand_names);
    SELECT COALESCE(SUM(units), 0) INTO v_prev FROM public.vahan_monthly_fact(p_state_code, v_prev_from, v_prev_to, p_rto_codes, p_brand_names);
    SELECT COALESCE(SUM(units), 0) INTO v_yoy FROM public.vahan_monthly_fact(p_state_code, v_yoy_from, v_yoy_to, p_rto_codes, p_brand_names);

    RETURN QUERY
    SELECT 
        v_cur, v_prev, v_yoy,
        CASE WHEN v_prev > 0 THEN ROUND(((v_cur - v_prev)::numeric / v_prev::numeric) * 100, 2) ELSE NULL END,
        CASE WHEN v_yoy > 0 THEN ROUND(((v_cur - v_yoy)::numeric / v_yoy::numeric) * 100, 2) ELSE NULL END;
END;
$$;

-- 3) State Timeline
CREATE OR REPLACE FUNCTION public.vahan_state_timeline(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_grain text default 'month',
    p_rto_codes text[] default null,
    p_brand_names text[] default null
)
RETURNS TABLE (period_start date, units bigint) LANGUAGE sql STABLE AS $$
    SELECT 
        public.vahan_period_bucket(month_start, p_grain), 
        SUM(units)::bigint
    FROM public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_codes, p_brand_names)
    GROUP BY 1 ORDER BY 1;
$$;

-- 4) RTO Share
CREATE OR REPLACE FUNCTION public.vahan_rto_share(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_brand_names text[] default null,
    p_top_n int default 20
)
RETURNS TABLE (rto_code text, rto_name text, units bigint, share_pct numeric) LANGUAGE sql STABLE AS $$
    WITH s AS (
        SELECT rto_code, rto_name, SUM(units)::bigint as u 
        FROM public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, null, p_brand_names) 
        GROUP BY 1, 2
    ), t AS (SELECT COALESCE(SUM(u), 0)::numeric as tot FROM s)
    SELECT 
        rto_code, rto_name, u, 
        CASE WHEN tot > 0 THEN ROUND((u::numeric / tot) * 100, 2) ELSE 0 END
    FROM s CROSS JOIN t 
    ORDER BY u DESC LIMIT p_top_n;
$$;

-- 5) Brand Share
CREATE OR REPLACE FUNCTION public.vahan_brand_share(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_rto_codes text[] default null,
    p_top_n int default 50
)
RETURNS TABLE (brand_name text, units bigint, share_pct numeric) LANGUAGE sql STABLE AS $$
    WITH b AS (
        SELECT brand_name, SUM(units)::bigint as u 
        FROM public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_codes, null) 
        GROUP BY 1
    ), t AS (SELECT COALESCE(SUM(u), 0)::numeric as tot FROM b)
    SELECT 
        brand_name, u, 
        CASE WHEN tot > 0 THEN ROUND((u::numeric / tot) * 100, 2) ELSE 0 END
    FROM b CROSS JOIN t 
    ORDER BY u DESC LIMIT p_top_n;
$$;

-- 6) Drop and Recreate others (Trend, Growth, Matrix) to ensure compatibility
DROP FUNCTION IF EXISTS public.vahan_brand_trend(text, date, date, text, text[], int);
CREATE OR REPLACE FUNCTION public.vahan_brand_trend(
    p_state_code text,
    p_from_month date,
    p_to_month date,
    p_grain text default 'month',
    p_rto_codes text[] default null,
    p_top_n int default 12
)
RETURNS TABLE (brand_name text, period_start date, units bigint) LANGUAGE sql STABLE AS $$
    WITH top_b AS (
        SELECT brand_name, SUM(units) as u 
        FROM public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_codes, null) 
        GROUP BY 1 ORDER BY 2 DESC LIMIT p_top_n
    )
    SELECT 
        f.brand_name, 
        public.vahan_period_bucket(f.month_start, p_grain), 
        SUM(f.units)::bigint
    FROM public.vahan_monthly_fact(p_state_code, p_from_month, p_to_month, p_rto_codes, null) f
    JOIN top_b ON top_b.brand_name = f.brand_name
    GROUP BY 1, 2 ORDER BY 2, 1;
$$;
