'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));

export default function NotificationsClient() {
    const { tenantId } = useTenant();
    const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(tenantId || null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { unreadCount } = useUnreadNotifications(resolvedTenantId);

    useEffect(() => {
        if (tenantId) {
            setResolvedTenantId(tenantId);
            return;
        }

        const storedTenantId = localStorage.getItem('tenant_id');
        if (storedTenantId) {
            setResolvedTenantId(storedTenantId);
        }
    }, [tenantId]);

    const fetchNotifications = useCallback(async () => {
        if (!resolvedTenantId) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data, error } = await supabase
            .from('notifications')
            .select('id, title, message, type, is_read, created_at')
            .eq('tenant_id', resolvedTenantId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            setError(error.message);
            setNotifications([]);
            setLoading(false);
            return;
        }

        setNotifications((data || []) as NotificationItem[]);
        setLoading(false);
    }, [resolvedTenantId]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const unreadIds = useMemo(() => notifications.filter(item => !item.is_read).map(item => item.id), [notifications]);

    const markAllAsRead = async () => {
        if (!resolvedTenantId || unreadIds.length === 0) return;
        setSaving(true);

        const supabase = createClient();
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('tenant_id', resolvedTenantId)
            .eq('is_read', false);

        if (!error) {
            setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
        } else {
            setError(error.message);
        }

        setSaving(false);
    };

    const markSingleAsRead = async (id: string) => {
        const supabase = createClient();
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        if (error) {
            setError(error.message);
            return;
        }

        setNotifications(prev => prev.map(item => (item.id === id ? { ...item, is_read: true } : item)));
    };

    return (
        <div className="container mx-auto px-4 py-16 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Notifications</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {unreadCount > 0
                            ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}`
                            : 'All caught up'}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={saving || unreadIds.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:border-brand-primary/40 hover:text-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                    Mark All Read
                </button>
            </div>

            {error && (
                <div className="mb-6 rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-12 text-center">
                    <Bell className="mx-auto w-10 h-10 text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-lg font-black text-slate-700 dark:text-slate-200">No notifications yet</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        New workflow and pricing alerts will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map(item => (
                        <article
                            key={item.id}
                            className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                                item.is_read
                                    ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'
                                    : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        {item.type || 'SYSTEM'}
                                    </p>
                                    <h2 className="text-base font-black text-slate-900 dark:text-white mt-1">
                                        {item.title}
                                    </h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                                        {item.message}
                                    </p>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
                                        {formatDate(item.created_at)}
                                    </p>
                                </div>

                                {!item.is_read && (
                                    <button
                                        type="button"
                                        onClick={() => markSingleAsRead(item.id)}
                                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-300 hover:border-blue-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                                    >
                                        <CheckCheck size={12} />
                                        Mark Read
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
