'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutPage() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const performLogout = async () => {
            // 1. Sign out from Supabase
            await supabase.auth.signOut();

            // 2. Clear local storage
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_role');
            localStorage.removeItem('active_role');
            localStorage.removeItem('sb-access-token');

            // 3. Clear cookies (Supabase client usually handles this, but we force it)
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            // 4. Redirect to login
            router.replace('/login');
        };

        performLogout();
    }, [router, supabase.auth]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 font-sans text-white">
            <div className="flex flex-col items-center gap-6 animate-pulse">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-[0.4em] italic">Terminating Session...</p>
            </div>
        </div>
    );
}
