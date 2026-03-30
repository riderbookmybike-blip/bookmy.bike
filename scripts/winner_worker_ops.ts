#!/usr/bin/env tsx
/**
 * Winner worker ops helper:
 * 1) checks queue status
 * 2) optionally triggers worker run
 * 3) checks status again
 *
 * Usage:
 *   BASE_URL=https://your-domain.com WINNER_WORKER_SECRET=... npm run winner:status
 *   BASE_URL=https://your-domain.com WINNER_WORKER_SECRET=... npm run winner:run
 */

type Json = Record<string, unknown>;

function requireEnv(name: string): string {
    const v = (process.env[name] || '').trim();
    if (!v) {
        throw new Error(`Missing required env: ${name}`);
    }
    return v;
}

async function callJson(url: string, init?: RequestInit): Promise<{ status: number; body: Json }> {
    const res = await fetch(url, init);
    const body = (await res.json().catch(() => ({}))) as Json;
    return { status: res.status, body };
}

function authHeader(secret: string) {
    return { Authorization: `Bearer ${secret}` };
}

async function main() {
    const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const secret = requireEnv('WINNER_WORKER_SECRET');
    const mode = (process.argv[2] || 'status').toLowerCase();

    const statusUrl = `${baseUrl}/api/internal/winner-worker/status`;
    const workerUrl = `${baseUrl}/api/internal/winner-worker`;

    const before = await callJson(statusUrl, { headers: authHeader(secret) });
    console.log('[before]', JSON.stringify(before.body));

    if (mode === 'run') {
        const run = await callJson(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader(secret),
            },
            body: JSON.stringify({ batchSize: 200 }),
        });
        console.log('[run]', run.status, JSON.stringify(run.body));
    }

    const after = await callJson(statusUrl, { headers: authHeader(secret) });
    console.log('[after]', JSON.stringify(after.body));
}

main().catch(err => {
    console.error('[winner_worker_ops] failed:', err instanceof Error ? err.message : err);
    process.exit(1);
});
