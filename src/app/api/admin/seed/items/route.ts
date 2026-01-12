import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { MOCK_VEHICLES } from '@/types/productMaster';

// Use SERVICE_ROLE_KEY to bypass RLS for seeding
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function GET(_request: NextRequest) {
    return handleSeedItems(_request);
}

export async function POST(_request: NextRequest) {
    return handleSeedItems(_request);
}

async function handleSeedItems(_request: NextRequest) {
    console.log('[SEED-ITEMS] Request received');

    const itemsToUpsert = MOCK_VEHICLES.map(v => {
        const displacement = parseFloat(v.specifications?.engine?.displacement || '0');
        const isElectric = v.model.toLowerCase().includes('electric') || v.specifications?.battery?.range !== 'N/A';

        return {
            type: v.type,
            make: v.make,
            model: v.model,
            variant: v.variant,
            color: v.color || 'Standard',
            image_url: `/images/categories/${v.bodyType?.toLowerCase() || 'motorcycle'}_nobg.png`,
            price: 0,
            is_active: true,
            specs: v.specifications || {},
            // New optimized columns
            category: v.bodyType === 'SCOOTER' ? 'SCOOTER' : 'MOTORCYCLE',
            fuel_type: isElectric ? 'ELECTRIC' : 'PETROL',
            engine_power: displacement || 0,
            power_unit: isElectric ? 'KW' : 'CC',
            segment: v.make === 'Royal Enfield' ? 'CRUISER' : (displacement > 200 ? 'SPORT' : 'COMMUTER')
        };
    });

    const { data, error } = await supabaseAdmin
        .from('items')
        .upsert(itemsToUpsert, { onConflict: 'make,model,variant,color' });

    if (error) {
        console.error('[SEED-ITEMS] Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        ok: true,
        upsertedCount: itemsToUpsert.length,
        items: itemsToUpsert
    });
}
