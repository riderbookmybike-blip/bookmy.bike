
import { NextResponse } from 'next/server';
import { generateHierarchicalReport } from '@/actions/admin/firebase-migration';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow 5 minutes for counting

export async function GET() {
    try {
        console.log('API: Generating Verification Report...');
        const report = await generateHierarchicalReport();

        // Summarize for user (formatted response)
        const summary = report.map(r => ({
            Collection: r.path,
            Level: r.level,
            Firebase: r.fbCount,
            Staging: r.sbCount,
            Status: r.match ? '✅ MATCH' : `❌ MISSING ${r.fbCount - r.sbCount}`
        }));

        return NextResponse.json({ success: true, data: summary, raw: report });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
