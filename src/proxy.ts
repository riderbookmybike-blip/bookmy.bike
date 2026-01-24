import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host') || '';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';
    const isLocalhost = host.includes('localhost') || host.startsWith('127.') || host.startsWith('0.0.0.0');
    const cookieDomain = !isLocalhost ? `.${rootDomain}` : undefined;

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

    const response = NextResponse.next();

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
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                            ...(cookieDomain && !options?.domain ? { domain: cookieDomain } : {}),
                        });
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isLegacyDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

    if (isLegacyDashboard) {
        if (!user) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
            return NextResponse.redirect(loginUrl);
        }

        const { data: legacyMembership } = await supabase
            .from('id_team')
            .select('id_tenants!inner(slug)')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        const legacyTenant = legacyMembership?.id_tenants as { slug: string } | { slug: string }[] | null;
        const legacySlug = Array.isArray(legacyTenant)
            ? legacyTenant[0]?.slug
            : legacyTenant?.slug;
        if (legacySlug) {
            return NextResponse.redirect(new URL(`/app/${legacySlug}/dashboard`, request.url));
        }

        return NextResponse.redirect(new URL('/', request.url));
    }

    // Parse Tenant Slug from URL Path (NEW: Path-based routing)
    // Pattern: /app/{slug}/... → extract slug
    let tenantSlug: string | null = null;

    if (pathname.startsWith('/app/')) {
        const pathSegments = pathname.split('/').filter(Boolean); // ['app', 'aums', 'dashboard']
        if (pathSegments.length >= 2) {
            tenantSlug = pathSegments[1]; // 'aums', 'myoody', etc.
        }
    }

    // B. ROOT DOMAIN GUARD - Allow public marketplace
    if (!tenantSlug) {
        // Allow public routes (marketplace, login, etc.)
        return response;
    }

    // C. INTERNAL & PARTNER PORTALS
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');

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

    // 1. Protected Tenant Routes - Require Authentication
    if (tenantSlug && ['aums', 'marketplace'].includes(tenantSlug)) {
        if (!user) {
            if (!isAuthRoute) {
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
                return NextResponse.redirect(loginUrl);
            }
            return response;
        }
    }
    // 2. Dealer/Partner Portals
    else {
        const isLandingPage = pathname === '/';
        if (!user) {
            if (!isAuthRoute && !isLandingPage) {
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
                return NextResponse.redirect(loginUrl);
            }
            return response;
        }
    }

    // E. AUTHORIZATION (Authenticated User Checks)
    if (pathname === '/login' || pathname === '/logout' || isAuthRoute) return response;

    // 1. AUMS (Super Admin)
    if (tenantSlug === 'aums') {
        const { data: membership } = await supabase
            .from('id_team')
            .select('role, id_tenants!inner(slug)')
            .eq('user_id', user.id)
            .eq('id_tenants.slug', 'aums')
            .eq('status', 'ACTIVE')
            .maybeSingle();

        console.log('[Proxy Debug] AUMS Check:', {
            userId: user.id,
            hasMembership: !!membership,
            role: membership?.role
        });

        if (!membership || !['SUPER_ADMIN', 'OWNER'].includes(membership.role)) {
            console.warn('[Proxy Debug] AUMS Access Denied');
            return NextResponse.rewrite(new URL('/403', request.url));
        }
        return response;
    }

    console.log('[Proxy Debug] Dynamic Tenant Check:', { tenantSlug, userId: user.id });

    // Dynamic Partner Check
    const { data: tenantMembership } = await supabase
        .from('id_team')
        .select('id, id_tenants!inner(slug)')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .eq('id_tenants.slug', tenantSlug)
        .maybeSingle();

    if (!tenantMembership) {
        if (isAuthRoute || pathname === '/') return response;
        return NextResponse.rewrite(new URL('/403', request.url));
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export default proxy;
