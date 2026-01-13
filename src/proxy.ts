import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    // 1. Define Domains and Constants
    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';

    // Parse Subdomain
    let currentSubdomain: string | null = null;
    if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
        const diff = hostname.replace(`.${ROOT_DOMAIN}`, '');
        if (diff && diff !== 'www') currentSubdomain = diff;
    } else if (hostname === `www.${ROOT_DOMAIN}` || hostname === ROOT_DOMAIN) {
        currentSubdomain = null; // Public Site
    } else if (hostname.includes('localhost')) {
        const parts = hostname.split('.');
        // Support aums.localhost:3000 etc.
        if (parts.length > 1 && (parts[parts.length - 1].includes('localhost') || parts[parts.length - 2].includes('localhost'))) {
            currentSubdomain = parts[0] === 'www' ? null : parts[0];
        } else {
            currentSubdomain = null;
        }
    }

    // A. PUBLIC/STATIC ASSETS -> PASS
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/public') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml'
    ) {
        return NextResponse.next();
    }

    // B. ROOT DOMAIN GUARD (#1 Requirement)
    if (!currentSubdomain) {
        // HARD BLOCK /dashboard on bookmy.bike
        if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
            console.log(`[Proxy] Hard-blocking /dashboard on root domain: ${hostname}`);
            return NextResponse.redirect(new URL('/', request.url));
        }

        // OAuth code handling
        const code = request.nextUrl.searchParams.get('code');
        if (code && pathname === '/') {
            return NextResponse.redirect(new URL(`/auth/callback?code=${code}`, request.url));
        }

        return NextResponse.next();
    }

    // C. INTERNAL & PARTNER PORTALS (Subdomains)
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');

    // Initialize Supabase to check Auth
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set({ name, value, ...options }));
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // D. ROUTE ALLOWLISTS (Unauthenticated Access)
    const isAuthRoute =
        pathname.startsWith('/login') ||
        pathname.startsWith('/logout') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/admin') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/reset-password') ||
        pathname.startsWith('/invite');

    // 1. Internal Portals (AUMS, WE, LTFINANCE) - STRICT
    if (['aums', 'we', 'ltfinance'].includes(currentSubdomain)) {
        if (!user) {
            if (!isAuthRoute) {
                const loginUrl = new URL('/login', request.url);
                return NextResponse.redirect(loginUrl);
            }
            return response;
        }
    }
    // 2. Partner Portals
    else {
        const isLandingPage = pathname === '/';
        if (!user) {
            if (!isAuthRoute && !isLandingPage) {
                const loginUrl = new URL('/login', request.url);
                return NextResponse.redirect(loginUrl);
            }
            return response;
        }
    }

    // E. AUTHORIZATION (Authenticated User Checks)
    if (pathname === '/login' || pathname === '/logout' || isAuthRoute) return response;

    // 1. AUMS (Super Admin)
    if (currentSubdomain === 'aums') {
        const { data: membership } = await supabase
            .from('memberships')
            .select('role, tenants!inner(subdomain)')
            .eq('user_id', user.id)
            .eq('tenants.subdomain', 'aums')
            .eq('status', 'ACTIVE')
            .maybeSingle();

        if (!membership || !['SUPER_ADMIN', 'OWNER'].includes(membership.role)) {
            return NextResponse.rewrite(new URL('/403', request.url));
        }
        return response;
    }

    // Dynamic Partner Check
    const { data: tenantMembership } = await supabase
        .from('memberships')
        .select('id, tenants!inner(subdomain)')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .eq('tenants.subdomain', currentSubdomain)
        .maybeSingle();

    if (!tenantMembership) {
        if (isAuthRoute || pathname === '/') return response;
        return NextResponse.rewrite(new URL('/403', request.url));
    }

    // Direct to dashboard if hitting root of subdomain
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
