import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const {
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    FIREBASE_SERVICE_ACCOUNT_PATH
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !FIREBASE_SERVICE_ACCOUNT_PATH) {
    console.error('Missing required environment variables in .env.local');
    process.exit(1);
}

// Initialize Supabase
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Initialize Firebase
const serviceAccount = require(FIREBASE_SERVICE_ACCOUNT_PATH);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migratePincodes() {
    console.log('Starting Pincode Migration from Firebase...');

    try {
        const snapshot = await db.collection('GlobalConfigurations/Pincodes/Pincode List').get();
        console.log(`Found ${snapshot.size} pincodes in Firebase.`);

        const pincodes = snapshot.docs.map(doc => {
            const data = doc.data();

            // Per user request: pricing "Standard" ko ignore karo
            const pricing = data.pricing === 'Standard' ? null : (data.pricing || null);

            // Better city mapping: data.city may be missing, fallback to zone
            const city = data.city || data.zone || null;

            return {
                pincode: data.pincode || doc.id,
                area: data.area || null,
                city: city,
                district: data.district || null,
                state: data.state || null,
                pricing: pricing,
                rto_code: data.rto || null,
                status: data.status || null,
                zone: data.zone || null,
                country: 'India',
                updated_at: new Date().toISOString()
            };
        });

        // Insert in batches
        const BATCH_SIZE = 100;
        for (let i = 0; i < pincodes.length; i += BATCH_SIZE) {
            const batch = pincodes.slice(i, i + BATCH_SIZE);
            console.log(`Upserting batch ${i / BATCH_SIZE + 1} (${batch.length} items)...`);

            const { error } = await supabase
                .from('pincodes')
                .upsert(batch, { onConflict: 'pincode' });

            if (error) {
                console.error(`Error in batch ${i / BATCH_SIZE + 1}:`, error);
            }
        }

        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migratePincodes();
