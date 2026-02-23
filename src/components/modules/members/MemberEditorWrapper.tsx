'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getMemberFullProfile } from '@/actions/members';

const MemberEditorTable = dynamic(() => import('@/components/modules/members/MemberEditorTable'), {
    loading: () => (
        <div className="p-12 space-y-8 animate-pulse">
            <div className="h-40 bg-slate-100 dark:bg-white/5 rounded-[2.5rem]" />
            <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-[2.5rem]" />
        </div>
    ),
});

export default function MemberEditorWrapper({ memberId }: { memberId: string }) {
    const { tenantId } = useTenant();
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!memberId) return;
        setLoading(true);
        setError(null);
        getMemberFullProfile(memberId)
            .then(data => setProfile(data))
            .catch(err => {
                console.error('MemberEditorWrapper: failed to load profile', { memberId, err });
                setError(err?.message || 'Failed to load member profile');
                setProfile(null);
            })
            .finally(() => setLoading(false));
    }, [memberId, tenantId]);

    if (loading) {
        return (
            <div className="p-12 space-y-8 animate-pulse">
                <div className="h-40 bg-slate-100 dark:bg-white/5 rounded-[2.5rem]" />
                <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-[2.5rem]" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-12 text-sm text-slate-400">
                Member not found.
                {error ? <div className="text-xs text-rose-500 mt-2">{error}</div> : null}
            </div>
        );
    }

    return <MemberEditorTable profile={profile} />;
}
