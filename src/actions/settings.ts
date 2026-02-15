'use server';

import { adminClient } from '@/lib/supabase/admin';

export type SystemSettings = {
    unified_marketplace_context: boolean;
    unified_context_strict_mode: boolean;
    default_owner_tenant_id: string | null;
};

/**
 * Fetch global system settings from sys_settings table.
 * Used for feature flags and global behavioral controls.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
    try {
        const { data, error } = await adminClient
            .from('sys_settings')
            .select('unified_marketplace_context, unified_context_strict_mode, default_owner_tenant_id')
            .maybeSingle();

        if (error) {
            console.error('[getSystemSettings] Error:', error);
            return {
                unified_marketplace_context: false,
                unified_context_strict_mode: true,
                default_owner_tenant_id: null,
            };
        }

        return {
            unified_marketplace_context: (data as any)?.unified_marketplace_context ?? false,
            unified_context_strict_mode: (data as any)?.unified_context_strict_mode ?? true,
            default_owner_tenant_id: (data as any)?.default_owner_tenant_id || null,
        };
    } catch (err) {
        console.error('[getSystemSettings] Fatal:', err);
        return {
            unified_marketplace_context: false,
            unified_context_strict_mode: true,
            default_owner_tenant_id: null,
        };
    }
}
