import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirects legacy aapli.in URLs to /store on bookmy.bike.
 *
 * Old aapli.in PDP format: /{Make}/{Model}/{Variant}/{Color?}
 *   e.g. /Hero/Splendor%20Plus/i3S/Blue%20Black
 *
 * These paths 404 on bookmy.bike — redirect all of them to /store
 * so users land on the catalog instead of a broken page.
 *
 * Detection: first path segment starts with an uppercase letter
 * and is not a known Next.js app route.
 */

const KNOWN_ROUTES = new Set([
    'store',
    'app',
    'api',
    'dashboard',
    'auth',
    '_next',
    'favicon.ico',
    'images',
    'media',
    'robots.txt',
    'sitemap.xml',
]);

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const decoded = decodeURIComponent(pathname.slice(1)); // strip leading /
    const firstSegment = decoded.split('/')[0];

    if (!firstSegment) return NextResponse.next();

    // Skip known Next.js routes
    if (KNOWN_ROUTES.has(firstSegment.toLowerCase())) return NextResponse.next();

    // Redirect old aapli.in paths (first segment uppercase = vehicle make)
    if (/^[A-Z]/.test(firstSegment)) {
        const newUrl = request.nextUrl.clone();
        newUrl.pathname = '/store';
        return NextResponse.redirect(newUrl, { status: 301 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)'],
};
