'use server';

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export type EntityType = 'MEMBER' | 'LEAD' | 'QUOTE' | 'BOOKING' | 'INVENTORY';

const TABLE_MAP: Record<EntityType, string> = {
    MEMBER: 'id_member_assets',
    LEAD: 'crm_lead_assets',
    QUOTE: 'crm_assets', // Keeping as fallback for now
    BOOKING: 'crm_booking_assets',
    INVENTORY: 'crm_assets', // Keeping as fallback for now
};

export async function uploadMediaAsset(
    file: { name: string; type: string; size: number },
    config: {
        entityType: EntityType;
        entityId: string;
        purpose: string;
        tenantId?: string;
        base64: string;
    }
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 1. Convert base64 to Buffer
    const buffer = Buffer.from(config.base64, 'base64');

    // 2. Generate path: {entityType}/{entityId}/{purpose}_{timestamp}.{ext}
    const ext = file.name.split('.').pop();
    const fileName = `${config.purpose}_${Date.now()}.${ext}`;
    const path = `${config.entityType.toLowerCase()}/${config.entityId}/${fileName}`;

    // 3. Upload to Supabase Storage
    const { data: storageData, error: storageError } = await adminClient.storage.from('vehicles').upload(path, buffer, {
        contentType: file.type,
        upsert: true,
    });

    if (storageError) throw storageError;

    // 4. Create record in domain-specific asset table
    const targetTable = TABLE_MAP[config.entityType] || 'crm_assets';

    const { data: asset, error: dbError } = await (adminClient as any)
        .from(targetTable)
        .insert({
            tenant_id: config.tenantId,
            entity_id: config.entityId,
            path: storageData.path,
            file_type: ext,
            purpose: config.purpose,
            uploaded_by: user?.id,
            metadata: {
                original_name: file.name,
                size: file.size,
            },
        })
        .select()
        .single();

    if (dbError) throw dbError;

    return asset;
}

export async function getMediaAssets(entityType: EntityType, entityId: string) {
    const supabase = await createClient();
    const targetTable = TABLE_MAP[entityType] || 'crm_assets';

    const { data, error } = await (supabase as any)
        .from(targetTable)
        .select('*')
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function deleteMediaAsset(assetId: string, entityType: EntityType) {
    const supabase = await createClient();
    const targetTable = TABLE_MAP[entityType] || 'crm_assets';

    // 1. Get path
    const { data: asset } = await (supabase as any).from(targetTable).select('path').eq('id', assetId).single();

    if (!asset) return;

    // 2. Delete from storage
    const { error: storageError } = await adminClient.storage.from('vehicles').remove([(asset as any).path]);

    if (storageError) throw storageError;

    // 3. Delete from DB
    const { error: dbError } = await (supabase as any).from(targetTable).delete().eq('id', assetId);

    if (dbError) throw dbError;
}
