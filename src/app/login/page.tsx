'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') || '/';
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.replace(next);
            } else {
                // Trigger the global login sidebar
                window.dispatchEvent(new CustomEvent('openLogin'));
                // Optionally redirect to home to show the sidebar over the storefront
                if (window.location.pathname !== '/') {
                    router.replace('/?login=true&next=' + encodeURIComponent(next));
                }
            }
        };

        checkUser();
    }, [router, next, supabase.auth]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Checking session...</p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <LoginContent />
        </Suspense>
    );
}
