/**
 * /api/winner-cache/invalidate
 * Phase 6D — Cache Invalidation Webhook for Worker Upserts
 *
 * Called by the recompute worker (or a DB webhook) after each successful upsert
 * into one of the 4 precomputed runtime tables.
 *
 * Auth: Bearer token via WINNER_CACHE_INVALIDATION_SECRET env var
 *
 * Request body:
 * {
 *   job_type: 'PRICE_SNAPSHOT' | 'WINNER_PRICE' | 'WINNER_FINANCE' | 'ACCESSORY_MATRIX',
 *   sku_id: string,
 *   state_code: string,
 *   geo_cell?: string,       // required for WINNER_PRICE
 *   dealer_id?: string,      // required for ACCESSORY_MATRIX
 * }
 *
 * Response: { ok: true, purged: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    invalidatePriceSnapshot,
    invalidateWinnerPrice,
    invalidateWinnerFinance,
    invalidateAccessoryMatrix,
} from '@/lib/cache/winner-cache';

const INVALIDATION_SECRET = process.env.WINNER_CACHE_INVALIDATION_SECRET;

type JobType = 'PRICE_SNAPSHOT' | 'WINNER_PRICE' | 'WINNER_FINANCE' | 'ACCESSORY_MATRIX';

export async function POST(req: NextRequest): Promise<NextResponse> {
    // Auth check — rejects if secret not configured or doesn't match
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!INVALIDATION_SECRET || token !== INVALIDATION_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: {
        job_type: JobType;
        sku_id: string;
        state_code: string;
        geo_cell?: string;
        dealer_id?: string;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { job_type, sku_id, state_code, geo_cell, dealer_id } = body;

    if (!job_type || !sku_id || !state_code) {
        return NextResponse.json({ error: 'Missing required fields: job_type, sku_id, state_code' }, { status: 400 });
    }

    const purged: string[] = [];

    switch (job_type) {
        case 'PRICE_SNAPSHOT': {
            invalidatePriceSnapshot(sku_id, state_code);
            purged.push(`price-snap:${sku_id}:${state_code}`);
            break;
        }

        case 'WINNER_PRICE': {
            if (!geo_cell) {
                return NextResponse.json({ error: 'geo_cell required for WINNER_PRICE invalidation' }, { status: 400 });
            }
            invalidateWinnerPrice(sku_id, state_code, geo_cell);
            purged.push(`winner-price:${sku_id}:${state_code}:${geo_cell}`);
            break;
        }

        case 'WINNER_FINANCE': {
            invalidateWinnerFinance(sku_id, state_code);
            purged.push(`winner-finance:${sku_id}:${state_code}`);
            break;
        }

        case 'ACCESSORY_MATRIX': {
            if (!dealer_id) {
                return NextResponse.json(
                    { error: 'dealer_id required for ACCESSORY_MATRIX invalidation' },
                    { status: 400 }
                );
            }
            invalidateAccessoryMatrix(sku_id, state_code, dealer_id);
            purged.push(`acc-matrix:${sku_id}:${state_code}:${dealer_id}`);
            break;
        }

        default: {
            return NextResponse.json({ error: `Unknown job_type: ${job_type}` }, { status: 400 });
        }
    }

    return NextResponse.json({
        ok: true,
        purged,
        ts: new Date().toISOString(),
    });
}
