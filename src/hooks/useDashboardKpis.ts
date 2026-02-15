'use client';

import { useEffect, useState } from 'react';
import { getDealerDashboardKpis, type DashboardKpis } from '@/actions/dashboardKpis';

interface UseDashboardKpisResult {
    kpis: DashboardKpis | null;
    loading: boolean;
}

/**
 * Client hook to fetch KPI telemetry for the dealer dashboard.
 * Falls back gracefully when tenant is not yet resolved.
 */
export function useDashboardKpis(tenantId?: string | null): UseDashboardKpisResult {
    const [kpis, setKpis] = useState<DashboardKpis | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!tenantId) {
            setKpis(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        getDealerDashboardKpis(tenantId)
            .then(data => {
                if (!cancelled) setKpis(data);
            })
            .catch(err => {
                if (!cancelled) console.error('Failed to load dealer KPIs', err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [tenantId]);

    return { kpis, loading };
}

export default useDashboardKpis;
