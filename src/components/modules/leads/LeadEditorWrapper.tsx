'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getLeadById, getQuotesForLead, getBookingsForLead, getReceiptsForEntity } from '@/actions/crm';

const LeadEditorTable = dynamic(() => import('@/components/modules/leads/LeadEditorTable'), {
    loading: () => (
        <div className="p-4 sm:p-8 md:p-12 space-y-6 sm:space-y-8 animate-pulse">
            <div className="h-32 sm:h-40 bg-slate-100 dark:bg-white/5 rounded-2xl sm:rounded-[2.5rem]" />
            <div className="h-48 sm:h-64 bg-slate-100 dark:bg-white/5 rounded-2xl sm:rounded-[2.5rem]" />
        </div>
    ),
});

export default function LeadEditorWrapper({ leadId }: { leadId: string }) {
    const { tenantId } = useTenant();
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!leadId) return;
        setLoading(true);
        setError(null);

        const load = async () => {
            try {
                const lead = await getLeadById(leadId);
                if (!lead) {
                    setProfile(null);
                    return;
                }
                const [quotes, bookings, receipts] = await Promise.all([
                    getQuotesForLead(leadId),
                    getBookingsForLead(leadId),
                    getReceiptsForEntity(leadId, lead.customerId || null),
                ]);

                setProfile({
                    lead,
                    quotes: quotes || [],
                    bookings: bookings || [],
                    receipts: receipts || [],
                });
            } catch (err: any) {
                console.error('LeadEditorWrapper: failed to load profile', { leadId, err });
                setError(err?.message || 'Failed to load lead profile');
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [leadId, tenantId]);

    if (loading) {
        return (
            <div className="p-4 sm:p-8 md:p-12 space-y-6 sm:space-y-8 animate-pulse">
                <div className="h-32 sm:h-40 bg-slate-100 dark:bg-white/5 rounded-2xl sm:rounded-[2.5rem]" />
                <div className="h-48 sm:h-64 bg-slate-100 dark:bg-white/5 rounded-2xl sm:rounded-[2.5rem]" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-12 text-sm text-slate-400">
                Lead not found.
                {error ? <div className="text-xs text-rose-500 mt-2">{error}</div> : null}
            </div>
        );
    }

    return <LeadEditorTable profile={profile} />;
}
