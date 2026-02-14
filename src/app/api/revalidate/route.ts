import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const secret = searchParams.get('secret');
    const tag = searchParams.get('tag');

    // Basic security check
    if (secret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    if (!tag) {
        return NextResponse.json({ message: 'Missing tag parameter' }, { status: 400 });
    }

    try {
        (revalidateTag as any)(tag);
        return NextResponse.json({ revalidated: true, now: Date.now(), tag });
    } catch (err) {
        return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
    }
}
