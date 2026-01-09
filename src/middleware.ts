import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    // 1. Define Domains
    // In production, these should be env vars, but hardcoding for stability in this phase
    const ROOT_DOMAIN = 'bookmy.bike'; // e.g. localhost:3000 in dev
    const AUMS_PREFIX = 'aums';
    const ME_PREFIX = 'me';

    // Parse Subdomain
    const isLocal = hostname.includes('localhost');
    const domainParts = hostname.split('.');

    // For localhost, we might simulate subdomains or use path prefixes?
    // Assuming we use standard DNS mapping or localtest.me
    // Current user context implies direct hostname usage.

    let currentSubdomain = '';
    if (hostname.endsWith(ROOT_DOMAIN)) {
        const diff = hostname.replace(`.${ROOT_DOMAIN}`, '').replace(ROOT_DOMAIN, '');
        if (diff && diff !== 'www') currentSubdomain = diff;
    }

    // A. PUBLIC/STATIC ASSETS -> PASS
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') // public files like .svg, .ico
    ) {
        return NextResponse.next();
    }

    // A2. SEO / Public Store -> Currently on main domain (www or root)?
    // User requirement: "me.bookmy.bike -> login hub", "slug.bookmy.bike -> dashboard"
    // Does the ROOT domain (bookmy.bike) still serve the Store?
    // "Phase 3: <slug>.bookmy.bike -> membership only"
    // Implicitly: bookmy.bike (no subdomain) is the Store?
    // Let's assume root domain (without 'me', 'aums', or slug) is the Public Store.
    if (!currentSubdomain || currentSubdomain === 'www') {
        // Logic for Public Store (Phase 3 doesn't change this mostly, but let's be safe)
        // Allow access to store routes
        return NextResponse.next();
    }

    // B. AUTHENTICATION (Global Check)
    const response = NextResponse.next();
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

    // C. ROUTING LOGIC

    // 1. ME.BOOKMY.BIKE (Login Hub)
    if (currentSubdomain === ME_PREFIX) {
        if (!user) {
            // Unauthenticated -> Show Login Page
            // If path is NOT /login, rewrite to /login (or just allow / to show login component)
            if (pathname === '/login' || pathname === '/') {
                return NextResponse.rewrite(new URL('/login', request.url));
            }
            return NextResponse.redirect(new URL('/login', request.url));
        } else {
            // Authenticated -> HUB LOGIC
            // Redirect user to their Active Tenant

            // 1. Fetch Memberships (Fast Cache-friendly query)
            const { data: memberships } = await supabase
                .from('memberships')
                .select('*, tenants(subdomain)')
                .eq('user_id', user.id)
                .eq('status', 'ACTIVE'); // Active only

            if (!memberships || memberships.length === 0) {
                // No Access -> Show Specific Error Page on ME
                // (Rewrite to a NoAccess component if it exists, or Login with error)
                return NextResponse.rewrite(new URL('/no-access', request.url));
            }

            // 2. Select Target Tenant
            let targetSlug = '';

            if (memberships.length === 1) {
                targetSlug = memberships[0].tenants?.subdomain;
            } else {
                // Multi-Membership
                const defaultMem = memberships.find(m => m.is_default);
                targetSlug = defaultMem?.tenants?.subdomain || memberships[0].tenants?.subdomain;

                // FUTURE: If URL has ?select=true, show clean workspace selector
            }

            if (targetSlug) {
                const newUrl = new URL(`https://${targetSlug}.${ROOT_DOMAIN}/dashboard`);
                return NextResponse.redirect(newUrl);
            }

            return NextResponse.next();
        }
    }

    // 2. AUMS or TENANT SUBDOMAINS
    // All other subdomains REQUIRE Authentication
    if (!user) {
        // Redirect to ME login
        const loginUrl = new URL(`https://${ME_PREFIX}.${ROOT_DOMAIN}/login`);
        loginUrl.searchParams.set('redirect_to', request.url); // Preserve intent
        return NextResponse.redirect(loginUrl);
    }

    // 3. AUMS.BOOKMY.BIKE (Super Admin Only)
    if (currentSubdomain === AUMS_PREFIX) {
        // Verify AUMS Access
        const { data: membership } = await supabase
            .from('memberships')
            .select('role, tenants!inner(subdomain)')
            .eq('user_id', user.id)
            .eq('tenants.subdomain', 'aums') // Explicit check for AUMS slug
            .eq('status', 'ACTIVE')
            .single();

        if (!membership || membership.role !== 'SUPER_ADMIN') {
            // ACCESS DENIED -> Kick to ME
            return NextResponse.redirect(new URL(`https://${ME_PREFIX}.${ROOT_DOMAIN}`, request.url));
        }

        // Access Granted -> Rewrite to /dashboard
        // (Assuming AUMS dashboard pages live in strict /dashboard paths)
        if (pathname === '/') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // 4. TENANT DASHBOARDS (<slug>.bookmy.bike)
    // Verify user has membership for THIS specific subdomain
    const { data: validMembership } = await supabase
        .from('memberships')
        .select('id, tenants!inner(subdomain)')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .eq('tenants.subdomain', currentSubdomain) // INNER JOIN on subdomain
        .single(); // Should be unique per user-tenant

    if (!validMembership) {
        // ACCESS DENIED (User logged in, but not for this tenant)
        // Redirect to Hub to find where they belong
        return NextResponse.redirect(new URL(`https://${ME_PREFIX}.${ROOT_DOMAIN}`, request.url));
    }

    // Valid Membership -> Allow Access
    // Force Rewrite to /dashboard root if they hit landing
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
