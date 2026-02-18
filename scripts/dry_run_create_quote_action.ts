import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

type Verdict = { name: string; pass: boolean; detail?: string };

async function main() {
    const results: Verdict[] = [];

    const { data: dealer } = await supabase
        .from('id_tenants')
        .select('id, name, studio_id')
        .eq('type', 'DEALER')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const { data: sku } = await supabase
        .from('cat_skus')
        .select('id, vehicle_variant_id, color_name')
        .eq('status', 'ACTIVE')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const { data: price } = await supabase
        .from('cat_price_state_mh')
        .select('sku_id, ex_showroom, on_road_price, rto_total_state, ins_gross_premium')
        .eq('sku_id', sku?.id || '')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const { data: lead } = await supabase
        .from('crm_leads')
        .select('id, customer_id')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!dealer || !sku || !lead) {
        console.error('Missing seed data for dry run. Need active dealer + sku + lead.');
        process.exit(1);
    }

    const missingChecks = {
        dealer: !dealer?.id,
        color: !(sku?.color_name || sku?.id),
        pricing_snapshot: !price,
        ex_showroom: !(price?.ex_showroom && Number(price.ex_showroom) > 0),
    };

    results.push({
        name: 'Validation: dealer present',
        pass: !missingChecks.dealer,
        detail: missingChecks.dealer ? 'dealer missing' : dealer.id,
    });
    results.push({
        name: 'Validation: color present',
        pass: !missingChecks.color,
        detail: missingChecks.color ? 'color missing' : String(sku.color_name || sku.id),
    });
    results.push({
        name: 'Validation: pricing snapshot present',
        pass: !missingChecks.pricing_snapshot,
        detail: missingChecks.pricing_snapshot ? 'price row missing' : `sku=${sku.id}`,
    });
    results.push({
        name: 'Validation: ex_showroom > 0',
        pass: !missingChecks.ex_showroom,
        detail: `ex_showroom=${Number(price?.ex_showroom || 0)}`,
    });

    // Emulate createQuoteAction DB insert path (service-role dry smoke).
    let createdQuoteId: string | null = null;
    try {
        const { data: inserted, error } = await supabase
            .from('crm_quotes')
            .insert({
                tenant_id: dealer.id,
                lead_id: lead.id,
                member_id: lead.customer_id || null,
                variant_id: sku.vehicle_variant_id,
                color_id: sku.id,
                vehicle_sku_id: sku.id,
                status: 'DRAFT',
                ex_showroom_price: Number(price?.ex_showroom || 0),
                on_road_price: Number(price?.on_road_price || 0),
                rto_amount: Number(price?.rto_total_state || 0),
                insurance_amount: Number(price?.ins_gross_premium || 0),
                accessories_amount: 0,
                snap_brand: 'DRYRUN',
                snap_model: 'DRYRUN',
                snap_variant: 'DRYRUN',
                snap_color: sku.color_name || 'DRYRUN',
                snap_dealer_name: dealer.name || 'DRYRUN',
                commercials: {
                    brand: 'DRYRUN',
                    model: 'DRYRUN',
                    variant: 'DRYRUN',
                    color_name: sku.color_name || 'DRYRUN',
                    base_price: Number(price?.ex_showroom || 0),
                    grand_total: Number(price?.on_road_price || 0),
                    pricing_snapshot: {
                        ex_showroom: Number(price?.ex_showroom || 0),
                        rto_total: Number(price?.rto_total_state || 0),
                        insurance_total: Number(price?.ins_gross_premium || 0),
                    },
                    dealer: {
                        dealer_id: dealer.id,
                        dealer_name: dealer.name,
                        studio_id: dealer.studio_id,
                    },
                },
            })
            .select('id, display_id')
            .single();

        if (error) {
            results.push({
                name: 'Insert dry run',
                pass: false,
                detail: error.message,
            });
        } else {
            createdQuoteId = inserted.id;
            results.push({
                name: 'Insert dry run',
                pass: true,
                detail: `quote_id=${inserted.id}, display_id=${inserted.display_id}`,
            });
        }
    } finally {
        if (createdQuoteId) {
            await supabase.from('crm_quotes').delete().eq('id', createdQuoteId);
            results.push({
                name: 'Cleanup',
                pass: true,
                detail: `deleted=${createdQuoteId}`,
            });
        }
    }

    const failed = results.filter(r => !r.pass);
    console.log('\n=== createQuoteAction Dry Harness ===');
    for (const r of results) {
        console.log(`${r.pass ? '✅' : '❌'} ${r.name}${r.detail ? ` -> ${r.detail}` : ''}`);
    }
    if (failed.length > 0) process.exit(1);
}

main().catch(err => {
    console.error('Dry harness failed:', err);
    process.exit(1);
});
