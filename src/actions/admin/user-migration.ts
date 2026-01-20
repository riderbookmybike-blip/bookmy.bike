'use server';

import { adminClient } from '@/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

export interface UserMigrationResult {
    success: boolean;
    migratedCount: number;
    errors: string[];
}

export async function migrateUsersFromFirebase(batchSize = 1000): Promise<UserMigrationResult> {
    console.log('[User Migration] Starting robust high-performance migration batch...');
    const result: UserMigrationResult = {
        success: true,
        migratedCount: 0,
        errors: []
    };

    try {
        // 1. Fetch RAW rows
        const { data: rawRows, error: fetchError } = await adminClient
            .from('firebase_antigravity')
            .select('*') // Select all columns to preserve them in upsert
            .eq('root_collection', 'aapli-users')
            .eq('status', 'RAW')
            .limit(batchSize);

        if (fetchError) throw fetchError;
        if (!rawRows || rawRows.length === 0) return result;

        // 2. Fetch Mapping Config
        const { data: mappingData } = await adminClient
            .from('migration_field_mappings')
            .select('mapping_config')
            .eq('collection_name', 'aapli-users')
            .single();

        const mappingConfig = mappingData?.mapping_config as Record<string, string> || {};

        // 3. Prepare Batch Data
        const preparedProfiles: Record<string, any>[] = [];
        const stagingUpdates: any[] = [];

        for (const row of rawRows) {
            const firebaseData = row.data as Record<string, any>;
            const profileData: Record<string, any> = {
                id: uuidv4(),
                role: 'customer',
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            Object.entries(mappingConfig).forEach(([sourceKey, targetAction]) => {
                const value = firebaseData[sourceKey];
                if (!value || targetAction === 'IGNORE') return;

                if (targetAction.startsWith('NEW:')) {
                    const colName = targetAction.replace('NEW:', '');
                    const finalCol = colName.replace(/([A-Z])/g, "_$1").toLowerCase();
                    profileData[finalCol] = value;
                } else {
                    profileData[targetAction] = value;
                }
            });

            // Normalize Phone
            if (profileData.phone) {
                let phone = String(profileData.phone).replace(/\D/g, '');
                if (phone.length > 10) phone = phone.slice(-10);
                if (phone.length === 10) {
                    profileData.phone = `+91${phone}`;
                    preparedProfiles.push(profileData);
                }
            }

            // Prepare staging update (preserve all NOT NULL columns)
            stagingUpdates.push({
                ...row,
                status: 'MAPPED',
                updated_at: new Date().toISOString()
            });
        }

        if (preparedProfiles.length > 0) {
            const { error: upsertError } = await adminClient
                .from('profiles')
                .upsert(preparedProfiles, { onConflict: 'phone', ignoreDuplicates: false });

            if (upsertError) throw upsertError;
        }

        // 5. Bulk Update Staging Status (using all required columns)
        const { error: finalStagingError } = await adminClient
            .from('firebase_antigravity')
            .upsert(stagingUpdates, { onConflict: 'id' });

        if (finalStagingError) throw finalStagingError;

        result.migratedCount = rawRows.length;
        console.log(`[User Migration] Successfully processed ${rawRows.length} rows.`);

    } catch (e: any) {
        console.error('[User Migration] Batch Error:', e.message);
        result.success = false;
        result.errors.push(e.message);
    }

    return result;
}
