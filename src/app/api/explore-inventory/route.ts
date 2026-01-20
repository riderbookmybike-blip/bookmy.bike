
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getAdminFirestore();
        const results: any = {};

        // 1. Check "Aapli Collections/Inventory" (Doc)
        try {
            const inventoryDoc = db.doc('Aapli Collections/Inventory');
            const subcols = await inventoryDoc.listCollections();
            results['Inventory_Subcollections'] = subcols.map(c => c.id);
        } catch (e: any) {
            results['Inventory_Error'] = e.message;
        }

        // 2. Check "Aapli Collections" (Col) docs list to see if "Inventory" exists
        try {
            const aapliCol = db.collection('Aapli Collections');
            const snap = await aapliCol.get(); // Might be small since it has 4 docs
            results['Aapli_Docs'] = snap.docs.map(d => d.id);
        } catch (e: any) {
            results['Aapli_Cols_Error'] = e.message;
        }

        return NextResponse.json({ success: true, data: results });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
