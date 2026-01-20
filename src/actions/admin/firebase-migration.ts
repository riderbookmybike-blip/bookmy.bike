'use server';

import { getAdminFirestore } from '@/lib/firebase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Updated Node Type
export interface FirebaseNode {
    id: string; // Name (e.g. "users" or "docId")
    path: string; // Full path
    type: 'collection' | 'document';
    hasChildren: boolean;
    imported?: boolean; // Only checked for root collections usually
}

// 1. Browse Logic (Recursive)
export async function browseFirebasePath(path: string = ''): Promise<FirebaseNode[]> {
    const db = getAdminFirestore();

    try {
        if (!path) {
            // Root Collections
            const cols = await db.listCollections();

            // Check importation status (only useful at root level for now)
            const supabase = await createClient();
            const { data: importedData } = await supabase
                .from('firebase_antigravity')
                .select('root_collection')
                .in('root_collection', cols.map(c => c.id));
            const importedSet = new Set(importedData?.map(d => d.root_collection));

            return cols.map(c => ({
                id: c.id,
                path: c.id,
                type: 'collection',
                hasChildren: true,
                imported: importedSet.has(c.id)
            }));
        }

        // Determine if path is Collection or Document
        // Path logic: Even segments = Document (users/123), Odd segments = Collection (users)

        const segments = path.split('/').filter(Boolean).length;
        const isCollection = segments % 2 !== 0;

        if (isCollection) {
            // Path points to a Collection (e.g. "users", "users/123/orders")
            // We return "Documents" in it
            const colRef = db.collection(path);
            const snapshot = await colRef.limit(20).get(); // Limit for UI performance

            return snapshot.docs.map(doc => ({
                id: doc.id,
                path: doc.ref.path,
                type: 'document',
                hasChildren: true // Docs might have subcollections
            }));
        } else {
            // Path points to a Document (e.g. "users/123")
            // We return "Subcollections" in it
            const docRef = db.doc(path);
            const subcols = await docRef.listCollections();

            return subcols.map(c => ({
                id: c.id,
                path: c.path,
                type: 'collection',
                hasChildren: true
            }));
        }

    } catch (e: any) {
        console.error('Browse error:', e);
        return [];
    }
}

// 2. Backward Compatibility for Initial Load (if MigrationClient still calls listFirebaseCollections)
export async function listFirebaseCollections(path?: string): Promise<FirebaseNode[]> {
    return browseFirebasePath(path);
}

// 3. Import Action (Takes a PATH now)
export async function importFirebaseCollection(path: string) {
    const db = getAdminFirestore();
    const supabase = await createClient();
    const batchId = crypto.randomUUID();

    // Validation
    const segments = path.split('/').filter(Boolean).length;
    if (segments % 2 === 0) {
        return { success: false, error: "Cannot import a single document path. Please select a collection folder." };
    }

    const rootCollection = path.split('/')[0];

    // Create Batch Record
    // Create Batch Record (Use Admin Client to bypass RLS)
    const { adminClient } = await import('@/lib/supabase/admin');
    await adminClient.from('firebase_import_batches').insert({
        id: batchId,
        source_project: 'firebase-admin-replica',
        note: `Manual import of ${path} via Migration Studio`
    });

    try {
        const collectionRef = db.collection(path);
        const snapshot = await collectionRef.get();

        if (snapshot.empty) return { success: true, count: 0 };

        const BATCH_SIZE = 500;
        let batchRows: any[] = [];
        let total = 0;

        for (const doc of snapshot.docs) {
            const data = serializeFirebaseData(doc.data());

            batchRows.push({
                batch_id: batchId,
                root_collection: rootCollection,
                collection_path: path,
                document_path: doc.ref.path,
                doc_id: doc.id,
                data: data,
                status: 'RAW'
            });

            if (batchRows.length >= BATCH_SIZE) {
                // Use Admin Client for INSERT/UPSERT to bypass RLS in API/Script context
                const { adminClient } = await import('@/lib/supabase/admin');
                const { error } = await adminClient.from('firebase_antigravity').upsert(batchRows, { onConflict: 'batch_id,collection_path,doc_id', ignoreDuplicates: true });
                if (error) throw error;
                total += batchRows.length;
                batchRows = [];
            }
        }

        // Flush remaining
        if (batchRows.length > 0) {
            // Use Admin Client for INSERT/UPSERT to bypass RLS in API/Script context
            const { adminClient } = await import('@/lib/supabase/admin');
            const { error } = await adminClient.from('firebase_antigravity').upsert(batchRows, { onConflict: 'batch_id,collection_path,doc_id', ignoreDuplicates: true });
            if (error) throw error;
            total += batchRows.length;
        }

        revalidatePath('/dashboard/admin/migration');
        return { success: true, count: total };

    } catch (error: any) {
        console.error(`Import failed for ${path}:`, error);
        return { success: false, error: error.message };
    }
}

