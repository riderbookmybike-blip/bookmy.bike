import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export async function createClient() {
    const cookieStore = await cookies();
    const headerList = await headers();
    const host = headerList.get('host') || '';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';
    const isLocalhost = host.includes('localhost') || host.startsWith('127.') || host.startsWith('0.0.0.0');
    const cookieDomain = !isLocalhost ? `.${rootDomain}` : undefined;

    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        const safeOptions = options ?? {};
                        cookieStore.set(name, value, {
                            ...safeOptions,
                            ...(cookieDomain && !safeOptions.domain ? { domain: cookieDomain } : {}),
                        });
                    });
                } catch {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
        },
    });
}
