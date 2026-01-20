#!/usr/bin/env node
'use strict';

require('dotenv/config');

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!SERVICE_ACCOUNT_PATH) {
    console.error('Missing FIREBASE_SERVICE_ACCOUNT_PATH in env.');
    process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
    process.exit(1);
}

let serviceAccount;
try {
    const raw = fs.readFileSync(path.resolve(SERVICE_ACCOUNT_PATH), 'utf8');
    serviceAccount = JSON.parse(raw);
} catch (err) {
    console.error('Failed to load Firebase service account JSON.', err);
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

const args = process.argv.slice(2);
const argMap = {};
for (const arg of args) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    argMap[key] = value === undefined ? true : value;
}

const requestedCollections = argMap.collections
    ? argMap.collections.split(',').map((item) => item.trim()).filter(Boolean)
    : null;
const batchNote = typeof argMap.note === 'string' ? argMap.note : null;
const batchIdOverride = typeof argMap['batch-id'] === 'string' ? argMap['batch-id'] : null;
const rootLimit = argMap.limit ? Number(argMap.limit) : null;
const rootStartAfter = typeof argMap['start-after'] === 'string' ? argMap['start-after'] : null;
const collectionPath = typeof argMap['collection-path'] === 'string' ? argMap['collection-path'] : null;
const skipSubcollections = argMap['skip-subcollections'] === true;
const collectionGroup = typeof argMap['collection-group'] === 'string' ? argMap['collection-group'] : null;

const BATCH_SIZE = 500;
const rowBuffer = [];

const isPlainObject = (value) =>
    Object.prototype.toString.call(value) === '[object Object]';

