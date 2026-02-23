import { NextResponse } from 'next/server';
import { cloneTemplate } from '@/modules/templates/templateService';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15 params is async, in 14 it's not. Assuming 14 based on file structure but being safe doesn't hurt or just sticking to 14 pattern: { params: { id: string } }
) {
    try {
        // Await params if necessary, or access directly. Next.js 13/14 App Router params are props.
        // However, usually in route handlers:
        const { id } = await params;

        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        }

        const newTemplate = await cloneTemplate(id, name);

        return NextResponse.json({ success: true, data: newTemplate });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
