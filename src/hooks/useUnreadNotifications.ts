'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useUnreadNotifications(tenantId?: string | null) {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!tenantId) {
            setUnreadCount(0);
            return;
        }

        const supabase = createClient();
        let active = true;

        const fetchUnreadCount = async () => {
            const { count, error } = await supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .eq('is_read', false);

            if (!active) return;
            if (error) {
                console.warn('[Notifications] Failed to fetch unread count:', error.message);
                setUnreadCount(0);
                return;
            }

            setUnreadCount(count || 0);
        };

        fetchUnreadCount();

        const channel = supabase
            .channel(`notifications-unread-${tenantId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `tenant_id=eq.${tenantId}`,
                },
                () => {
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            active = false;
            supabase.removeChannel(channel);
        };
    }, [tenantId]);

    return {
        unreadCount,
        hasUnread: unreadCount > 0,
    };
}
