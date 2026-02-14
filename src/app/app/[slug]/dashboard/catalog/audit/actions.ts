'use server';

import { adminClient } from '@/lib/supabase/admin';

export interface AuditLogEntry {
    id: string;
    table_name: string;
    record_id: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    old_data: Record<string, any> | null;
    new_data: Record<string, any> | null;
    changed_fields: string[] | null;
    actor_id: string | null;
    actor_label: string;
    created_at: string;
    // Resolved fields (joined)
    record_name?: string;
    actor_name?: string | null;
}

export interface AuditLogFilters {
    tableName?: string;
    action?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export async function fetchAuditLogs(filters: AuditLogFilters = {}) {
    const { tableName, action, search, dateFrom, dateTo, page = 1, limit = 50 } = filters;

    let query = adminClient
        .from('catalog_audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (tableName && tableName !== 'ALL') {
        query = query.eq('table_name', tableName);
    }
    if (action && action !== 'ALL') {
        query = query.eq('action', action);
    }
    if (dateFrom) {
        query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
        query = query.lte('created_at', dateTo);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Failed to fetch audit logs:', error);
        return { logs: [], total: 0, error: error.message };
    }

    // Resolve record names from cat_items for better readability
    const logs = data || [];
    const itemIds = new Set<string>();
    logs.forEach(log => {
        itemIds.add(log.record_id);
        // For cat_price_state, try to get the SKU name from new_data or old_data
        if (log.table_name === 'cat_price_state') {
            const vcId = log.new_data?.vehicle_color_id || log.old_data?.vehicle_color_id;
            if (vcId) itemIds.add(vcId);
        }
    });

    // Batch resolve names
    const nameMap = new Map<string, string>();
    if (itemIds.size > 0) {
        const { data: items } = await adminClient
            .from('cat_items')
            .select('id, name, type')
            .in('id', Array.from(itemIds));
        items?.forEach(item => nameMap.set(item.id, `${item.name} (${item.type})`));
    }

    const actorIds = Array.from(new Set(logs.map(l => l.actor_id).filter(Boolean))) as string[];
    const actorNameMap = new Map<string, string>();
    if (actorIds.length > 0) {
        const { data: members } = await adminClient.from('id_members').select('id, full_name').in('id', actorIds);
        members?.forEach(m => {
            if (m.id && m.full_name) actorNameMap.set(m.id, m.full_name);
        });
    }

    // Enrich logs with resolved names
    const enriched: AuditLogEntry[] = logs.map(log => {
        let recordName = nameMap.get(log.record_id) || log.record_id;
        if (log.table_name === 'cat_price_state') {
            const vcId = log.new_data?.vehicle_color_id || log.old_data?.vehicle_color_id;
            if (vcId && nameMap.has(vcId)) {
                recordName = nameMap.get(vcId)!;
            }
        }
        return {
            ...log,
            record_name: recordName,
            actor_name: log.actor_id ? actorNameMap.get(log.actor_id) || null : null,
        };
    });

    return { logs: enriched, total: count || 0, error: null };
}
// @ts-nocheck
