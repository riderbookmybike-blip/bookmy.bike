
import { NextResponse } from 'next/server';
import { importFirebaseCollection } from '@/actions/admin/firebase-migration';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const collection = searchParams.get('collection');

        if (!collection) {
            return NextResponse.json({ success: false, error: 'Collection parameter required' }, { status: 400 });
        }

        console.log(`API: Starting Import for ${collection}...`);
        const result = await importFirebaseCollection(collection);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
