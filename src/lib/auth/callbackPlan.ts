import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        // ...
                    },
                    setAll(cookiesToSet) {
                        // ...
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // SUCCESS
            // Check if user has membership for THIS subdomain?
            // Middleware handles that check on the /dashboard route anyway.
            // So straightforward redirect is fine.

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Helper: Return Error Page
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
