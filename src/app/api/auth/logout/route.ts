import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { resolveCookieDomain } from '@/lib/supabase/cookieDomain';

export async function POST(request: Request) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Handle server action/middleware context limitations if any
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Handle server action/middleware context limitations if any
                    }
                },
            },
        }
    );

    // 0. CSRF/Origin Check (Lightweight)
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // In production, ensure the request comes from our own domain
    if (process.env.NODE_ENV === 'production' && origin) {
        const originHost = new URL(origin).host;
        // Allow if origin host matches request host OR ends with .bookmy.bike
        if (originHost !== host && !originHost.endsWith('.bookmy.bike')) {
            console.error(`[LogoutAPI] CSRF Mismatch: Origin ${originHost} vs Host ${host}`);
            // Proceed with caution or block? For now, we proceed but log, or return 403.
            // Given this is logout (destructive into safe state), we can be slightly lenient,
            // but strictly correct is to block. Let's block external invocations.
            return NextResponse.json({ success: false, message: 'Invalid Origin' }, { status: 403 });
        }
    }

    // 1. Sign out from Supabase (Revokes token on server if possible and asks to clear cookies)
    await supabase.auth.signOut();

    const response = NextResponse.json({ success: true });

    // 2. Explicitly clear our custom middleware cookie
    const cookieDomain = resolveCookieDomain(host || '', process.env.NEXT_PUBLIC_COOKIE_DOMAIN);

    response.cookies.set('aums_session', '', {
        path: '/',
        domain: cookieDomain,
        expires: new Date(0),
    });

    // 3. Dynamic Cookie Clearing (Clear ALL sb- cookies)
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
        if (cookie.name.startsWith('sb-')) {
            response.cookies.set(cookie.name, '', {
                path: '/',
                domain: cookieDomain,
                expires: new Date(0),
            });
            // Safety: Also try clearing without domain in case it was set locally
            response.cookies.set(cookie.name, '', {
                path: '/',
                expires: new Date(0),
            });
        }
    });

    // 4. No Cache Header
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');

    return response;
}
