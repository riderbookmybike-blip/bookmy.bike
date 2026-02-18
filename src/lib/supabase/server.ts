import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { cookies, headers } from 'next/headers';
import { resolveCookieDomain } from '@/lib/supabase/cookieDomain';

export async function createClient() {
    const cookieStore = await cookies();
    const headerList = await headers();
    const host = headerList.get('host') || '';
    const proto = headerList.get('x-forwarded-proto') || 'http';
    const cookieDomain = resolveCookieDomain(host, process.env.NEXT_PUBLIC_COOKIE_DOMAIN);
    const isHttps = proto === 'https';

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, {
                                ...options,
                                path: '/',
                                domain: cookieDomain,
                                sameSite: 'lax',
                                secure: isHttps,
                            });
                        });
                    } catch {
                        // Server Component setAll failure (expected in some cases)
                    }
                },
            },
        }
    );
}
