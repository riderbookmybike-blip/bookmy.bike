import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

// Simple in-memory rate limit for analytics (per Vercel instance)
const ratelimit = new Map<string, { count: number; lastReset: number }>();
const RATELIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 flushes (batches) per minute per IP

const IS_BOT_REGEX =
    /bot|spider|crawl|slurp|adsbot|mediapartners-google|apis-google|adsbot-google|google-polaris|bingpreview|bingbot|baiduspider|yandexbot|duckduckbot|rogerbot|exabot|facebot|facebookexternalhit|ia_archiver/i;

function asObject(value: unknown): Record<string, any> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, any>;
}

function asString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

export async function POST(req: NextRequest) {
    try {
        const userAgent = req.headers.get('user-agent') || '';

        // 0. Bot & Environment Filtering
        if (IS_BOT_REGEX.test(userAgent)) {
            return NextResponse.json({ success: true, skipped: 'bot' });
        }

        const body = await req.json();
        const { sessionId, userId, events, location, device } = body;

        // Extract IP Address (Reliable method for Vercel/Next.js)
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

        // 0.1 Basic Rate Limiting
        const now = Date.now();
        const clientLimit = ratelimit.get(ip) || { count: 0, lastReset: now };

        if (now - clientLimit.lastReset > RATELIMIT_WINDOW_MS) {
            clientLimit.count = 1;
            clientLimit.lastReset = now;
        } else {
            clientLimit.count++;
        }
        ratelimit.set(ip, clientLimit);

        if (clientLimit.count > MAX_REQUESTS_PER_WINDOW) {
            return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
        }

        if (!sessionId || !events || !Array.isArray(events)) {
            return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
        }

        // 1. Ensure Session Exists / Update Last Active
        // We use adminClient to bypass RLS for robust tracking
        const { error: sessionError } = await adminClient.from('analytics_sessions').upsert(
            {
                id: sessionId,
                user_id: userId || null, // Link to auth user if provided
                user_agent: userAgent,
                // Only update location/device if provided (usually on session start)
                ...(location && {
                    taluka: location.taluka || location.city,
                    country: location.country,
                    latitude: location.latitude,
                    longitude: location.longitude,
                }),
                ip_address: ip, // Always capture IP
                ...(device && {
                    device_type: device.type,
                    os_name: device.os,
                    browser_name: device.browser,
                }),
                last_active_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
        );

        if (sessionError) {
            console.error('Analytics Session Error:', sessionError);
        }

        // 2. Batch Insert Events
        const formattedEvents = events.map((event: any) => ({
            session_id: sessionId,
            event_type: event.type,
            page_path: event.path,
            event_name: event.name,
            metadata: event.metadata,
            created_at: event.timestamp || new Date().toISOString(),
        }));

        const { error: eventError } = await adminClient.from('analytics_events').insert(formattedEvents);

        if (eventError) {
            console.error('Analytics Event Error:', eventError);
            // Don't block local/dev flows on analytics table errors
            if (process.env.NODE_ENV !== 'production') {
                return NextResponse.json({ success: false, ignored: true });
            }
            return NextResponse.json({ success: false }, { status: 500 });
        }

        // 3. Mirror SKU engagement into lead activity stream when lead context exists.
        const leadEventRows = events
            .map((event: any) => {
                const metadata = asObject(event?.metadata);
                const leadId = asString(metadata.lead_id);
                const skuId = asString(metadata.sku_id);
                if (!leadId || !skuId) return null;

                const normalizedName = asString(event?.name).toLowerCase();
                const eventType = normalizedName === 'sku_dwell' ? 'SKU_DWELL' : 'SKU_VISIT';
                const dwellMs = Number(metadata.dwell_ms || metadata.dwellMs || 0);

                return {
                    lead_id: leadId,
                    actor_user_id: userId || null,
                    event_type: eventType,
                    payload: {
                        sku_id: skuId,
                        model_slug: asString(metadata.model_slug) || null,
                        variant_slug: asString(metadata.variant_slug) || null,
                        make_slug: asString(metadata.make_slug) || null,
                        source: asString(metadata.source) || 'STORE_PDP',
                        reason: asString(metadata.reason) || null,
                        dwell_ms: Number.isFinite(dwellMs) ? Math.max(0, Math.round(dwellMs)) : 0,
                        page_path: asString(event?.path) || null,
                        session_id: sessionId,
                    },
                    created_at: event.timestamp || new Date().toISOString(),
                };
            })
            .filter(Boolean);

        if (leadEventRows.length > 0) {
            const { error: leadEventError } = await adminClient.from('crm_lead_events').insert(leadEventRows as any[]);
            if (leadEventError) {
                console.error('Lead SKU tracking insert failed:', leadEventError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Analytics API Error:', err);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
