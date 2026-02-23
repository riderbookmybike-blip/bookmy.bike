-- Smoke lifecycle (non-destructive, creates tagged test data)
-- Flow: marketplace lead + crm lead -> quote -> booking -> inv request -> dealer quote -> PO
-- -> partial vendor payment -> stock receiving -> customer receipt -> allotment -> booking stage update

create temp table if not exists smoke_run (
  smoke_result jsonb not null
) on commit drop;

truncate table smoke_run;

with ctx as (
  select
    coalesce(
      (
        select tenant_id
        from public.id_locations
        where coalesce(is_active, true) = true
        order by created_at asc
        limit 1
      ),
      (select id from public.id_tenants order by created_at asc limit 1)
    )::uuid as tenant_id,
    coalesce(
      (
        select id
        from public.id_tenants
        where id <> coalesce(
          (
            select tenant_id
            from public.id_locations
            where coalesce(is_active, true) = true
            order by created_at asc
            limit 1
          ),
          (select id from public.id_tenants order by created_at asc limit 1)
        )
        order by created_at asc
        limit 1
      ),
      coalesce(
        (
          select tenant_id
          from public.id_locations
          where coalesce(is_active, true) = true
          order by created_at asc
          limit 1
        ),
        (select id from public.id_tenants order by created_at asc limit 1)
      )
    )::uuid as dealer_tenant_id,
    coalesce(
      (
        select id
        from public.id_locations
        where tenant_id = coalesce(
          (
            select tenant_id
            from public.id_locations
            where coalesce(is_active, true) = true
            order by created_at asc
            limit 1
          ),
          (select id from public.id_tenants order by created_at asc limit 1)
        )
          and coalesce(is_active, true) = true
        order by created_at asc
        limit 1
      ),
      (select id from public.id_locations order by created_at asc limit 1)
    )::uuid as location_id,
    coalesce(
      (
        select t.user_id
        from public.id_team t
        join auth.users u on u.id = t.user_id
        where t.tenant_id = coalesce(
          (
            select tenant_id
            from public.id_locations
            where coalesce(is_active, true) = true
            order by created_at asc
            limit 1
          ),
          (select id from public.id_tenants order by created_at asc limit 1)
        )
          and coalesce(t.status, 'ACTIVE') <> 'INACTIVE'
        order by t.created_at asc
        limit 1
      ),
      (select id from auth.users order by created_at asc limit 1)
    )::uuid as actor_user_id,
    (
      select id
      from public.cat_skus
      where sku_type = 'VEHICLE'
        and status = 'ACTIVE'
      order by created_at asc
      limit 1
    )::uuid as sku_id,
    (
      select vehicle_variant_id
      from public.cat_skus
      where sku_type = 'VEHICLE'
        and status = 'ACTIVE'
        and vehicle_variant_id is not null
      order by created_at asc
      limit 1
    )::uuid as variant_id,
    to_char(now(),'YYYYMMDDHH24MISS') as run_tag
),
lead_market as (
  insert into crm_leads (
    tenant_id,
    owner_tenant_id,
    selected_dealer_tenant_id,
    customer_name,
    customer_phone,
    source,
    status,
    notes,
    customer_pincode,
    utm_source
  )
  select
    tenant_id,
    tenant_id,
    dealer_tenant_id,
    'Smoke Marketplace '||run_tag,
    '9' || right(run_tag, 9),
    'PDP_QUICK_QUOTE',
    'NEW',
    'smoke_full_lifecycle',
    '401208',
    'PDP_QUICK_QUOTE'
  from ctx
  returning id, display_id, tenant_id, owner_tenant_id, created_at, source
),
lead_crm as (
  insert into crm_leads (
    tenant_id,
    owner_tenant_id,
    selected_dealer_tenant_id,
    customer_name,
    customer_phone,
    source,
    status,
    notes,
    customer_pincode,
    utm_source
  )
  select
    tenant_id,
    tenant_id,
    dealer_tenant_id,
    'Smoke CRM '||run_tag,
    '8' || right(run_tag, 9),
    'CRM_MANUAL',
    'NEW',
    'smoke_full_lifecycle',
    '401208',
    'CRM_MANUAL'
  from ctx
  returning id, display_id, tenant_id, owner_tenant_id, created_at, source
),
quote_market as (
  insert into crm_quotes (
    tenant_id,
    lead_id,
    variant_id,
    vehicle_sku_id,
    status,
    on_road_price,
    ex_showroom_price,
    finance_mode,
    booking_amount_paid,
    snap_brand,
    snap_model,
    snap_variant,
    snap_color
  )
  select
    lm.owner_tenant_id,
    lm.id,
    ctx.variant_id,
    ctx.sku_id::text,
    'IN_REVIEW',
    125000,
    110000,
    'CASH',
    true,
    'TVS',
    'Jupiter',
    'Drum',
    'Grey'
  from lead_market lm
  cross join ctx
  returning id, display_id, lead_id, tenant_id, status, variant_id, created_at
),
quote_crm as (
  insert into crm_quotes (
    tenant_id,
    lead_id,
    variant_id,
    vehicle_sku_id,
    status,
    on_road_price,
    ex_showroom_price,
    finance_mode,
    booking_amount_paid,
    snap_brand,
    snap_model,
    snap_variant,
    snap_color
  )
  select
    lc.owner_tenant_id,
    lc.id,
    ctx.variant_id,
    ctx.sku_id::text,
    'IN_REVIEW',
    129500,
    114500,
    'CASH',
    false,
    'TVS',
    'Jupiter',
    'ZX',
    'Blue'
  from lead_crm lc
  cross join ctx
  returning id, display_id, lead_id, tenant_id, status, variant_id, created_at
),
booking_market as (
  insert into crm_bookings (
    tenant_id,
    quote_id,
    lead_id,
    status,
    operational_stage,
    booking_amount_received,
    grand_total,
    base_price,
    sku_id,
    qty,
    delivery_branch_id,
    customer_details,
    vehicle_details
  )
  select
    qm.tenant_id,
    qm.id,
    lm.id,
    'BOOKED',
    'BOOKING',
    5000,
    125000,
    110000,
    ctx.sku_id,
    1,
    ctx.location_id,
    json_build_object('name','Smoke Marketplace Customer','phone','9' || right(ctx.run_tag, 9)),
    json_build_object('brand','TVS','model','Jupiter','variant','Drum')
  from quote_market qm
  join lead_market lm on lm.id = qm.lead_id
  cross join ctx
  returning id, display_id, quote_id, tenant_id, status, operational_stage, created_at
),
booking_crm as (
  insert into crm_bookings (
    tenant_id,
    quote_id,
    lead_id,
    status,
    operational_stage,
    booking_amount_received,
    grand_total,
    base_price,
    sku_id,
    qty,
    delivery_branch_id,
    customer_details,
    vehicle_details
  )
  select
    qc.tenant_id,
    qc.id,
    lc.id,
    'BOOKED',
    'BOOKING',
    0,
    129500,
    114500,
    ctx.sku_id,
    1,
    ctx.location_id,
    json_build_object('name','Smoke CRM Customer','phone','8' || right(ctx.run_tag, 9)),
    json_build_object('brand','TVS','model','Jupiter','variant','ZX')
  from quote_crm qc
  join lead_crm lc on lc.id = qc.lead_id
  cross join ctx
  returning id, display_id, quote_id, tenant_id, status, operational_stage, created_at
),
request_market as (
  insert into inv_requests (tenant_id, booking_id, sku_id, source_type, status, delivery_branch_id)
  select bm.tenant_id, bm.id, ctx.sku_id, 'BOOKING', 'QUOTING', ctx.location_id
  from booking_market bm
  cross join ctx
  returning id, display_id, booking_id, tenant_id, status
),
request_item as (
  insert into inv_request_items (request_id, cost_type, expected_amount, description)
  select rm.id, 'EX_SHOWROOM', 110000, 'smoke ex-showroom'
  from request_market rm
  returning id, request_id
),
dealer_quote as (
  insert into inv_dealer_quotes (request_id, dealer_tenant_id, bundled_item_ids, bundled_amount, expected_total, transport_amount, status)
  select rm.id, ctx.dealer_tenant_id, '{}'::uuid[], 112000, 110000, 3000, 'SELECTED'
  from request_market rm
  cross join ctx
  returning id, request_id, dealer_tenant_id, expected_total, bundled_amount
),
po as (
  insert into inv_purchase_orders (request_id, quote_id, dealer_tenant_id, total_po_value, payment_status, po_status, transporter_name, docket_number)
  select dq.request_id, dq.id, dq.dealer_tenant_id, 115000, 'PARTIAL_PAID', 'RECEIVED', 'Smoke Logistics', 'SMK-'||right((select run_tag from ctx),6)
  from dealer_quote dq
  returning id, display_id, request_id, quote_id, payment_status, po_status, total_po_value
),
vendor_payment as (
  insert into inv_po_payments (po_id, amount_paid, payment_date)
  select po.id, 30000, now()
  from po
  returning id, po_id, amount_paid, payment_date
),
received_stock as (
  insert into inv_stock (tenant_id, po_id, sku_id, branch_id, chassis_number, engine_number, media_chassis_url, media_engine_url, media_qc_video_url, qc_status, status, is_shared)
  select ctx.tenant_id, po.id, ctx.sku_id, ctx.location_id,
    'SMKCH'||right(ctx.run_tag,10),
    'SMKEN'||right(ctx.run_tag,10),
    'https://example.com/chassis.jpg',
    'https://example.com/engine.jpg',
    'https://example.com/qc.mp4',
    'PASSED',
    'AVAILABLE',
    false
  from po
  cross join ctx
  returning id, po_id, sku_id, status, qc_status, chassis_number, engine_number
),
mark_request_received as (
  update inv_requests r
  set status='RECEIVED', updated_at=now()
  from request_market rm
  where r.id = rm.id
  returning r.id, r.status
),
booking_receipt as (
  insert into crm_receipts (booking_id, lead_id, tenant_id, amount, currency, method, status, transaction_id, provider_data)
  select bm.id, lm.id, bm.tenant_id, 5000, 'INR', 'UPI', 'SUCCESS', 'SMKRCPT'||right((select run_tag from ctx),8), '{"source":"smoke_test","flow":"INFLOW"}'
  from booking_market bm
  join quote_market qm on qm.id = bm.quote_id
  join lead_market lm on lm.id = qm.lead_id
  returning id, display_id, booking_id, amount, status, created_at
),
allotment as (
  insert into crm_allotments (tenant_id, booking_id, inv_stock_id, vin_number, chassis_number, engine_number, status)
  select bm.tenant_id, bm.id, rs.id, rs.chassis_number, rs.chassis_number, rs.engine_number, 'HARD_LOCK'
  from booking_market bm
  join received_stock rs on true
  returning id, booking_id, inv_stock_id, status, vin_number, engine_number, created_at
),
auth_claim as (
  select set_config('request.jwt.claim.sub', (select actor_user_id::text from ctx limit 1), true) as claim_sub
),
stage_payment as (
  select transition_booking_stage(
    (select id from booking_market limit 1),
    'PAYMENT'::public.crm_operational_stage,
    'smoke_full_lifecycle_payment'
  ) as transition_result
  from auth_claim
),
stage_allotment as (
  select transition_booking_stage(
    (select id from booking_market limit 1),
    'ALLOTMENT'::public.crm_operational_stage,
    'smoke_full_lifecycle_allotment'
  ) as transition_result
  from auth_claim
)
insert into smoke_run (smoke_result)
select jsonb_build_object(
  'run_tag', (select run_tag from ctx),
  'lead_market', (select row_to_json(lead_market) from lead_market),
  'lead_crm', (select row_to_json(lead_crm) from lead_crm),
  'quote_market', (select row_to_json(quote_market) from quote_market),
  'quote_crm', (select row_to_json(quote_crm) from quote_crm),
  'booking_market', (select row_to_json(booking_market) from booking_market),
  'booking_crm', (select row_to_json(booking_crm) from booking_crm),
  'inv_request', (select row_to_json(request_market) from request_market),
  'inv_dealer_quote', (select row_to_json(dealer_quote) from dealer_quote),
  'inv_po', (select row_to_json(po) from po),
  'vendor_payment', (select row_to_json(vendor_payment) from vendor_payment),
  'received_stock', (select row_to_json(received_stock) from received_stock),
  'booking_receipt', (select row_to_json(booking_receipt) from booking_receipt),
  'allotment', (select row_to_json(allotment) from allotment),
  'stage_payment', (select stage_payment.transition_result from stage_payment),
  'stage_allotment', (select stage_allotment.transition_result from stage_allotment),
  'booking_stage_update', (select stage_allotment.transition_result from stage_allotment)
);

select smoke_result from smoke_run;
