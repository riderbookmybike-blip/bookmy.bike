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

function normalizeEventChangedValue(changedValue?: unknown): string | null {
    if (changedValue === undefined || changedValue === null) return null;
    if (typeof changedValue === 'string') {
        const normalized = changedValue.trim();
        return normalized.length > 0 ? normalized.slice(0, 500) : null;
    }
    try {
        return JSON.stringify(changedValue).slice(0, 500);
    } catch {
        return String(changedValue).slice(0, 500);
    }
}

async function resolveActiveLeadId(explicitLeadId: string, userId: string): Promise<string | null> {
    if (explicitLeadId) return explicitLeadId;
    if (!userId) return null;

    const { data, error } = await adminClient
        .from('crm_leads')
        .select('id, status')
        .eq('customer_id', userId)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Active lead resolution failed:', error);
        return null;
    }

    return asString((data as any)?.id) || null;
}

async function bootstrapLeadForTracking(userId: string): Promise<string | null> {
    if (!userId) return null;

    const { data: member, error: memberErr } = await adminClient
        .from('id_members')
        .select('id, full_name, primary_phone, whatsapp')
        .eq('id', userId)
        .maybeSingle();
    if (memberErr || !member) return null;

    const phone = asString((member as any).primary_phone) || asString((member as any).whatsapp);
    if (!phone) return null;

    const { data: created, error: createErr } = await adminClient
        .from('crm_leads')
        .insert({
            customer_id: userId,
            customer_name: asString((member as any).full_name) || 'Website Member',
            customer_phone: phone,
            source: 'WEBSITE_TRACKING',
            status: 'NEW',
            utm_source: 'WEBSITE_TRACKING',
            interest_text: 'Web visit tracked',
            is_deleted: false,
        })
        .select('id')
        .maybeSingle();

    if (createErr) {
        console.error('Tracking lead bootstrap failed:', createErr);
        return null;
    }

    return asString((created as any)?.id) || null;
}

async function ensureLeadForTracking(explicitLeadId: string, userId: string): Promise<string | null> {
    const resolved = await resolveActiveLeadId(explicitLeadId, userId);
    if (resolved) return resolved;
    return bootstrapLeadForTracking(userId);
}

function mapEventNameToLeadEventType(eventName: string): string {
    switch (eventName) {
        case 'sku_dwell':
            return 'SKU_DWELL';
        case 'sku_view':
            return 'SKU_VISIT';
        case 'catalog_vehicle_click':
            return 'CATALOG_VEHICLE_CLICK';
        case 'pdp_visit':
            return 'PDP_VISIT';
        case 'pdp_share_quote':
            return 'PDP_SHARE_QUOTE';
        case 'pdp_save_quote':
            return 'PDP_SAVE_QUOTE';
        case 'wishlist_toggle':
            return 'WISHLIST_TOGGLE';
        default:
            return 'MEMBER_ACTIVITY';
    }
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

        // 3. Mirror engagement into lead activity stream.
        const leadEventRows = (
            await Promise.all(
                events.map(async (event: any) => {
                    const normalizedName = asString(event?.name).toLowerCase();
                    const eventType = mapEventNameToLeadEventType(normalizedName);
                    if (!eventType) return null;

                    const metadata = asObject(event?.metadata);
                    const explicitLeadId = asString(metadata.lead_id);
                    const resolvedLeadId = await ensureLeadForTracking(explicitLeadId, asString(userId));
                    if (!resolvedLeadId) return null;

                    const changedValue = {
                        sku_id: asString(metadata.sku_id) || null,
                        make_slug: asString(metadata.make_slug) || null,
                        model_slug: asString(metadata.model_slug) || null,
                        variant_slug: asString(metadata.variant_slug) || null,
                        color_name: asString(metadata.color_name) || null,
                        color_id: asString(metadata.color_id) || null,
                        quote_id: asString(metadata.quote_id) || null,
                        share_channel: asString(metadata.share_channel) || null,
                        action: asString(metadata.action) || null,
                        reason: asString(metadata.reason) || null,
                        dwell_ms: Number(metadata.dwell_ms || metadata.dwellMs || 0) || 0,
                        source: asString(metadata.source) || 'STORE',
                        page_path: asString(event?.path) || null,
                        session_id: sessionId,
                    };

                    return {
                        lead_id: resolvedLeadId,
                        actor_user_id: userId || null,
                        event_type: eventType,
                        notes: `${eventType} via ${changedValue.source}`,
                        changed_value: normalizeEventChangedValue(changedValue),
                        created_at: event.timestamp || new Date().toISOString(),
                    };
                })
            )
        ).filter(Boolean);

        if (leadEventRows.length > 0) {
            const { error: leadEventError } = await adminClient.from('crm_lead_events').insert(leadEventRows as any[]);
            if (leadEventError) {
                console.error('Lead engagement tracking insert failed:', leadEventError);
            }

            const touchedLeadIds = Array.from(
                new Set(
                    leadEventRows
                        .map((row: any) => asString(row?.lead_id))
                        .filter((leadId): leadId is string => Boolean(leadId))
                )
            );
            if (touchedLeadIds.length > 0) {
                const nowIso = new Date().toISOString();
                const { error: leadTouchErr } = await (adminClient.from('crm_leads') as any)
                    .update({
                        updated_at: nowIso,
                        last_activity_at: nowIso,
                    })
                    .in('id', touchedLeadIds);
                if (leadTouchErr) {
                    console.error('Lead last activity touch failed:', leadTouchErr);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Analytics API Error:', err);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
