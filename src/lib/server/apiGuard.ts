/**
 * Route-layer API guard utilities.
 *
 * Provides bot UA filtering, per-IP rate limiting, and IP extraction
 * for use inside individual Next.js Route Handlers on the Node.js runtime.
 *
 * WHY HERE AND NOT proxy.ts:
 * proxy.ts matcher explicitly excludes `/api/` to avoid routing every API
 * request through expensive Supabase auth initialization. Route-level guards
 * are the right layer for API protection in this architecture.
 *
 * Usage:
 *   import { applyApiGuard } from '@/lib/server/apiGuard';
 *   const blocked = applyApiGuard(req, { maxRequests: 30 });
 *   if (blocked) return blocked;   // returns NextResponse with 403 or 429
 */
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Bot UA detection
// Blocks all automated crawlers and bots on guarded API routes.
// Does NOT block: curl, axios, python-requests, wget (internal tooling/webhooks).
//
// /api/og is intentionally NOT guarded — social crawlers (Twitterbot, Slackbot,
// WhatsApp, Discordbot) must reach it to generate OG previews. Keep it guard-free.
// ---------------------------------------------------------------------------
const BOT_UA_REGEX =
    /bot|spider|crawl|slurp|scrapy|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|serpstatbot|blexbot|becomebot|siteauditbot/i;

// ---------------------------------------------------------------------------
// IP extraction
// ---------------------------------------------------------------------------
export function getClientIp(req: NextRequest): string {
    return req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

// ---------------------------------------------------------------------------
// In-memory rate limit store (per Node.js isolate / edge isolate)
// ---------------------------------------------------------------------------
const store = new Map<string, { count: number; windowStart: number }>();

// ---------------------------------------------------------------------------
// Guard config
// ---------------------------------------------------------------------------
export interface ApiGuardOptions {
    /** Max requests per window per IP. Default: 60. */
    maxRequests?: number;
    /** Window duration in ms. Default: 60_000 (1 minute). */
    windowMs?: number;
    /**
     * Set to true to skip bot UA filtering (e.g. on /api/og).
     * Rate limiting still applies if maxRequests is set.
     * Default: false (bot filtering enabled).
     */
    allowBots?: boolean;
}

/**
 * Apply bot filtering and/or rate limiting to a route handler request.
 *
 * Returns a NextResponse (403 or 429) if the request should be blocked,
 * or `null` if the request may proceed.
 *
 * Pattern:
 *   const blocked = applyApiGuard(req, { maxRequests: 30 });
 *   if (blocked) return blocked;
 */
export function applyApiGuard(req: NextRequest, options: ApiGuardOptions = {}): NextResponse | null {
    const { maxRequests = 60, windowMs = 60_000, allowBots = false } = options;
    const ua = req.headers.get('user-agent') ?? '';
    const ip = getClientIp(req);

    // ── Bot filter ───────────────────────────────────────────────────────────
    if (!allowBots && BOT_UA_REGEX.test(ua)) {
        console.warn(
            JSON.stringify({ event: 'api_guard.bot_blocked', ip, ua: ua.slice(0, 80), path: req.nextUrl.pathname })
        );
        return NextResponse.json(
            { error: 'forbidden' },
            {
                status: 403,
                headers: { 'X-Block-Reason': 'bot-ua', 'Cache-Control': 'no-store' },
            }
        );
    }

    // ── Rate limit ───────────────────────────────────────────────────────────
    const now = Date.now();
    const key = `${ip}:${req.nextUrl.pathname}`;
    const entry = store.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
        store.set(key, { count: 1, windowStart: now });
        return null; // allowed
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
        const retryAfterSec = Math.ceil((entry.windowStart + windowMs - now) / 1000);
        console.warn(
            JSON.stringify({ event: 'api_guard.rate_limited', ip, path: req.nextUrl.pathname, retryAfterSec })
        );
        return NextResponse.json(
            { error: 'too many requests' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfterSec),
                    'X-RateLimit-Limit': String(maxRequests),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(entry.windowStart + windowMs),
                    'Cache-Control': 'no-store',
                },
            }
        );
    }

    return null; // allowed
}
