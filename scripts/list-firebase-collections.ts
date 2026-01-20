
// scripts/list-firebase-collections.ts
import { getAdminFirestore } from '../src/lib/firebase/admin';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

async function run() {
    console.log('🔍 Listing Firebase Collections...');
    try {
        const db = getAdminFirestore();
        const cols = await db.listCollections();
        console.log('--- Collections Found ---');
        cols.forEach(c => console.log(c.id));
        console.log('-------------------------');
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    }
    process.exit(0);
}

run();
