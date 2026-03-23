'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MemberTracker } from './MemberTracker';

/**
 * Subscribes to Supabase auth state changes so tracking starts even when
 * the user logs in mid-session (e.g., via sidebar OTP flow).
 */
export function MemberTrackerAuto() {
    const [memberId, setMemberId] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const uid = session?.user?.id ?? null;
            setMemberId(uid);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (!memberId) return null;
    return <MemberTracker memberId={memberId} />;
}
