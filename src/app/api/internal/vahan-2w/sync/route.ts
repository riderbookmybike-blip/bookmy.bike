import { NextRequest, NextResponse } from 'next/server';
import { applyApiGuard } from '@/lib/server/apiGuard';

export async function POST(req: NextRequest) {
    const blocked = applyApiGuard(req, { maxRequests: 5 });
    if (blocked) return blocked;

    const configuredSecret = String(process.env.VAHAN_SYNC_SECRET || process.env.REVALIDATE_SECRET || '').trim();
    const incomingSecret = String(
        req.headers.get('x-vahan-sync-secret') || req.nextUrl.searchParams.get('secret') || ''
    ).trim();

    if (!configuredSecret || incomingSecret !== configuredSecret) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
        ok: true,
        mode: 'manual_upload',
        message: 'Upload mode is enabled. Use /app/aums/dashboard/vahan-2w to upload latest files daily.',
    });
}
