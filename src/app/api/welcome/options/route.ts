import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const [{ data: financers, error: financersError }, { data: dealers, error: dealersError }] = await Promise.all([
            adminClient
                .from('id_tenants')
                .select('id, name, slug')
                .eq('type', 'BANK')
                .eq('status', 'ACTIVE')
                .order('name', { ascending: true }),
            adminClient
                .from('id_tenants')
                .select('id, name, slug')
                .eq('type', 'DEALER')
                .eq('status', 'ACTIVE')
                .order('name', { ascending: true }),
        ]);

        if (financersError || dealersError) {
            return NextResponse.json(
                {
                    success: false,
                    message: financersError?.message || dealersError?.message || 'Failed to load options',
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            financers: financers || [],
            dealerships: dealers || [],
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
