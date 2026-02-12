import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const apply = process.argv.includes('--apply');
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 500;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
});

const normalizeAddonKey = (val: any) =>
    String(val || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const buildRuleAddonMap = async (stateCode: string, baseExShowroom: number, gstRate: number) => {
    const { data: insuranceRuleData } = await supabase
        .from('cat_ins_rules')
        .select('*')
        .eq('status', 'ACTIVE')
        .eq('vehicle_type', 'TWO_WHEELER')
        .or(`state_code.eq.${stateCode},state_code.eq.ALL`)
        .order('state_code', { ascending: false })
        .limit(1);

    const insuranceRule: any = insuranceRuleData?.[0];
    const map = new Map<string, any>();

    (insuranceRule?.addons || []).forEach((a: any) => {
        const inclusionType = a.inclusion_type || a.inclusionType || 'OPTIONAL';
        const baseAmount =
            a.type === 'FIXED'
                ? a.amount || 0
                : Math.round(((a.percentage || 0) * (a.basis === 'EX_SHOWROOM' ? baseExShowroom : 100000)) / 100);
        const priceWithGst = Math.round(baseAmount + (baseAmount * gstRate) / 100);
        const gstAmount = Math.max(0, priceWithGst - baseAmount);

        const item = {
            id: a.id,
            name: a.label,
            price: priceWithGst,
            breakdown: [
                { label: 'Base Premium', amount: baseAmount },
                { label: `GST (${gstRate}%)`, amount: gstAmount },
            ],
            isMandatory: inclusionType === 'MANDATORY',
            inclusionType,
        };

        map.set(normalizeAddonKey(item.id), item);
        map.set(normalizeAddonKey(item.name), item);
    });

    return map;
};

const fetchInsuranceJson = async (colorId: string, stateCode: string, district?: string | null) => {
    const { data } = await supabase
        .from('cat_price_state')
        .select('insurance')
        .eq('vehicle_color_id', colorId)
        .eq('state_code', stateCode)
        .or(`district.eq.${district || 'ALL'},district.eq.ALL`)
        .order('district', { ascending: false })
        .limit(1)
        .maybeSingle();
    return data?.insurance || null;
};

const main = async () => {
    const { data: quotes, error } = await supabase
        .from('crm_quotes')
        .select('id, display_id, color_id, variant_id, commercials')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Failed to fetch quotes:', error);
        process.exit(1);
    }

    let scanned = 0;
    let patched = 0;

    for (const quote of quotes || []) {
        scanned += 1;
        const commercials: any = quote.commercials || {};
        const pricing = commercials.pricing_snapshot || {};
        const addonItems: any[] = pricing.insurance_addon_items || [];
        const selectedIds = new Set((pricing.insurance_addons || []).map((id: any) => String(id)));

        if (addonItems.length === 0 || selectedIds.size === 0) continue;

        const hasMissing = addonItems.some(
            item => selectedIds.has(String(item.id)) && !Number(item.price ?? item.discountPrice ?? item.amount ?? 0)
        );

        if (!hasMissing) continue;

        const stateCode = pricing?.location?.state_code || pricing?.location?.stateCode;
        const district = pricing?.location?.district || null;
        const colorId = quote.color_id || quote.variant_id || pricing?.color_id;
        if (!stateCode || !colorId) continue;

        const insuranceJson = await fetchInsuranceJson(colorId, stateCode, district);
        const gstRate = Number(insuranceJson?.gst_rate ?? pricing?.insurance_gst_rate ?? 18);
        const ruleMap = await buildRuleAddonMap(stateCode, Number(pricing.ex_showroom || 0), gstRate);

        const jsonAddons = (insuranceJson?.addons || []) as any[];
        const jsonMap = new Map<string, any>();
        jsonAddons.forEach(addon => {
            const total = Number(addon.total ?? (addon.price || 0) + (addon.gst || 0));
            const item = {
                price: total,
                breakdown: [
                    { label: 'Base Premium', amount: addon.price },
                    { label: `GST (${gstRate}%)`, amount: addon.gst },
                ],
            };
            jsonMap.set(normalizeAddonKey(addon.id), item);
            jsonMap.set(normalizeAddonKey(addon.label), item);
        });

        let changed = false;
        const updatedItems = addonItems.map(item => {
            if (!selectedIds.has(String(item.id))) return item;

            const current = Number(item.price ?? item.discountPrice ?? item.amount ?? 0);
            if (current > 0) return item;

            const jsonMatch = jsonMap.get(normalizeAddonKey(item.id)) || jsonMap.get(normalizeAddonKey(item.name));
            const ruleMatch = ruleMap.get(normalizeAddonKey(item.id)) || ruleMap.get(normalizeAddonKey(item.name));
            const resolvedPrice = Number(jsonMatch?.price || ruleMatch?.price || 0);
            if (resolvedPrice <= 0) return item;

            changed = true;
            return {
                ...item,
                price: resolvedPrice,
                discountPrice: item.discountPrice ?? 0,
                breakdown:
                    item.breakdown && item.breakdown.length > 0
                        ? item.breakdown
                        : jsonMatch?.breakdown || ruleMatch?.breakdown,
            };
        });

        if (!changed) continue;

        patched += 1;
        if (apply) {
            const updatedCommercials = {
                ...commercials,
                pricing_snapshot: {
                    ...pricing,
                    insurance_addon_items: updatedItems,
                },
            };

            const { error: updateError } = await supabase
                .from('crm_quotes')
                .update({ commercials: updatedCommercials })
                .eq('id', quote.id);

            if (updateError) {
                console.error(`Update failed for ${quote.display_id}:`, updateError.message);
            }
        } else {
            console.log(`[dry-run] would patch: ${quote.display_id}`);
        }
    }

    console.log(`Scanned: ${scanned}, Matched: ${patched}, Apply: ${apply}`);
};

main().catch(err => {
    console.error(err);
    process.exit(1);
});
