import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const cookieStore = request.cookies;
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            request.cookies.set(name, value)
                        )
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // SUCCESS
            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error("Auth Callback Error:", error);
        }
    }

    // Helper: Return Error Page
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
