'use client';

import React from 'react';
import { MessageSquare, Phone, Mail, Link as LinkIcon } from 'lucide-react';

type InboxTimelineEvent = {
    id: string;
    title: string;
    timestamp?: string | null;
};

interface UnifiedInboxPanelProps {
    memberId?: string | null;
    leadId?: string | null;
    quoteId?: string | null;
    bookingId?: string | null;
    phone?: string | null;
    email?: string | null;
    timelineEvents?: InboxTimelineEvent[];
}

function formatDateTime(value?: string | null) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return value;
    }
}

export default function UnifiedInboxPanel({
    memberId,
    leadId,
    quoteId,
    bookingId,
    phone,
    email,
    timelineEvents = [],
}: UnifiedInboxPanelProps) {
    return (
        <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unified Inbox</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-widest">
                    Msg91 Hello Link Ready
                </span>
            </div>

            <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Contact</p>
                        <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                                <Phone size={12} className="text-slate-400" />
                                <span className="font-bold">{phone || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={12} className="text-slate-400" />
                                <span className="font-bold break-all">{email || '—'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            Context Links
                        </p>
                        <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                            <div>
                                Member: <span className="font-black">{memberId || '—'}</span>
                            </div>
                            <div>
                                Lead: <span className="font-black">{leadId || '—'}</span>
                            </div>
                            <div>
                                Quote: <span className="font-black">{quoteId || '—'}</span>
                            </div>
                            <div>
                                Booking: <span className="font-black">{bookingId || '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <LinkIcon size={12} className="text-indigo-500" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                            Recent Activity
                        </p>
                    </div>
                    {timelineEvents.length === 0 ? (
                        <p className="text-xs text-slate-400">No activity yet.</p>
                    ) : (
                        <div className="space-y-1.5">
                            {timelineEvents.slice(0, 6).map(event => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between gap-3 text-xs border border-slate-100 dark:border-white/10 rounded-lg px-2.5 py-2 bg-white dark:bg-white/[0.02]"
                                >
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                        {event.title}
                                    </span>
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                        {formatDateTime(event.timestamp)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
