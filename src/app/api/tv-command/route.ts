/**
 * TV Command API
 *
 * GET  /api/tv-command       → TV browser polls this; returns { reload: false, ts }
 * POST /api/tv-command       → Admin triggers reload; sets reload=true for 60s
 *                              Body: { secret: ADMIN_API_SECRET, action?: 'clear' }
 *
 * Security model:
 * - GET: open (TVs poll from local network; no sensitive data returned)
 * - POST: server-side origin enforcement → body parsing → secret auth → rate limit
 *   - If Origin header is present and not in allowlist → 403 (before body is read)
 *   - If Origin header is absent → allowed (direct server-to-server / curl / admin scripts)
 *   - Secret-in-body auth is a secondary check after origin passes
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// ---------------------------------------------------------------------------
// State (per-isolate; resets on cold start — acceptable for TV use case)
// ---------------------------------------------------------------------------
let reloadFlag = false;
let reloadSetAt = 0;
const RELOAD_TTL_MS = 60_000;

// ---------------------------------------------------------------------------
// Origin allowlist — strict equality against `new URL(origin).origin`
// Driven by env so staging/preview can be extended without code change.
// Set ALLOWED_ORIGINS_EXTRA as comma-separated list in Vercel env if needed.
// ---------------------------------------------------------------------------
const BASE_ALLOWED_ORIGINS = [
    'https://www.bookmybike.in',
    'https://bookmybike.in',
    'https://bookmy.bike',
    'https://www.bookmy.bike',
];

const DEV_ALLOWED_ORIGINS =
    process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:3001'] : [];

const EXTRA_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS_EXTRA ?? '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const ALLOWED_ORIGINS = new Set([...BASE_ALLOWED_ORIGINS, ...DEV_ALLOWED_ORIGINS, ...EXTRA_ALLOWED_ORIGINS]);

/** Strict origin equality using URL parsing — prevents startsWith bypass attacks. */
function isAllowedOrigin(rawOrigin: string): boolean {
    try {
        return ALLOWED_ORIGINS.has(new URL(rawOrigin).origin);
    } catch {
        return false;
    }
}

// ---------------------------------------------------------------------------
// Inline POST rate limit: 5 triggers per 60s per IP (prevents replay loops)
// ---------------------------------------------------------------------------
const postRateLimit = new Map<string, { count: number; windowStart: number }>();
const POST_LIMIT = 5;
const POST_WINDOW_MS = 60_000;

function checkPostRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
    const now = Date.now();
    const entry = postRateLimit.get(ip);

    if (!entry || now - entry.windowStart > POST_WINDOW_MS) {
        postRateLimit.set(ip, { count: 1, windowStart: now });
        return { allowed: true, retryAfterSec: 0 };
    }

    entry.count += 1;

    if (entry.count > POST_LIMIT) {
        const retryAfterSec = Math.ceil((entry.windowStart + POST_WINDOW_MS - now) / 1000);
        return { allowed: false, retryAfterSec };
    }

    return { allowed: true, retryAfterSec: 0 };
}

// ---------------------------------------------------------------------------
// CORS response headers
// GET: wildcard (TV kiosks and smart TVs may not send Origin header)
// POST: reflect allowed origin or omit — browser will block non-allowed responses
// ---------------------------------------------------------------------------
function getGetCorsHeaders(): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
    };
}

function getPostCorsHeaders(origin: string | null): Record<string, string> {
    const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
    if (origin && isAllowedOrigin(origin)) {
        headers['Access-Control-Allow-Origin'] = new URL(origin).origin;
        headers['Vary'] = 'Origin';
    }
    // If origin is absent (server-to-server) or disallowed, no ACAO header is set.
    // Disallowed origins are rejected with 403 before reaching this point anyway.
    return headers;
}

// ---------------------------------------------------------------------------
// OPTIONS — preflight
// ---------------------------------------------------------------------------
export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get('origin');
    const corsHeaders = getPostCorsHeaders(origin);
    return new NextResponse(null, {
        status: 204,
        headers: {
            ...corsHeaders,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

// ---------------------------------------------------------------------------
// GET — TV poll endpoint (permissive, no sensitive data)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
    const now = Date.now();

    if (reloadFlag && now - reloadSetAt > RELOAD_TTL_MS) {
        reloadFlag = false;
    }

    console.log(
        JSON.stringify({
            event: 'tv_command.poll',
            reload: reloadFlag,
            ts: now,
            ua: req.headers.get('user-agent')?.slice(0, 80) ?? 'unknown',
            ip: req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown',
        })
    );

    return NextResponse.json({ reload: reloadFlag, ts: now }, { headers: getGetCorsHeaders() });
}

// ---------------------------------------------------------------------------
// POST — admin trigger (strict origin enforcement before any business logic)
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const origin = req.headers.get('origin');

    // ── 1. Server-side origin enforcement (runs before body parse) ──────────
    // Rule: if Origin header is present, it MUST be in the allowlist.
    // Absent Origin = direct server call (curl, admin script) → allowed.
    if (origin !== null && !isAllowedOrigin(origin)) {
        console.warn(JSON.stringify({ event: 'tv_command.forbidden_origin', ip, origin }));
        return NextResponse.json({ error: 'forbidden' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }

    // ── 2. Rate limit ────────────────────────────────────────────────────────
    const rl = checkPostRateLimit(ip);
    if (!rl.allowed) {
        console.warn(JSON.stringify({ event: 'tv_command.rate_limited', ip, retryAfterSec: rl.retryAfterSec }));
        return NextResponse.json(
            { error: 'too many requests' },
            {
                status: 429,
                headers: {
                    ...getPostCorsHeaders(origin),
                    'Retry-After': String(rl.retryAfterSec),
                },
            }
        );
    }

    // ── 3. Parse body ────────────────────────────────────────────────────────
    let body: { secret?: string; action?: string } = {};
    try {
        body = await req.json();
    } catch {
        console.warn(JSON.stringify({ event: 'tv_command.bad_json', ip }));
        return NextResponse.json({ error: 'invalid json' }, { status: 400, headers: getPostCorsHeaders(origin) });
    }

    // ── 4. Secret auth ───────────────────────────────────────────────────────
    const secret = process.env.ADMIN_API_SECRET;
    if (!secret || body.secret !== secret) {
        console.warn(JSON.stringify({ event: 'tv_command.unauthorized', ip, hasSecret: !!body.secret }));
        return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: getPostCorsHeaders(origin) });
    }

    // ── 5. Actions ───────────────────────────────────────────────────────────
    if (body.action === 'clear') {
        reloadFlag = false;
        console.log(JSON.stringify({ event: 'tv_command.cleared', ip }));
        return NextResponse.json({ ok: true, reload: false }, { headers: getPostCorsHeaders(origin) });
    }

    reloadFlag = true;
    reloadSetAt = Date.now();

    console.log(JSON.stringify({ event: 'tv_command.triggered', ip, expiresAt: reloadSetAt + RELOAD_TTL_MS }));

    return NextResponse.json(
        { ok: true, reload: true, expiresAt: reloadSetAt + RELOAD_TTL_MS },
        { headers: getPostCorsHeaders(origin) }
    );
}
