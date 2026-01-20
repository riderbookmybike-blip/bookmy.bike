
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

export async function GET() {
    try {
        console.log('API: Listing Collections...');
        const db = getAdminFirestore();
        const cols = await db.listCollections();
        const colNames = cols.map(c => c.id);

        return NextResponse.json({ success: true, collections: colNames });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
