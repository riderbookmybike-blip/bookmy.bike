'use server';

import { adminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/supabase';

type AuditRow = Database['public']['Tables']['crm_audit_log']['Row'];

export interface AuditLogEntry extends AuditRow {
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
        .from('crm_audit_log')
        .select('*', { count: 'exact' })
        .order('performed_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (tableName && tableName !== 'ALL') {
        query = query.eq('entity_type', tableName);
    }
    if (action && action !== 'ALL') {
        query = query.eq('action', action);
    }
    if (dateFrom) {
        query = query.gte('performed_at', dateFrom);
    }
    if (dateTo) {
        query = query.lte('performed_at', dateTo);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Failed to fetch audit logs:', error);
        return { logs: [], total: 0, error: error.message };
    }

    // Resolve record names from V2 catalog tables for better readability
    const logs = (data as AuditRow[]) || [];
    const itemIds = new Set<string>();
    logs.forEach(log => {
        itemIds.add(log.entity_id);
        // For cat_price_state, try to get the SKU name from new_data or old_data
        if (log.entity_type === 'cat_price_state') {
            const vcId = (log.new_data as any)?.vehicle_color_id || (log.old_data as any)?.vehicle_color_id;
            if (vcId) itemIds.add(vcId);
        }
    });

    // Batch resolve names from V2 catalog tables
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

    const actorIds = Array.from(new Set(logs.map(l => l.performed_by).filter(Boolean))) as string[];
    const actorNameMap = new Map<string, string>();
    if (actorIds.length > 0) {
        const { data: members } = await adminClient.from('id_members').select('id, full_name').in('id', actorIds);
        members?.forEach(m => {
            if (m.id && m.full_name) actorNameMap.set(m.id, m.full_name);
        });
    }

    // Enrich logs with resolved names
    const enriched: AuditLogEntry[] = logs.map(log => {
        let recordName = nameMap.get(log.entity_id) || log.entity_id;
        if (log.entity_type === 'cat_price_state') {
            const vcId = (log.new_data as any)?.vehicle_color_id || (log.old_data as any)?.vehicle_color_id;
            if (vcId && nameMap.has(vcId)) {
                recordName = nameMap.get(vcId)!;
            }
        }
        return {
            ...log,
            record_name: recordName,
            actor_name: log.performed_by ? actorNameMap.get(log.performed_by) || null : null,
        };
    });

    return { logs: enriched, total: count || 0, error: null };
}
