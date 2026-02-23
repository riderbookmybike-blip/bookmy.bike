import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const memberId = formData.get('memberId') as string;

        if (!file || !memberId) {
            return NextResponse.json({ error: 'Missing file or memberId' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize filename
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const timestamp = Date.now();
        const fileName = `${timestamp}_${safeName}`;

        // Store in public/uploads/documents/<memberId>/
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents', memberId);
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        // Return the public URL path
        const publicPath = `/uploads/documents/${memberId}/${fileName}`;

        return NextResponse.json({
            success: true,
            filePath: publicPath,
            fileName: safeName,
            fileType: file.type,
            fileSize: file.size,
        });
    } catch (error: unknown) {
        console.error('Upload document error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
