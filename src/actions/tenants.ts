'use server';

import { adminClient } from '@/lib/supabase/admin';

export async function getAllTenants(search?: string, type?: string) {
    let query = adminClient
        .from('id_tenants')
        .select('id, name, slug, type, location, logo_url, created_at')
        .order('name', { ascending: true });

    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
        console.error('getAllTenants error:', error);
        throw error;
    }

    return data || [];
}
