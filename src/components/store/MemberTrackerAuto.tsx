'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MemberTracker } from './MemberTracker';
import { mergeAnonSession } from '@/actions/member-tracker';
import { ANON_SESSION_KEY } from '@/lib/constants/storage';

function getOrCreateAnonSessionId(): string {
    if (typeof window === 'undefined') return crypto.randomUUID();
    let id = localStorage.getItem(ANON_SESSION_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(ANON_SESSION_KEY, id);
    }
    return id;
}

/**
 * Always-on tracker:
 * - Anonymous visitors tracked via anon_session_id from localStorage
 * - On login, merges anon events into the member's record (only rotates key on confirmed success)
 */
export function MemberTrackerAuto() {
    const [memberId, setMemberId] = useState<string | null>(null);
    const [anonSessionId, setAnonSessionId] = useState<string>('');
    const mergedRef = useRef(false);

    useEffect(() => {
        // Init anon session ID once on client
        setAnonSessionId(getOrCreateAnonSessionId());

        const supabase = createClient();

        // Seed from existing session (already logged in on mount)
        supabase.auth.getSession().then(({ data }) => {
            setMemberId(data.session?.user?.id ?? null);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            const userId = session?.user?.id ?? null;
            setMemberId(userId);

            // On sign-in: merge anon session into authenticated member
            if (event === 'SIGNED_IN' && userId && !mergedRef.current) {
                mergedRef.current = true; // prevent duplicate merge calls
                const currentAnonId = localStorage.getItem(ANON_SESSION_KEY);
                if (currentAnonId) {
                    mergeAnonSession(currentAnonId).then(result => {
                        if (result.ok) {
                            // Confirmed success — rotate the anon key
                            localStorage.removeItem(ANON_SESSION_KEY);
                            const freshId = crypto.randomUUID();
                            localStorage.setItem(ANON_SESSION_KEY, freshId);
                            setAnonSessionId(freshId);
                        }
                        // ok === false → keep existing anon ID for continuity
                    });
                }
            }

            // On sign-out: reset merge guard so next login can merge fresh anon session
            if (event === 'SIGNED_OUT') {
                mergedRef.current = false;
                setAnonSessionId(getOrCreateAnonSessionId());
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Don't render until anon ID is ready (avoids SSR mismatch)
    if (!anonSessionId) return null;

    return <MemberTracker memberId={memberId} anonSessionId={anonSessionId} />;
}
