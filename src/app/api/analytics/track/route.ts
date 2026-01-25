import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sessionId, userId, events, userAgent, location, device } = body;

        // Extract IP Address (Reliable method for Vercel/Next.js)
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

        if (!sessionId || !events || !Array.isArray(events)) {
            return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
        }

        // 1. Ensure Session Exists / Update Last Active
        // We use adminClient to bypass RLS for robust tracking
        const { error: sessionError } = await adminClient
            .from('analytics_sessions')
            .upsert({
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
                    browser_name: device.browser
                }),
                last_active_at: new Date().toISOString()
            }, { onConflict: 'id' });

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
            created_at: event.timestamp || new Date().toISOString()
        }));

        const { error: eventError } = await adminClient
            .from('analytics_events')
            .insert(formattedEvents);

        if (eventError) {
            console.error('Analytics Event Error:', eventError);
            return NextResponse.json({ success: false }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Analytics API Error:', err);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
