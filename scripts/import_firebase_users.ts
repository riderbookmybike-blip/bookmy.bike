import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';

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
const serviceAccount = JSON.parse(readFileSync(FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const DEFAULT_TENANT_ID = 'f3e6e266-3ca5-4c67-91ce-b7cc98e30ee5';

async function importUsers() {
    const limit = process.argv.includes('--limit') ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) : null;
    console.log(`Starting Firebase User Import... ${limit ? `(Limit: ${limit})` : ''}`);

    try {
        // 1. Fetch Pincode Reference Data for enrichment
        console.log('Fetching pincode reference data...');
        const { data: pincodeData, error: pinError } = await supabase
            .from('loc_pincodes')
            .select('pincode, state, district, city, rto_code');

        if (pinError) {
            console.error('Error fetching pincodes:', pinError);
            return;
        }

        const pinMap = new Map();
        pincodeData?.forEach(p => pinMap.set(p.pincode, p));
        console.log(`Loaded ${pinMap.size} pincodes for enrichment.`);

        // 2. Fetch Firebase Users
        let query: admin.firestore.Query = db.collection('aapli-users');
        if (limit) {
            query = query.limit(limit);
        }

        const snapshot = await query.get();
        console.log(`Found ${snapshot.size} users in Firebase.`);

        const membersMap = new Map();

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const phone = data.mobileNumber || data.phone || '';
            if (!phone) continue;

            // Normalize phone: remove spaces, ensure +91 prefix
            let cleanPhone = phone.replace(/[^0-9]/g, '');
            if (cleanPhone.length === 10) {
                cleanPhone = `+91${cleanPhone}`;
            } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
                cleanPhone = `+${cleanPhone}`;
            } else if (!cleanPhone.startsWith('+')) {
                if (cleanPhone.length > 10) {
                    cleanPhone = `+${cleanPhone}`;
                }
            }

            // Map enrichment data
            const enrichment = pinMap.get(data.pincode) || {};

            // Map created_at from Firebase 'time'
            let createdAt = new Date().toISOString();
            if (data.time) {
                if (data.time.toDate) {
                    createdAt = data.time.toDate().toISOString();
                } else if (typeof data.time === 'string') {
                    createdAt = new Date(data.time).toISOString();
                } else if (data.time._seconds) {
                    createdAt = new Date(data.time._seconds * 1000).toISOString();
                }
            }

            const memberData = {
                full_name: data.name || 'Unknown',
                email: data.email || null,
                phone: cleanPhone,
                whatsapp: data.whatsapp || cleanPhone,
                pincode: data.pincode || null,
                category: data.category || data.area || null,
                tenant_id: DEFAULT_TENANT_ID,
                created_at: createdAt,
                // Aadhaar Details
                aadhaar_number: data.aadhaar_number || null,
                aadhaar_pincode: data.aadhaar_pincode || null,
                aadhaar_linked_number: data.aadhaar_linked_number || null,
                aadhaar_address1: data.aadhaar_address1 || data.aadhaarAddress1 || null,
                aadhaar_address2: data.aadhaar_address2 || data.aadhaarAddress2 || null,
                aadhaar_address3: data.aadhaar_address3 || data.aadhaarAddress3 || null,
                // Current Address
                current_address1: data.current_address1 || data.currentAddress1 || null,
                current_address2: data.current_address2 || data.currentAddress2 || null,
                current_address3: data.current_address3 || data.currentAddress3 || null,
                // Cliq Integration
                cliq_channel_id: data.cliqChannelId || null,
                cliq_chat_id: data.cliqChatId || null,
                // Enriched fields from loc_pincodes
                state: enrichment.state || data.state || null,
                district: enrichment.district || data.district || null,
                city: enrichment.city || data.city || null,
                rto: enrichment.rto_code || data.rto || null,
                address: data.address || data.area || null
            };

            // Deduplicate by phone
            membersMap.set(cleanPhone, memberData);
        }

        const members = Array.from(membersMap.values());

        // 3. Upsert into Supabase in batches
        const BATCH_SIZE = 500;
        console.log(`Upserting ${members.length} members in batches of ${BATCH_SIZE}...`);

        for (let i = 0; i < members.length; i += BATCH_SIZE) {
            const batch = members.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(members.length / BATCH_SIZE)}...`);

            const { data: upsertedData, error: upsertError } = await supabase
                .from('id_members')
                .upsert(batch, { onConflict: 'phone' })
                .select('id');

            if (upsertError) {
                console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, upsertError);
                continue;
            }

            // 4. Link to id_member_tenants
            if (upsertedData && upsertedData.length > 0) {
                const links = upsertedData.map(m => ({
                    member_id: m.id,
                    tenant_id: DEFAULT_TENANT_ID
                }));

                const { error: linkError } = await supabase
                    .from('id_member_tenants')
                    .upsert(links, { onConflict: 'member_id,tenant_id' });

                if (linkError) {
                    console.error(`Link batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, linkError);
                }
            }
        }

        console.log('✅ Full Migration Success!');

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

importUsers();
