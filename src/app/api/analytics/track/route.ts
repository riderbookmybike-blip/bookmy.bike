import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

// Simple in-memory rate limit for analytics (per Vercel instance)
const ratelimit = new Map<string, { count: number; lastReset: number }>();
const RATELIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 flushes (batches) per minute per IP

const IS_BOT_REGEX =
    /bot|spider|crawl|slurp|adsbot|mediapartners-google|apis-google|adsbot-google|google-polaris|bingpreview|bingbot|baiduspider|yandexbot|duckduckbot|rogerbot|exabot|facebot|facebookexternalhit|ia_archiver/i;

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

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Analytics API Error:', err);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
