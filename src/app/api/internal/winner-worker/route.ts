/**
 * POST /api/internal/winner-worker
 *
 * Internal worker trigger — processes the sku_winner_recompute_queue.
 * Protected by Authorization: Bearer <WORKER_SECRET>.
 * Called by cron / Vercel Cron / webhook after cat_price_dealer changes.
 */

import { NextResponse } from 'next/server';
import { processWinnerQueue } from '@/lib/server/winnerWorker';

const WORKER_SECRET = process.env.WINNER_WORKER_SECRET || '';
const CRON_SECRET = process.env.CRON_SECRET || '';

function isAuthorized(req: Request): boolean {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (WORKER_SECRET && token === WORKER_SECRET) return true;
    if (CRON_SECRET && token === CRON_SECRET) return true;
    return false;
}

async function runWorker(batchSize: number) {
    const result = await processWinnerQueue(batchSize);
    return NextResponse.json({
        success: true,
        ...result,
        processed_at: new Date().toISOString(),
    });
}

export async function POST(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let batchSize = 50;
    try {
        const body = await req.json().catch(() => ({}));
        if (Number.isFinite(Number(body?.batchSize))) batchSize = Math.min(200, Number(body.batchSize));
    } catch {
        // use default
    }

    return runWorker(batchSize);
}

// Vercel Cron can call GET routes. Keep same auth contract via Authorization header.
export async function GET(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return runWorker(200);
}
