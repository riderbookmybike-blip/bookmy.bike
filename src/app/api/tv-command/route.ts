/**
 * TV Command API
 *
 * GET  /api/tv-command       → TV browser polls this; returns { reload: false, ts }
 * POST /api/tv-command       → Admin triggers reload; sets reload=true for 60s
 *                              Body: { secret: ADMIN_API_SECRET }
 *
 * TV browsers (isTv=true) poll this every 30s.
 * When reload=true is seen, the browser calls window.location.reload().
 * The flag auto-resets after 60s so TVs don't loop-reload.
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Edge-compatible in-memory store (per-isolate — resets on cold start, sufficient for TV use)
// For multi-region Vercel, this is fine: each region's TVs will pick it up within 30s.
let reloadFlag = false;
let reloadSetAt = 0;
const RELOAD_TTL_MS = 60_000; // auto-reset after 60s

function cors() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
    };
}

export async function GET() {
    const now = Date.now();
    // Auto-expire the flag
    if (reloadFlag && now - reloadSetAt > RELOAD_TTL_MS) {
        reloadFlag = false;
    }

    return NextResponse.json({ reload: reloadFlag, ts: now }, { headers: cors() });
}

export async function POST(req: NextRequest) {
    const secret = process.env.ADMIN_API_SECRET;
    let body: { secret?: string; action?: string } = {};

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'invalid json' }, { status: 400 });
    }

    if (!secret || body.secret !== secret) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (body.action === 'clear') {
        reloadFlag = false;
        return NextResponse.json({ ok: true, reload: false });
    }

    // Trigger reload
    reloadFlag = true;
    reloadSetAt = Date.now();

    return NextResponse.json({ ok: true, reload: true, expiresAt: reloadSetAt + RELOAD_TTL_MS });
}
