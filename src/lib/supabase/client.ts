import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

export function createClient() {
    // Check if we are on client side
    const isClient = typeof window !== 'undefined';

    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                path: '/',
                sameSite: 'lax',
                secure: isClient && window.location.protocol === 'https:',
            },
        }
    );
}
