import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host') || '';
    const hostname = host.split(':')[0]; // Remove port if present

    // --- CASE A: SUBDOMAIN (aums.bookmy.bike) ---
    if (hostname === 'aums.bookmy.bike' || hostname.startsWith('aums.')) {
        // 1. BLOCK Store Routes (SEO Protection) -> 301 Redirect to Main Domain
        if (pathname.startsWith('/store') || pathname.startsWith('/compare')) {
            const mainUrl = new URL(pathname, 'https://bookmy.bike');
            request.nextUrl.searchParams.forEach((v, k) => mainUrl.searchParams.set(k, v));
            return NextResponse.redirect(mainUrl, 301);
        }

        // 2. Rewrite Root to AUMS Landing/Login
        if (pathname === '/') {
            return NextResponse.rewrite(new URL('/aums-landing', request.url));
        }

        // 3. Protect /dashboard/*
        if (pathname.startsWith('/dashboard')) {
            const session = request.cookies.get('aums_session'); // Or supabase auth cookie check
            // Note: Real Supabase middleware should go here if using their helpers, 
            // but for P0 structure, this simple check remains as placeholder or we rely on page-level auth.
            // We will assume page-level redirects for P0 to keep middleware simple.
        }

        return NextResponse.next();
    }

    // --- CASE B: MAIN DOMAIN (bookmy.bike) ---

    // 1. BLOCK Dashboard/AUMS Routes (Strict 404/Blocked)
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/aums-landing')) {
        return NextResponse.rewrite(new URL('/blocked', request.url));
    }

    // 2. SEO Helper: Handle Legacy URL Redirects (Existing Logic)
    if (pathname.startsWith('/store/')) {
        const parts = pathname.split('/');
        if (parts.length === 6 && parts[5] && !parts[5].includes('.')) {
            const [, , make, model, variant, color] = parts;
            const url = new URL(`/store/${make}/${model}/${variant}`, request.url);
            url.searchParams.set('color', color);
            // Preserve existing query params
            request.nextUrl.searchParams.forEach((value, key) => {
                url.searchParams.set(key, value);
            });
            return NextResponse.redirect(url, 308);
        }
    }

    // 3. Legacy /aums path cleanup
    if (pathname.startsWith('/aums')) {
        return NextResponse.redirect(new URL(`https://aums.bookmy.bike${pathname.replace('/aums', '') || '/'}`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|Logo).*)'],
};