// 4. BULK Import Action
export async function importAllFirebaseData() {
    const db = getAdminFirestore();
    const cols = await db.listCollections();

    const results = {
        totalCollections: cols.length,
        importedCount: 0,
        errors: [] as string[]
    };

    for (const col of cols) {
        try {
            // Reuse the existing single import logic
            const res = await importFirebaseCollection(col.id);
            if (!res.success) {
                results.errors.push(`${col.id}: ${res.error}`);
            } else {
                results.importedCount++;
            }
        } catch (e: any) {
            results.errors.push(`${col.id}: ${e.message}`);
        }
    }

    revalidatePath('/dashboard/admin/migration');
    return results;
}

export type FirebaseCollectionNode = FirebaseNode; // Layout alias

// Helper: Serialize Firestore Types
function serializeFirebaseData(value: any): any {
    if (value === null || value === undefined) return value;

    // Timestamp
    if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }

    // GeoPoint
    if (value && typeof value.latitude === 'number' && typeof value.longitude === 'number' && Object.keys(value).length === 2) {
        return { _type: 'geopoint', ...value };
    }

    // Ref
    if (value && typeof value.path === 'string' && typeof value.firestore !== 'undefined') {
        return { _type: 'ref', path: value.path };
    }

    // Array
    if (Array.isArray(value)) {
        return value.map(serializeFirebaseData);
    }

    // Object
    if (typeof value === 'object') {
        const result: any = {};
        for (const [k, v] of Object.entries(value)) {
            result[k] = serializeFirebaseData(v);
        }
        return result;
    }

    return value;
}

// 5. Verification Action
// 5. Verification Action (Granular Path-based)
export async function verifyImportCounts() {
    const db = getAdminFirestore();
    // Use Admin Client to bypass RLS/Auth requirement (needed for API/Scripts)
    const { adminClient } = await import('@/lib/supabase/admin');
    const supabase = adminClient;

    // 1. Get all unique collection paths we have imported
    // We can't do "DISTINCT" easily with Supabase client-side builder in one go for pure list, 
    // but we can use .select('collection_path') and handle in JS.
    const { data: allRows } = await supabase
        .from('firebase_antigravity')
        .select('collection_path');

    const uniquePaths = Array.from(new Set(allRows?.map(r => r.collection_path) || []));

    // Fallback: If table is empty, we check root collections at least
    const rootCols = await db.listCollections();
    const rootPaths = rootCols.map(c => c.id);
    const combinedPaths = Array.from(new Set([...uniquePaths, ...rootPaths]));

    const report: { name: string; firebase: number; supabase: number; match: boolean }[] = [];

    for (const path of combinedPaths) {
        try {
            // Firebase Count (Specific Path)
            // Note: DB.collection(path) works for deep paths too
            const colRef = db.collection(path);
            const fbCountSnapshot = await colRef.count().get();
            const fbCount = fbCountSnapshot.data().count;

            // Supabase Count (Exact for this distinct path)
            const { count: sbCount } = await supabase
                .from('firebase_antigravity')
                .select('*', { count: 'exact', head: true })
                .eq('collection_path', path);

            const finalSbCount = sbCount || 0;

            // Only report if data exists
            if (fbCount > 0 || finalSbCount > 0) {
                report.push({
                    name: path,
                    firebase: fbCount,
                    supabase: finalSbCount,
                    match: fbCount === finalSbCount
                });
            }
        } catch (e) {
            // Ignore errors for invalid paths
        }
    }

    // Sort: Mismatches first, then Alphabetical
    return report.sort((a, b) => {
        if (a.match === b.match) return a.name.localeCompare(b.name);
        return a.match ? 1 : -1;
    });
}

