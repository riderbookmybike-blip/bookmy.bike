'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MemberTracker } from './MemberTracker';

declare global {
    interface Window {
        Tawk_API?: {
            setAttributes?: (attrs: Record<string, string>, cb?: () => void) => void;
            onLoad?: () => void;
        };
    }
}

/**
 * Subscribes to Supabase auth state changes so tracking starts even when
 * the user logs in mid-session (e.g., via sidebar OTP flow).
 * Also links member identity to Tawk.to for real-time visitor dashboard.
 */
export function MemberTrackerAuto() {
    const [memberId, setMemberId] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const uid = session?.user?.id ?? null;
            setMemberId(uid);

            if (uid) {
                // Fetch member name + phone for Tawk.to identity
                const { data } = await supabase
                    .from('id_members')
                    .select('full_name, primary_phone')
                    .eq('id', uid)
                    .maybeSingle();

                const setTawkIdentity = () => {
                    if (typeof window !== 'undefined' && window.Tawk_API?.setAttributes) {
                        window.Tawk_API.setAttributes(
                            {
                                name: data?.full_name || 'Member',
                                ...(data?.primary_phone ? { phone: data.primary_phone } : {}),
                            },
                            () => {}
                        );
                    }
                };

                // Tawk may still be loading — retry via onLoad if not ready
                if (typeof window !== 'undefined' && window.Tawk_API?.setAttributes) {
                    setTawkIdentity();
                } else if (typeof window !== 'undefined') {
                    window.Tawk_API = window.Tawk_API || {};
                    const prev = window.Tawk_API.onLoad;
                    window.Tawk_API.onLoad = () => {
                        prev?.();
                        setTawkIdentity();
                    };
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (!memberId) return null;
    return <MemberTracker memberId={memberId} />;
}
