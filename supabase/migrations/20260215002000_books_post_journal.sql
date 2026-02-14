-- post_journal_entry: inserts a balanced journal entry with lines
-- Usage example:
-- SELECT post_journal_entry(
--     'tenant-uuid', '2026-02-14', 'Receipt from customer',
--     '[{"account_id":"...","dr":1000,"cr":0,"description":"Bank"},{"account_id":"...","dr":0,"cr":1000,"description":"Revenue"}]'::jsonb,
--     'RECEIPT', NULL
-- );

begin;

create or replace function public.post_journal_entry(
    p_tenant_id uuid,
    p_entry_date date,
    p_memo text,
    p_lines jsonb,
    p_source_type text default null,
    p_source_id uuid default null,
    p_created_by uuid default auth.uid()
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_entry_id uuid;
    v_total_dr numeric := 0;
    v_total_cr numeric := 0;
    v_line jsonb;
    v_account_id uuid;
    v_dr numeric;
    v_cr numeric;
begin
    if p_lines is null or jsonb_typeof(p_lines) <> 'array' then
        raise exception 'p_lines must be a JSON array of line items';
    end if;

    -- Validate lines, sum DR/CR, and ensure accounts belong to tenant
    for v_line in select * from jsonb_array_elements(p_lines) loop
        v_account_id := (v_line->>'account_id')::uuid;
        v_dr := coalesce((v_line->>'dr')::numeric,0);
        v_cr := coalesce((v_line->>'cr')::numeric,0);

        if v_account_id is null then
            raise exception 'account_id is required in each line';
        end if;
        if v_dr < 0 or v_cr < 0 then
            raise exception 'dr/cr must be non-negative';
        end if;
        if v_dr = 0 and v_cr = 0 then
            raise exception 'each line must have either dr or cr amount';
        end if;

        -- tenant ownership check
        perform 1 from public.accounts where id = v_account_id and tenant_id = p_tenant_id;
        if not found then
            raise exception 'account % does not belong to tenant %', v_account_id, p_tenant_id;
        end if;

        v_total_dr := v_total_dr + v_dr;
        v_total_cr := v_total_cr + v_cr;
    end loop;

    if round(v_total_dr,2) <> round(v_total_cr,2) then
        raise exception 'journal not balanced: total DR % <> total CR %', v_total_dr, v_total_cr;
    end if;

    insert into public.journal_entries (tenant_id, entry_date, memo, source_type, source_id, created_by)
    values (p_tenant_id, coalesce(p_entry_date, current_date), p_memo, p_source_type, p_source_id, p_created_by)
    returning id into v_entry_id;

    -- Insert lines
    for v_line in select * from jsonb_array_elements(p_lines) loop
        v_account_id := (v_line->>'account_id')::uuid;
        v_dr := coalesce((v_line->>'dr')::numeric,0);
        v_cr := coalesce((v_line->>'cr')::numeric,0);
        insert into public.journal_lines (entry_id, account_id, description, dr_amount, cr_amount)
        values (
            v_entry_id,
            v_account_id,
            v_line->>'description',
            v_dr,
            v_cr
        );
    end loop;

    return v_entry_id;
end;
$$;

comment on function public.post_journal_entry is 'Creates a balanced journal entry for a tenant from JSON lines; enforces DR=CR.';

commit;