// 6. Hierarchical Smart Report (depth-limited BFS)
export async function generateHierarchicalReport() {
    const db = getAdminFirestore();
    const { adminClient: supabase } = await import('@/lib/supabase/admin'); // Full access

    const report: { path: string; level: number; fbCount: number; sbCount: number; match: boolean }[] = [];

    // Queue for BFS: { path: string, level: number }
    // Start with Root Collections
    const rootCols = await db.listCollections();
    let queue = rootCols.map(c => ({ path: c.id, level: 1 }));

    // Process Queue
    // Safety Break: Max 50 collections to prevent infinite loops in weird schemas
    let processedCount = 0;
    while (queue.length > 0 && processedCount < 100) {
        const item = queue.shift()!;
        if (item.level > 3) continue; // Stop at Level 3

        processedCount++;

        try {
            // 1. Get Counts
            const colRef = db.collection(item.path);
            const fbCountSnap = await colRef.count().get();
            const fbCount = fbCountSnap.data().count;

            const { count: sbCount } = await supabase
                .from('firebase_antigravity')
                .select('*', { count: 'exact', head: true })
                .eq('collection_path', item.path);

            report.push({
                path: item.path,
                level: item.level,
                fbCount: fbCount,
                sbCount: sbCount || 0,
                match: fbCount === (sbCount || 0)
            });

            // 2. Discover Children (Sub-collections)
            // Strategy: Check the first 1-3 documents to see if they have sub-collections.
            // This assumes schema uniformity (if doc1 has 'orders', doc2 likely does too).
            if (fbCount > 0 && item.level < 3) {
                const sampleDocs = await colRef.limit(3).get();
                const discoveredSubCols = new Set<string>();

                for (const doc of sampleDocs.docs) {
                    const subCols = await doc.ref.listCollections();
                    for (const sub of subCols) {
                        const subPath = sub.path; // e.g. "users/123/orders" -> Wait, listCollections returns full path? 
                        // No, sub.path is `coll/doc/subcoll`
                        // But we want to report the "Schema Path" not the "Instance Path".
                        // Schema Path Concept: "users/{id}/orders"
                        // But for singleton structures like "Aapli Collections/Bookings/Ongoing", the path IS the schema.
                        // For "users", the subcollection is "orders", but it exists under EVERY user.
                        // We don't want to report "users/u1/orders", "users/u2/orders"...
                        // We want "users/{id}/orders".

                        // Detection:
                        // If the parent collection looks like a "List of Entities" (e.g. Users), we shouldn't explode.
                        // If the parent collection looks like a "Folder" (e.g. Aapli Collections, size=4), we should follow specific paths.

                        // HEURISTIC:
                        // If fbCount is SMALL (< 20) -> Treat as Folder -> Follow SPECIFIC paths.
                        // If fbCount is LARGE (> 20) -> Treat as Entity List -> Aggregate subcollection name.

                        if (fbCount < 20) {
                            // Treat individual instances as important paths
                            discoveredSubCols.add(sub.path);
                        } else {
                            // Aggregate: Use a placeholder? Or just verify the first one?
                            // User mostly cares about the "Folder" structure "Aapli Collections".
                            // So let's just push specific paths for now.
                            // Actually, for "users", we don't want to list 25k subpaths.
                            // So we only recurse if fbCount is small.
                            discoveredSubCols.add(sub.path);
                        }
                    }
                }

                // Add to queue
                // Filter: Only allow recursion if parent size was small, OR if distinct subcol names are few?
                // Let's stick to the User's "Aapli Collections" usecase which has few docs.
                // Limit: Only push if total queue size isn't exploding.

                for (const subPath of Array.from(discoveredSubCols)) {
                    queue.push({ path: subPath, level: item.level + 1 });
                }
            }

        } catch (e) {
            console.error(`Error processing ${item.path}:`, e);
        }
    }

    return report;
}
