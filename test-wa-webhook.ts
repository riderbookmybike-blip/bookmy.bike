/**
 * Manual webhook replay utility.
 *
 * Usage examples:
 *   npx tsx test-wa-webhook.ts
 *   WEBHOOK_URL=https://aums.bookmy.bike/api/webhooks/msg91-wa MSG91_WEBHOOK_SECRET=... npx tsx test-wa-webhook.ts
 */

type ReplayStatus = 'delivered' | 'read' | 'failed' | 'undelivered' | 'rejected' | 'bounced';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/msg91-wa';
const MSG91_WEBHOOK_SECRET = process.env.MSG91_WEBHOOK_SECRET || '';
const REPLAY_PHONE = process.env.REPLAY_PHONE || '9876543210';
const REPLAY_STATUSES: ReplayStatus[] = ['delivered', 'read', 'failed'];

async function replay(status: ReplayStatus) {
    const url = new URL(WEBHOOK_URL);
    if (MSG91_WEBHOOK_SECRET) {
        url.searchParams.set('secret', MSG91_WEBHOOK_SECRET);
    }

    const payload = {
        to: `91${REPLAY_PHONE}`,
        status,
        timestamp: new Date().toISOString(),
    };

    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    console.log(`[replay:${status}]`, { http: res.status, body });
}

async function main() {
    for (const status of REPLAY_STATUSES) {
        await replay(status);
    }
}

main().catch(err => {
    console.error('[replay] failed:', err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
});
