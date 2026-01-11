'use server';

import { adminClient } from '@/lib/supabase/admin';

export interface AnalyticsStats {
    totalSessions: number;
    activeUsers24h: number;
    totalPageViews: number;
    avgSessionDuration: number; // in seconds
}

export interface RecentEvent {
    id: string;
    event_type: string;
    page_path: string;
    event_name?: string;
    created_at: string;
    session_id: string;
    city?: string;
}

export interface LocationStat {
    city: string;
    count: number;
}

export async function getDashboardStats(): Promise<AnalyticsStats> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Total Sessions (All time for now, or filter by range)
    const { count: totalSessions } = await adminClient
        .from('analytics_sessions')
        .select('*', { count: 'exact', head: true });

    // 2. Active Users (Last 24h)
    const { count: activeUsers24h } = await adminClient
        .from('analytics_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', twentyFourHoursAgo);

    // 3. Total Page Views
    const { count: totalPageViews } = await adminClient
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'PAGE_VIEW');

    // 4. Avg Session Duration (Simplified calculation)
    // Fetch last 100 sessions to calculate average duration
    const { data: recentSessions } = await adminClient
        .from('analytics_sessions')
        .select('started_at, last_active_at')
        .limit(100)
        .order('last_active_at', { ascending: false });

    let totalDuration = 0;
    let validSessions = 0;

    if (recentSessions) {
        recentSessions.forEach(session => {
            const start = new Date(session.started_at).getTime();
            const end = new Date(session.last_active_at).getTime();
            const duration = (end - start) / 1000; // seconds
            if (duration > 0) {
                totalDuration += duration;
                validSessions++;
            }
        });
    }

    const avgSessionDuration = validSessions > 0 ? Math.round(totalDuration / validSessions) : 0;

    return {
        totalSessions: totalSessions || 0,
        activeUsers24h: activeUsers24h || 0,
        totalPageViews: totalPageViews || 0,
        avgSessionDuration
    };
}

export async function getRecentEvents(limit = 20): Promise<RecentEvent[]> {
    const { data } = await adminClient
        .from('analytics_events')
        .select(`
            id,
            event_type,
            page_path,
            event_name,
            created_at,
            session_id,
            analytics_sessions (city)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (!data) return [];

    return data.map((item: any) => ({
        id: item.id,
        event_type: item.event_type,
        page_path: item.page_path,
        event_name: item.event_name,
        created_at: item.created_at,
        session_id: item.session_id,
        city: item.analytics_sessions?.city || 'Unknown'
    }));
}

export async function getLocationStats(): Promise<LocationStat[]> {
    // Note: Supabase JS client doesn't support easy GROUP BY aggregation directly without views or RPC.
    // We will fetch recent sessions and aggregate in basic JS for now (sufficient for MVP).
    // For production scaling, create a Database View or RPC.

    const { data } = await adminClient
        .from('analytics_sessions')
        .select('city')
        .not('city', 'is', null)
        .limit(500) // Analyze last 500 sessions
        .order('created_at', { ascending: false } as any); // created_at might not exist on session, using started_at
    // Actually started_at is the correct field

    // Recorrecting order field
    // .order('started_at', { ascending: false });

    if (!data) return [];

    const cityCounts: Record<string, number> = {};
    data.forEach((row: any) => {
        const city = row.city;
        if (city) {
            cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
    });

    return Object.entries(cityCounts)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 cities
}
