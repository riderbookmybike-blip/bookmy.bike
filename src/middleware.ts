import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    // 1. Define Domains and Constants
    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike'; // e.g. localhost:3000 in dev or bookmy.bike

    // Parse Subdomain
    let currentSubdomain: string | null = null;
    if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
        const diff = hostname.replace(`.${ROOT_DOMAIN}`, '');
        if (diff && diff !== 'www') currentSubdomain = diff;
    } else if (hostname === `www.${ROOT_DOMAIN}` || hostname === ROOT_DOMAIN) {
        currentSubdomain = null; // Public Site
    } else {
        // Handle localhost cases or distinct domains if needed
        // For development: localhost might be treated as root or passed via header
        if (hostname.includes('localhost') && !hostname.endsWith(`.${ROOT_DOMAIN}`)) {
            currentSubdomain = null;
        }
    }

    // A. PUBLIC/STATIC ASSETS -> PASS
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/public') || // Public APIs if any
        pathname.startsWith('/static') ||
        pathname.includes('.') // public files like .svg, .ico, .png
    ) {
        return NextResponse.next();
    }

    // B. SEO & HEADERS (Strict NoIndex for Subdomains)
    // We create a "base" response. If we redirect later, this header might be lost, 
    // but successful responses for internal portals must have it.
    let response = NextResponse.next();

    if (currentSubdomain) {
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }

    // C. PUBLIC SITE (Apex / WWW)
    if (!currentSubdomain) {
        // Allow all access (SEO allowed by default omission of header)
        return response;
    }

    // D. INTERNAL & PARTNER PORTALS
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
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set({ name, value, ...options }));
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // E. ROUTE ALLOWLISTS (Unauthenticated Access)
    const isAuthRoute =
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/reset-password');

    // 1. Internal Portals (AUMS, WE, LTFINANCE) - STRICT
    if (['aums', 'we', 'ltfinance'].includes(currentSubdomain)) {
        if (!user) {
            if (!isAuthRoute) {
                // Redirect to Login on SAME Subdomain
                const loginUrl = new URL('/login', request.url);
                return NextResponse.redirect(loginUrl);
            }
            return response; // Allow access to login
        }
        // If User is Authenticated, proceed to Role Check (below)
    }
    // 2. Partner Portals (Addbike, etc.) - Landing Page Allowed
    else {
        // Allow Public Landing Page logic
        const isLandingPage = pathname === '/';

        if (!user) {
            if (!isAuthRoute && !isLandingPage) {
                // Protect Dashboard, etc.
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('redirect_to', request.url);
                return NextResponse.redirect(loginUrl);
            }
            // Allow Landing or Login
            return response;
        }
        // User is Auth -> Fall through to Membership Check
    }

    // F. AUTHORIZATION (Authenticated User Checks)

    // 1. AUMS (Super Admin)
    if (currentSubdomain === 'aums') {
        const { data: membership } = await supabase
            .from('memberships')
            .select('role, tenants!inner(subdomain)')
            .eq('user_id', user.id)
            .eq('tenants.subdomain', 'aums')
            .eq('status', 'ACTIVE')
            .single();

        if (!membership || membership.role !== 'SUPER_ADMIN') {
            // 403 Forbidden - Rewrite to error page to preserve URL context
            // or Redirect to Login if we want to force switch? 
            // 403 is cleaner for "Wrong User".
            return NextResponse.rewrite(new URL('/403', request.url));
        }
        return response;
    }

    // 2. WE (Marketplace) - Replaces 'team'
    if (currentSubdomain === 'we') {
        // Strict check: must be a member of 'we' (or 'team' if slug migration is delayed, but document says done)
        const { data: membership } = await supabase
            .from('memberships')
            .select('id, tenants!inner(subdomain)')
            .eq('user_id', user.id)
            .eq('tenants.subdomain', 'we')
            .eq('status', 'ACTIVE') // Must be Active
            .single();

        if (!validMembership(membership)) {
            return NextResponse.rewrite(new URL('/403', request.url));
        }
        return response;
    }

    // 3. LTFINANCE (Bank)
    if (currentSubdomain === 'ltfinance') {
        // Similar check
        const { data: membership } = await supabase
            .from('memberships')
            .select('id, tenants!inner(subdomain)')
            .eq('user_id', user.id)
            .eq('tenants.subdomain', 'ltfinance')
            .eq('status', 'ACTIVE')
            .single();

        if (!validMembership(membership)) {
            return NextResponse.rewrite(new URL('/403', request.url));
        }
        return response;
    }

    // 4. PARTNER PORTALS (Dynamic Slugs e.g. addbike, myscooty)
    // Check if user has membership for THIS specific subdomain
    const { data: tenantMembership } = await supabase
        .from('memberships')
        .select('id, tenants!inner(subdomain)')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .eq('tenants.subdomain', currentSubdomain)
        .single();

    if (!tenantMembership) {
        // Logged in, but not a member of this partner
        return NextResponse.rewrite(new URL('/403', request.url));
    }

    // 5. Landing Page Redirect (for Partners)
    // If Auth & Member, and they hit '/', send to /dashboard
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
}

// Helper for cleaner membership check
function validMembership(data: any) {
    return data && data.tenants && data.tenants.subdomain;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
