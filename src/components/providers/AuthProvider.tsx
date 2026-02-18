'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type AuthContextValue = {
    user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const REFRESH_DEBOUNCE_MS = 2000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const lastRefreshRef = useRef<number>(0);

    useEffect(() => {
        const supabase = createClient();

        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user ?? null);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);

            if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
                return;
            }

            const now = Date.now();
            if (now - lastRefreshRef.current < REFRESH_DEBOUNCE_MS) {
                return;
            }

            lastRefreshRef.current = now;
            router.refresh();
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const value = useMemo(() => ({ user }), [user]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
