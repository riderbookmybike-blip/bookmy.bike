'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoginSidebar from '@/components/auth/LoginSidebar';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') || '/';
    const supabase = createClient();
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                router.replace(next);
            }
        };

        checkUser();
    }, [router, next, supabase.auth]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <LoginSidebar
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen(false);
                    router.replace('/');
                }}
                redirectTo={next}
                variant="RETAIL"
            />
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Opening login...</p>
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
