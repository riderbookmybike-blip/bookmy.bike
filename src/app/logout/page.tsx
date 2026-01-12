'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutPage() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const performLogout = async () => {
            try {
                // 1. Sign out from Supabase (with timeout to prevent hanging)
                const signOutPromise = supabase.auth.signOut();
                const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));
                await Promise.race([signOutPromise, timeoutPromise]);
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                // 2. Clear local storage (Always run this)
                localStorage.clear(); // Clear all app data

                // 3. Clear cookies
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });

                // 4. Redirect to login
                router.replace('/login');
            }
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
