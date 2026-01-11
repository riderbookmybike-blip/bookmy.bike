'use client';

import React, { useEffect, useState } from 'react';
import { getDashboardStats, getRecentEvents, getLocationStats, AnalyticsStats, RecentEvent, LocationStat } from '@/actions/analytics';
import { Card } from '@/components/ui/Card';
import { Users, MousePointer, Clock, MapPin, Activity, Zap } from 'lucide-react';

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
    const [locations, setLocations] = useState<LocationStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, eventsData, locationData] = await Promise.all([
                    getDashboardStats(),
                    getRecentEvents(),
                    getLocationStats()
                ]);
                setStats(statsData);
                setRecentEvents(eventsData);
                setLocations(locationData);
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Optional: Auto-refresh every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="p-8 space-y-4 animate-pulse">
                <div className="h-32 bg-slate-100 rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-64 bg-slate-100 rounded-xl" />
                    <div className="h-64 bg-slate-100 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">User Activity Intelligence</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Live Updates
                </div>
            </div>

            {/* 1. Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Sessions"
                    value={stats?.totalSessions.toLocaleString() || '0'}
                    icon={Users}
                    color="text-blue-500"
                    bg="bg-blue-50"
                />
                <StatCard
                    title="Active Users (24h)"
                    value={stats?.activeUsers24h.toLocaleString() || '0'}
                    icon={Zap}
                    color="text-amber-500"
                    bg="bg-amber-50"
                />
                <StatCard
                    title="Avg. Duration"
                    value={`${stats?.avgSessionDuration || 0}s`}
                    icon={Clock}
                    color="text-emerald-500"
                    bg="bg-emerald-50"
                />
                <StatCard
                    title="Total Page Views"
                    value={stats?.totalPageViews.toLocaleString() || '0'}
                    icon={MousePointer}
                    color="text-purple-500"
                    bg="bg-purple-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2. Live Activity Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-slate-400" />
                            Recent Activity
                        </h3>
                        <div className="space-y-4">
                            {recentEvents.map((event) => (
                                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                    <div className={`p-2 rounded-full ${getEventColor(event.event_type)}`}>
                                        <ActivityIcon type={event.event_type} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-medium text-sm text-slate-900">
                                                {formatEventName(event)}
                                            </p>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                {getTimeAgo(event.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500 truncate max-w-[200px] bg-slate-100 px-2 py-0.5 rounded">
                                                {event.page_path}
                                            </span>
                                            {event.city && event.city !== 'Unknown' && (
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <MapPin className="w-3 h-3" />
                                                    {event.city}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* 3. Top Locations */}
                <div className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-slate-400" />
                            Top Cities
                        </h3>
                        <div className="space-y-3">
                            {locations.length === 0 ? (
                                <p className="text-sm text-slate-400">No location data yet.</p>
                            ) : (
                                locations.map((loc, idx) => (
                                    <div key={loc.city} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-mono w-5 h-5 flex items-center justify-center rounded ${idx < 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {idx + 1}
                                            </span>
                                            <span className="text-sm font-medium text-slate-700">{loc.city}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{loc.count}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Sub-components & Helpers

const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <Card className="p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-black text-slate-900">{value}</p>
        </div>
    </Card>
);

const ActivityIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'PAGE_VIEW': return <MousePointer className="w-4 h-4" />;
        case 'CLICK': return <MousePointer className="w-4 h-4" />;
        case 'FORM_SUBMIT': return <Zap className="w-4 h-4" />;
        default: return <Activity className="w-4 h-4" />;
    }
};

const getEventColor = (type: string) => {
    switch (type) {
        case 'PAGE_VIEW': return 'bg-blue-100 text-blue-600';
        case 'INTENT_SIGNAL': return 'bg-purple-100 text-purple-600';
        case 'FORM_SUBMIT': return 'bg-green-100 text-green-600';
        default: return 'bg-slate-100 text-slate-600';
    }
};

const formatEventName = (event: RecentEvent) => {
    if (event.event_type === 'PAGE_VIEW') return 'User visited a page';
    if (event.event_name) return event.event_name.replace(/_/g, ' ');
    return event.event_type;
};

const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
};
