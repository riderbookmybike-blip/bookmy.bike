
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const collection = searchParams.get('collection');

        if (!collection) {
            return NextResponse.json({ success: false, error: 'Collection parameter required' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Fetch Source Keys (from Staging JSONB)
        // We use a raw SQL query via RPC or just fetch a sample (100 rows) and aggregate keys in JS
        // Fetching 100 rows is safer/easier than writing a custom RPC for now.
        const { data: sampleRows, error: sampleError } = await supabase
            .from('firebase_antigravity')
            .select('data')
            .eq('root_collection', collection)
            .limit(100);

        if (sampleError) throw sampleError;

        const sourceKeys = new Set<string>();
        sampleRows?.forEach(row => {
            if (row.data) {
                Object.keys(row.data).forEach(k => sourceKeys.add(k));
            }
        });

        // 2. Fetch Target Columns (from Profiles table)
        // We assume Target is always 'profiles' for now, or we could make it dynamic?
        // User specifically asked for 'aapli-users' -> 'profiles'.
        const targetTable = 'profiles';

        // We need to query information_schema.
        // Sadly Supabase JS client doesn't support querying information_schema easily without RPC.
        // Workaround: We can just use a known list OR use the admin client to `rpc` if available.
        // Simpler: Just fetch one row from `profiles` and check keys? 
        // No, that won't give types.
        // Better: Use the `get_columns` RPC if it exists, otherwise just hardcode standard profile columns + custom ones?
        // Let's try to infer from an empty select?
        // Actually, we can use the `rpc` approach if we had one.
        // Let's stick to standard Supabase introspection? No, user might have added columns.
        // Let's fallback to fetching 1 row from profiles.

        const { data: profileSample, error: profileError } = await supabase
            .from(targetTable)
            .select('*')
            .limit(1);

        // If we can't fetch (RLS?), we might default to standard known columns.
        const targetColumns = new Set<string>();
        if (profileSample && profileSample.length > 0) {
            Object.keys(profileSample[0]).forEach(k => targetColumns.add(k));
        } else {
            // Fallback default columns if table empty
            ['id', 'full_name', 'email', 'phone', 'city', 'state', 'country', 'pincode', 'role', 'tenant_id', 'created_at'].forEach(c => targetColumns.add(c));
        }

        return NextResponse.json({
            success: true,
            sourceKeys: Array.from(sourceKeys).sort(),
            targetColumns: Array.from(targetColumns).sort(),
            targetTable: targetTable
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
