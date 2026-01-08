import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MAHARASHTRA_PINCODES } from '@/data/maharashtraPincodes';

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        console.log(`Starting migration of ${MAHARASHTRA_PINCODES.length} pincodes...`);

        // Insert in batches of 100 to avoid request size limits
        const batchSize = 100;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < MAHARASHTRA_PINCODES.length; i += batchSize) {
            const batch = MAHARASHTRA_PINCODES.slice(i, i + batchSize).map(p => ({
                pincode: p.pincode,
                city: p.city,
                district: p.district,
                state: p.state,
                area: p.area,
                rto_code: p.rtoCode,
                latitude: p.latitude,
                longitude: p.longitude,
                country: 'India'
            }));

            const { error } = await supabase.from('pincodes').upsert(batch, { onConflict: 'pincode', ignoreDuplicates: true });

            if (error) {
                console.error('Batch error:', error);
                errorCount += batch.length;
            } else {
                successCount += batch.length;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Migration Complete. Processed: ${MAHARASHTRA_PINCODES.length}, Success: ${successCount}, Errors: ${errorCount}`
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
