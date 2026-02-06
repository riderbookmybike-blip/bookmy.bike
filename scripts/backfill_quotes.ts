import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE env vars in .env.local');
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type QuoteRow = {
    id: string;
    tenant_id: string | null;
    variant_id: string | null;
    color_id: string | null;
    commercials: any;
    ex_showroom_price: number | null;
    rto_amount: number | null;
    insurance_amount: number | null;
    accessories_amount: number | null;
    on_road_price: number | null;
};

const tenantCache = new Map<string, { id: string; name: string; studio_id: string | null } | null>();
const variantCache = new Map<string, { id: string; name: string; parent_id: string | null } | null>();
const modelCache = new Map<string, { id: string; name: string; brand_id: string | null } | null>();
const brandCache = new Map<string, { id: string; name: string } | null>();
const colorCache = new Map<string, { id: string; name: string; specs: any; image_url: string | null } | null>();

async function getTenant(id: string) {
    if (tenantCache.has(id)) return tenantCache.get(id) || null;
    const { data } = await supabase.from('id_tenants').select('id, name, studio_id').eq('id', id).maybeSingle();
    tenantCache.set(id, data || null);
    return data || null;
}

async function getVariant(id: string) {
    if (variantCache.has(id)) return variantCache.get(id) || null;
    const { data } = await supabase.from('cat_items').select('id, name, parent_id').eq('id', id).maybeSingle();
    variantCache.set(id, data || null);
    return data || null;
}

async function getModel(id: string) {
    if (modelCache.has(id)) return modelCache.get(id) || null;
    const { data } = await supabase.from('cat_items').select('id, name, brand_id').eq('id', id).maybeSingle();
    modelCache.set(id, data || null);
    return data || null;
}

async function getBrand(id: string) {
    if (brandCache.has(id)) return brandCache.get(id) || null;
    const { data } = await supabase.from('cat_brands').select('id, name').eq('id', id).maybeSingle();
    brandCache.set(id, data || null);
    return data || null;
}

async function getColor(id: string) {
    if (colorCache.has(id)) return colorCache.get(id) || null;
    const { data } = await supabase.from('cat_items').select('id, name, specs, image_url').eq('id', id).maybeSingle();
    colorCache.set(id, data || null);
    return data || null;
}

function buildLabel(model?: string, variant?: string, color?: string) {
    const base = [model, variant].filter(Boolean).join(' ').trim();
    if (!base) return null;
    return color ? `${base} (${color})` : base;
}

async function backfillQuotes() {
    console.log('Backfill starting...');
    const { data: quotes, error } = await supabase
        .from('crm_quotes')
        .select(
            'id, tenant_id, variant_id, color_id, commercials, ex_showroom_price, rto_amount, insurance_amount, accessories_amount, on_road_price'
        )
        .limit(1000);

    if (error) throw error;
    if (!quotes || quotes.length === 0) {
        console.log('No quotes found.');
        return;
    }

    let updated = 0;
    for (const q of quotes as QuoteRow[]) {
        const comms = q.commercials || {};
        const snap = comms.pricing_snapshot || {};
        let changed = false;

        if (!comms.dealer && q.tenant_id) {
            const tenant = await getTenant(q.tenant_id);
            if (tenant) {
                comms.dealer = {
                    dealer_id: tenant.id,
                    dealer_name: tenant.name,
                    studio_id: tenant.studio_id,
                };
                changed = true;
            }
        }

        if (q.variant_id) {
            const variant = await getVariant(q.variant_id);
            if (variant) {
                const model = variant.parent_id ? await getModel(variant.parent_id) : null;
                const brand = model?.brand_id ? await getBrand(model.brand_id) : null;
                if (!comms.variant) {
                    comms.variant = variant.name;
                    changed = true;
                }
                if (!comms.model && model?.name) {
                    comms.model = model.name;
                    changed = true;
                }
                if (!comms.brand && brand?.name) {
                    comms.brand = brand.name;
                    changed = true;
                }
            }
        }

        if (q.color_id) {
            const color = await getColor(q.color_id);
            if (color) {
                if (!comms.color_name && color.name) {
                    comms.color_name = color.name;
                    changed = true;
                }
                if (!comms.color_hex && color.specs?.hex_primary) {
                    comms.color_hex = color.specs.hex_primary;
                    changed = true;
                }
                if (!comms.image_url) {
                    const image =
                        color.image_url ||
                        color.specs?.primary_image ||
                        (Array.isArray(color.specs?.gallery) ? color.specs.gallery?.[0] : null);
                    if (image) {
                        comms.image_url = image;
                        changed = true;
                    }
                }
            }
        }

        if (!comms.label) {
            const label = buildLabel(comms.model, comms.variant, comms.color_name);
            if (label) {
                comms.label = label;
                changed = true;
            }
        }

        const needsSnapshot =
            !snap ||
            Object.keys(snap).length === 0 ||
            snap.ex_showroom === undefined ||
            snap.rto_total === undefined ||
            snap.insurance_total === undefined;

        if (needsSnapshot) {
            comms.pricing_snapshot = {
                ...snap,
                pricing_source: snap.pricing_source || 'BACKFILL',
                ex_showroom: snap.ex_showroom || q.ex_showroom_price || comms.ex_showroom || comms.base_price || 0,
                rto_total: snap.rto_total ?? q.rto_amount ?? 0,
                insurance_total: snap.insurance_total ?? q.insurance_amount ?? 0,
                accessories_total: snap.accessories_total ?? q.accessories_amount ?? 0,
                grand_total: snap.grand_total ?? q.on_road_price ?? comms.grand_total ?? 0,
            };
            changed = true;
        }

        if (!changed) continue;

        const { error: updateError } = await supabase.from('crm_quotes').update({ commercials: comms }).eq('id', q.id);
        if (updateError) {
            console.error('Update failed for', q.id, updateError.message);
            continue;
        }
        updated += 1;
    }

    console.log(`Backfill complete. Updated ${updated} quotes.`);
}

backfillQuotes().catch(err => {
    console.error('Backfill error:', err);
    process.exit(1);
});
