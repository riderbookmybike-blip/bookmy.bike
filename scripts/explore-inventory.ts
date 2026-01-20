
// scripts/explore-inventory.ts
import { getAdminFirestore } from '../src/lib/firebase/admin';
import * as dotenv from 'dotenv';
import { createClient } from '@/lib/supabase/admin'; // Use admin client for DB
import { serializeFirebaseData } from '../src/actions/admin/firebase-migration';

// Load env vars
dotenv.config({ path: '.env.local' });

async function run() {
    console.log('🔍 Exploring Inventory...');
    try {
        const db = getAdminFirestore();

        // Path: Aapli Collections (Col) -> Inventory (Doc)
        const docRef = db.doc('Aapli Collections/Inventory');

        // List Subcollections
        const cols = await docRef.listCollections();

        if (cols.length === 0) {
            console.log('⚠️ No subcollections found in "Aapli Collections/Inventory"');
            // Maybe it's uppercase/lowercase?
            // Let's list ALL docs in Aapli Collections
            console.log('Listing docs in "Aapli Collections"...');
            const parent = db.collection('Aapli Collections');
            const snap = await parent.get();
            snap.docs.forEach(d => console.log(`- ${d.id}`));
        } else {
            console.log('✅ Found Subcollections:');
            cols.forEach(c => console.log(`- ${c.path} (ID: ${c.id})`));
        }

    } catch (e: any) {
        console.error('❌ Error:', e.message);
    }
    process.exit(0);
}

// Temporary shim for serialize if needed, but we don't need it for listing
run();