const serializeValue = (value) => {
    if (value === null || value === undefined) return value;
    if (value instanceof admin.firestore.Timestamp) {
        return value.toDate().toISOString();
    }
    if (value instanceof admin.firestore.GeoPoint) {
        return {
            _type: 'geopoint',
            latitude: value.latitude,
            longitude: value.longitude
        };
    }
    if (value instanceof admin.firestore.DocumentReference) {
        return { _type: 'ref', path: value.path };
    }
    if (Buffer.isBuffer(value)) {
        return { _type: 'bytes', base64: value.toString('base64') };
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (Array.isArray(value)) {
        return value.map(serializeValue);
    }
    if (isPlainObject(value)) {
        const result = {};
        for (const [key, val] of Object.entries(value)) {
            result[key] = serializeValue(val);
        }
        return result;
    }
    return value;
};

const flushRows = async () => {
    if (!rowBuffer.length) return;
    const { error } = await supabase
        .from('firebase_import')
        .upsert(rowBuffer, {
            onConflict: 'batch_id,collection_path,doc_id',
            ignoreDuplicates: true
        });
    if (error) {
        throw new Error(`Supabase insert failed: ${error.message}`);
    }
    rowBuffer.length = 0;
};

const queueRow = async (row) => {
    rowBuffer.push(row);
    if (rowBuffer.length >= BATCH_SIZE) {
        await flushRows();
    }
};

const resolveParentInfo = (docRef) => {
    const parentDoc = docRef.parent.parent;
    if (!parentDoc) {
        return { parent_path: null, parent_doc_id: null };
    }
    return { parent_path: parentDoc.path, parent_doc_id: parentDoc.id };
};

const walkCollection = async (collectionRef, rootCollection, batchId, options) => {
    let query = collectionRef;
    if (options && (options.startAfter || options.limit)) {
        query = query.orderBy(admin.firestore.FieldPath.documentId());
        if (options.startAfter) {
            query = query.startAfter(options.startAfter);
        }
        if (options.limit) {
            query = query.limit(options.limit);
        }
    }
    const snapshot = await query.get();
    for (const docSnap of snapshot.docs) {
        const docRef = collectionRef.doc(docSnap.id);
        const rawData = docSnap.data() || {};
        const data = serializeValue(rawData);
        const parentInfo = resolveParentInfo(docRef);

        await queueRow({
            batch_id: batchId,
            root_collection: rootCollection,
            collection_path: collectionRef.path,
            document_path: docRef.path,
            doc_id: docSnap.id,
            parent_path: parentInfo.parent_path,
            parent_doc_id: parentInfo.parent_doc_id,
            data,
            status: 'RAW'
        });

        if (!options || !options.skipSubcollections) {
            const subcollections = await docRef.listCollections();
            for (const subcollection of subcollections) {
                await walkCollection(subcollection, rootCollection, batchId);
            }
        }
    }

    if (options && options.isRoot && snapshot.docs.length) {
        const lastDocId = snapshot.docs[snapshot.docs.length - 1].id;
        console.log(`Last doc id processed for ${collectionRef.path}: ${lastDocId}`);
    }
};

const walkCollectionGroup = async (groupName, batchId, options) => {
    let query = db.collectionGroup(groupName);
    if (options && (options.startAfter || options.limit)) {
        query = query.orderBy(admin.firestore.FieldPath.documentId());
        if (options.startAfter) {
            query = query.startAfter(options.startAfter);
        }
        if (options.limit) {
            query = query.limit(options.limit);
        }
    }

    const snapshot = await query.get();
    for (const docSnap of snapshot.docs) {
        const docRef = docSnap.ref;
        const rawData = docSnap.data() || {};
        const data = serializeValue(rawData);
        const parentInfo = resolveParentInfo(docRef);
        const collectionPath = docRef.parent.path;
        const rootCollection = collectionPath.split('/')[0];

        await queueRow({
            batch_id: batchId,
            root_collection: rootCollection,
            collection_path: collectionPath,
            document_path: docRef.path,
            doc_id: docSnap.id,
            parent_path: parentInfo.parent_path,
            parent_doc_id: parentInfo.parent_doc_id,
            data,
            status: 'RAW'
        });
    }

    if (options && options.isRoot && snapshot.docs.length) {
        const lastDocPath = snapshot.docs[snapshot.docs.length - 1].ref.path;
        console.log(`Last doc path processed for collectionGroup ${groupName}: ${lastDocPath}`);
    }
};

const main = async () => {
    const projectId = serviceAccount.project_id || 'unknown';
    let batchId = batchIdOverride;
    if (!batchId) {
        const { data: batchRow, error: batchError } = await supabase
            .from('firebase_import_batches')
            .insert({ source_project: projectId, note: batchNote })
            .select('id')
            .single();

        if (batchError) {
            throw new Error(`Failed to create import batch: ${batchError.message}`);
        }
        batchId = batchRow.id;
    }

    const options =
        rootStartAfter || rootLimit
            ? {
                  startAfter: rootStartAfter || null,
                  limit: rootLimit || null,
                  isRoot: true,
                  skipSubcollections
              }
            : skipSubcollections
            ? { isRoot: true, skipSubcollections }
            : null;

    if (collectionGroup) {
        console.log(`Importing collection group: ${collectionGroup}`);
        await walkCollectionGroup(collectionGroup, batchId, options);
        await flushRows();
    } else {
        let filtered = [];
        if (collectionPath) {
            filtered = [db.collection(collectionPath)];
        } else {
            const rootCollections = await db.listCollections();
            filtered = requestedCollections
                ? rootCollections.filter((col) => requestedCollections.includes(col.id))
                : rootCollections;
        }

        if (!filtered.length) {
            console.log('No collections found to import.');
            return;
        }

        for (const collectionRef of filtered) {
            console.log(`Importing collection: ${collectionRef.path}`);
            const resolvedRoot =
                collectionPath && collectionRef.path.includes('/')
                    ? collectionRef.path.split('/')[0]
                    : collectionRef.id;
            await walkCollection(collectionRef, resolvedRoot, batchId, options);
            await flushRows();
        }
    }

    console.log(`Import completed. Batch ID: ${batchId}`);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
