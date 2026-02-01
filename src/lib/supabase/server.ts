import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { cookies, headers } from 'next/headers';

export async function createClient() {
    const cookieStore = await cookies();
    const headerList = await headers();
    const host = headerList.get('host') || '';

    const isLocalhost = host.includes('localhost') || host.startsWith('127.') || host.startsWith('0.0.0.0');

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
                                sameSite: 'lax',
                                secure: !isLocalhost,
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
