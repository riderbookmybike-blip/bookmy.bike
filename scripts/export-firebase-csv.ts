import * as admin from 'firebase-admin';
import { Parser } from 'json2csv';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// 1. Initialize Firebase
// Expects serviceAccountKey.json in the project root
const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const OUTPUT_DIR = 'migration_data';
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Helper to flatten objects for CSV
const flatten = (obj: any, prefix = '', res: any = {}) => {
    for (const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        const val = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;

        if (typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date)) {
            flatten(val, newKey, res);
        } else {
            res[newKey] = val;
        }
    }
    return res;
};

async function exportCollectionToCSV(collectionName: string, outputFilename: string) {
    console.log(`Exporting ${collectionName}...`);
    try {
        const snapshot = await db.collection(collectionName).get();
        if (snapshot.empty) {
            console.log(`No documents found in ${collectionName}`);
            return;
        }

        const data: any[] = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
            // Flatten for better CSV readability
            const flatData = flatten(docData);
            flatData['_firebase_id'] = doc.id; // Preserve ID
            data.push(flatData);
        });

        const parser = new Parser();
        const csv = parser.parse(data);

        fs.writeFileSync(path.join(OUTPUT_DIR, outputFilename), csv);
        console.log(`Saved ${data.length} records to ${outputFilename}`);

    } catch (error) {
        console.error(`Error exporting ${collectionName}:`, error);
    }
}

// 2. Define Execution Flow
async function main() {
    // Export Root Collections
    await exportCollectionToCSV('Aapli Collections', 'aapli_collections.csv');

    // Attempt to export Bookings (Try both root and nested paths if uncertain, for now assume linked in Plan)
    // Based on user image, Bookings might be nested or root. We'll try common patterns.
    // If 'Bookings' is a root collection:
    await exportCollectionToCSV('Bookings', 'bookings.csv');

    // If 'Bookings' is inside 'Aapli Collections' (e.g., as a subcollection of some doc? or just a doc named Bookings?)
    // If it's a doc named 'Bookings', it was already captured in 'aapli_collections.csv'. 

    console.log('Export complete. Check migration_data/ folder.');
}

main().catch(console.error);
