'use server';

import { adminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/supabase';

type AuditRow = Database['public']['Tables']['catalog_audit_log']['Row'];

export interface AuditLogEntry {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    old_data: any;
    new_data: any;
    changed_fields: string[] | null;
    performed_at: string;
    performed_by: string | null;
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
    const { tableName, action, search, page = 1, limit = 50 } = filters;

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

    const { data, error, count } = await query;

    if (error) {
        console.error('Failed to fetch audit logs:', error);
        return { logs: [], total: 0, error: error.message };
    }

    // Resolve record names from V2 catalog tables for better readability
    const rawLogs = (data as AuditRow[]) || [];
    const itemIds = new Set<string>();
    rawLogs.forEach(log => {
        if (log.record_id) itemIds.add(log.record_id);
    });

    // Batch resolve names
    const nameMap = new Map<string, string>();
    if (itemIds.size > 0) {
        const idsArr = Array.from(itemIds);
        const [skuRes, modelRes] = await Promise.all([
            (adminClient as any).from('cat_skus').select('id, name').in('id', idsArr),
            (adminClient as any).from('cat_models').select('id, name').in('id', idsArr),
        ]);
        skuRes.data?.forEach((item: any) => nameMap.set(item.id, `${item.name} (SKU)`));
        modelRes.data?.forEach((item: any) => {
            if (!nameMap.has(item.id)) nameMap.set(item.id, `${item.name} (Model)`);
        });
    }

    const actorIds = Array.from(new Set(rawLogs.map(l => l.actor_id).filter(Boolean))) as string[];
    const actorNameMap = new Map<string, string>();
    if (actorIds.length > 0) {
        const { data: members } = await adminClient.from('id_members').select('id, full_name').in('id', actorIds);
        members?.forEach(m => {
            if (m.id && m.full_name) actorNameMap.set(m.id, m.full_name);
        });
    }

    // Map and Enrich logs
    const enriched: AuditLogEntry[] = rawLogs.map(log => {
        const entityId = log.record_id || '';
        const recordName = nameMap.get(entityId) || entityId;

        return {
            id: log.id,
            entity_type: log.table_name || 'unknown',
            entity_id: entityId,
            action: log.action || 'UPDATE',
            old_data: log.old_data,
            new_data: log.new_data,
            changed_fields: log.changed_fields as string[] | null,
            performed_at: log.created_at || new Date().toISOString(),
            performed_by: log.actor_id,
            record_name: recordName,
            actor_name: log.actor_id
                ? actorNameMap.get(log.actor_id) || log.actor_label || null
                : log.actor_label || null,
        };
    });

    return { logs: enriched, total: count || 0, error: null };
}
