
// scripts/bulk-import-aapli-users.ts
import { importFirebaseCollection } from '../src/actions/admin/firebase-migration';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

async function run() {
    console.log('🚀 Starting Bulk Import for aapli-users...');
    const startTime = Date.now();

    try {
        const result = await importFirebaseCollection('aapli-users');

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (result.success) {
            console.log(`✅ Success! Imported ${result.count} documents in ${duration}s.`);
        } else {
            console.error(`❌ Failed:`, result.error);
        }
    } catch (e: any) {
        console.error('❌ Critical Error:', e.message);
    }
    process.exit(0);
}

run();
