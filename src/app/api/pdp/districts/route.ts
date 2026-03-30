import { NextResponse } from 'next/server';
import { DEFAULT_STATE_CODE, getServiceableDistricts } from '@/lib/server/winnerResolver';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const stateCode = String(url.searchParams.get('stateCode') || DEFAULT_STATE_CODE)
        .trim()
        .toUpperCase();
    const region = String(url.searchParams.get('region') || '').trim();

    const rows = region
        ? (
              await (adminClient as any)
                  .from('id_primary_dealer_districts')
                  .select('district, state_code')
                  .eq('is_active', true)
                  .eq('state_code', stateCode)
                  .eq('region', region)
                  .neq('district', 'ALL')
          )?.data || []
        : await getServiceableDistricts(stateCode);
    const districts = Array.from(
        new Set(
            (rows || [])
                .map((r: { district?: string | null }) => String(r?.district || '').trim())
                .filter(Boolean)
                .sort((a: string, b: string) => a.localeCompare(b))
        )
    );

    return NextResponse.json(
        { stateCode, region: region || null, districts },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
