import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

const WORKER_SECRET = process.env.WINNER_WORKER_SECRET || '';
const CRON_SECRET = process.env.CRON_SECRET || '';

function isAuthorized(req: Request): boolean {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (WORKER_SECRET && token === WORKER_SECRET) return true;
    if (CRON_SECRET && token === CRON_SECRET) return true;
    return false;
}

export async function GET(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: countsRows } = await (adminClient as any).from('sku_winner_recompute_queue').select('status');

    const counts = (countsRows || []).reduce(
        (acc: Record<string, number>, row: { status?: string }) => {
            const status = String(row?.status || 'UNKNOWN');
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        { PENDING: 0, PROCESSING: 0, DONE: 0, FAILED: 0 }
    );

    const { data: oldestPending } = await (adminClient as any)
        .from('sku_winner_recompute_queue')
        .select('created_at')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    const pendingOldestSeconds = oldestPending?.created_at
        ? Math.max(0, Math.floor((Date.now() - new Date(oldestPending.created_at).getTime()) / 1000))
        : 0;

    return NextResponse.json({
        success: true,
        queue: counts,
        pending_oldest_age_seconds: pendingOldestSeconds,
        checked_at: new Date().toISOString(),
    });
}
