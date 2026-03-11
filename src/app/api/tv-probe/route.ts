/**
 * TV Probe API — Reads raw request headers from any device calling this endpoint.
 * Access from TCL TV browser: http://192.168.0.202:3000/api/tv-probe
 * This tells us the real User-Agent, viewport hints, and device pixel ratio sent by the TV.
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const ua = req.headers.get('user-agent') || 'unknown';
    const accept = req.headers.get('accept') || '';
    const acceptLang = req.headers.get('accept-language') || '';
    const xForwardedFor = req.headers.get('x-forwarded-for') || '';
    const secChUa = req.headers.get('sec-ch-ua') || '';
    const secChUaMobile = req.headers.get('sec-ch-ua-mobile') || '';
    const secChUaPlatform = req.headers.get('sec-ch-ua-platform') || '';
    const secChViewportWidth = req.headers.get('sec-ch-viewport-width') || '';
    const secChDpr = req.headers.get('sec-ch-dpr') || '';
    const contentDpr = req.headers.get('content-dpr') || '';
    const viewportWidth = req.headers.get('viewport-width') || '';
    const dpr = req.headers.get('dpr') || '';

    // All headers for full inspection
    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
        allHeaders[key] = value;
    });

    const data = {
        summary: {
            userAgent: ua,
            ip: xForwardedFor || 'direct',
            platform: secChUaPlatform,
            isMobileHint: secChUaMobile,
            viewportWidthHint: secChViewportWidth || viewportWidth || 'not-sent',
            dprHint: secChDpr || contentDpr || dpr || 'not-sent',
        },
        tvDetection: {
            matchesTCL: /tcl/i.test(ua),
            matchesAndroidTV: /android tv|androidtv/i.test(ua),
            matchesTizen: /tizen/i.test(ua),
            matchesWebOS: /web0s|webos/i.test(ua),
            matchesSmartTV: /smarttv|smart-tv/i.test(ua),
            hasAndroid: /android/i.test(ua),
            hasMobileToken: /mobile/i.test(ua),
            note: 'If matchesAndroidTV=false and hasAndroid=true and hasMobileToken=false → likely Android TV (tablet-like UA)',
        },
        allHeaders,
    };

    return NextResponse.json(data, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
        },
    });
}
