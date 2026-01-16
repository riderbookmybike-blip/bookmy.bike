import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    // Debugging with ANON key first to simulate Public Store access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('vehicle_variants')
        .select(
            `
            name,
            slug,
            vehicle_models (
                name,
                brands (name)
            ),
            vehicle_colors (
                name,
                hex_code,
                image_url,
                gallery_urls,
                is_primary
            )
        `
        )
        .eq('vehicle_models.slug', 'jupiter') // Focus on the problem child
        .limit(5);

    return NextResponse.json({
        source: 'ANON_KEY',
        data,
        error,
    });
}
