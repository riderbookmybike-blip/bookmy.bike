import { NextRequest, NextResponse } from 'next/server';
import { applyApiGuard } from '@/lib/server/apiGuard';
import { runCatalogCacheAudit } from '@/lib/server/cacheAudit';

function readSecret(req: NextRequest): string {
    const fromHeader = req.headers.get('x-audit-secret');
    if (fromHeader) return fromHeader;
    return req.nextUrl.searchParams.get('secret') || '';
}

export async function POST(req: NextRequest) {
    const blocked = applyApiGuard(req, { maxRequests: 5 });
    if (blocked) return blocked;

    const configuredSecret = String(process.env.CACHE_AUDIT_SECRET || process.env.REVALIDATE_SECRET || '').trim();
    const incomingSecret = readSecret(req).trim();

    if (!configuredSecret || incomingSecret !== configuredSecret) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { stateCode?: string; actor?: string };
    const result = await runCatalogCacheAudit({
        stateCode: body.stateCode || req.nextUrl.searchParams.get('state') || 'MH',
        actor: body.actor || 'SYSTEM',
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
