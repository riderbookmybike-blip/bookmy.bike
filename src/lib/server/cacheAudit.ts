import { revalidateTag } from 'next/cache';
import { CACHE_TAGS, stateTag } from '@/lib/cache/tags';
import { adminClient } from '@/lib/supabase/admin';

type CatalogItem = {
    id?: string;
    modelSlug?: string;
    price?: {
        exShowroom?: number;
        onRoad?: number;
    };
};

type CatalogPayload = {
    products?: CatalogItem[];
    error?: string;
};

export type CacheAuditSummary = {
    id: string;
    createdAt: string;
    status: 'PASS' | 'MISMATCH' | 'ERROR';
    stateCode: string;
    checkedSkus: number;
    mismatchCount: number;
    autoFixed: boolean;
    notes: string | null;
};

function resolveBaseUrl(): string {
    const raw =
        process.env.CACHE_AUDIT_BASE_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
        process.env.VERCEL_URL ||
        'http://localhost:3000';
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return withProtocol.replace(/\/+$/, '');
}

function safeNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function skuKey(item: CatalogItem): string {
    return String(item.id || '')
        .trim()
        .toLowerCase();
}

function priceSignature(item: CatalogItem): string {
    return `${safeNumber(item.price?.exShowroom)}|${safeNumber(item.price?.onRoad)}`;
}

async function fetchCatalogSnapshot(stateCode: string, noCache: boolean): Promise<CatalogItem[]> {
    const baseUrl = resolveBaseUrl();
    const res = await fetch(`${baseUrl}/api/store/catalog?state=${encodeURIComponent(stateCode)}`, {
        method: 'GET',
        headers: noCache ? { 'x-no-cache': '1' } : undefined,
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`Catalog fetch failed (${res.status}) [state=${stateCode}, noCache=${noCache}]`);
    }

    const payload = (await res.json()) as CatalogPayload;
    if (payload.error) throw new Error(payload.error);
    return Array.isArray(payload.products) ? payload.products : [];
}

async function sendAuditEmail(summary: {
    status: 'PASS' | 'MISMATCH' | 'ERROR';
    stateCode: string;
    checkedSkus: number;
    mismatchCount: number;
    autoFixed: boolean;
    notes: string | null;
}) {
    const apiKey = String(process.env.RESEND_API_KEY || '').trim();
    const to = String(process.env.CACHE_AUDIT_EMAIL_TO || '').trim();
    if (!apiKey || !to) return;

    const from = String(process.env.CACHE_AUDIT_EMAIL_FROM || 'cache-audit@bookmy.bike').trim();
    const subject = `[Cache Audit] ${summary.status} | ${summary.stateCode} | mismatch=${summary.mismatchCount}`;
    const html = `
        <h3>Catalog Cache Audit</h3>
        <p><b>Status:</b> ${summary.status}</p>
        <p><b>State:</b> ${summary.stateCode}</p>
        <p><b>Checked SKUs:</b> ${summary.checkedSkus}</p>
        <p><b>Mismatches:</b> ${summary.mismatchCount}</p>
        <p><b>Auto Fixed:</b> ${summary.autoFixed ? 'Yes' : 'No'}</p>
        <p><b>Notes:</b> ${summary.notes || '—'}</p>
    `;

    try {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to: [to],
                subject,
                html,
            }),
        });
    } catch (err) {
        console.error('[CacheAudit] Email send failed:', err);
    }
}

export async function runCatalogCacheAudit(input?: { stateCode?: string; actor?: string }) {
    const startedAt = Date.now();
    const stateCode = String(input?.stateCode || 'MH')
        .trim()
        .toUpperCase();
    const actor = String(input?.actor || 'SYSTEM')
        .trim()
        .toUpperCase();

    let runId: string | null = null;
    let status: 'PASS' | 'MISMATCH' | 'ERROR' = 'PASS';
    let checkedSkus = 0;
    let mismatchCount = 0;
    let autoFixed = false;
    let notes: string | null = null;
    const fixedTags: string[] = [];

    try {
        const cachedProducts = await fetchCatalogSnapshot(stateCode, false);
        const freshProducts = await fetchCatalogSnapshot(stateCode, true);

        checkedSkus = Math.max(cachedProducts.length, freshProducts.length);

        const cachedMap = new Map(cachedProducts.map(item => [skuKey(item), item]));
        const freshMap = new Map(freshProducts.map(item => [skuKey(item), item]));
        const keys = new Set([...cachedMap.keys(), ...freshMap.keys()]);

        const mismatches: Array<{
            sku_id: string;
            model_slug: string | null;
            field_name: string;
            cached_value: string | null;
            fresh_value: string | null;
            mismatch_type: string;
        }> = [];

        for (const key of keys) {
            if (!key) continue;
            const cached = cachedMap.get(key);
            const fresh = freshMap.get(key);

            if (!cached && fresh) {
                mismatches.push({
                    sku_id: key,
                    model_slug: fresh.modelSlug || null,
                    field_name: 'sku_presence',
                    cached_value: null,
                    fresh_value: 'present',
                    mismatch_type: 'MISSING_IN_CACHE',
                });
                continue;
            }
            if (cached && !fresh) {
                mismatches.push({
                    sku_id: key,
                    model_slug: cached.modelSlug || null,
                    field_name: 'sku_presence',
                    cached_value: 'present',
                    fresh_value: null,
                    mismatch_type: 'STALE_IN_CACHE',
                });
                continue;
            }
            if (!cached || !fresh) continue;

            const cachedSig = priceSignature(cached);
            const freshSig = priceSignature(fresh);
            if (cachedSig !== freshSig) {
                mismatches.push({
                    sku_id: key,
                    model_slug: fresh.modelSlug || cached.modelSlug || null,
                    field_name: 'price_signature',
                    cached_value: cachedSig,
                    fresh_value: freshSig,
                    mismatch_type: 'PRICE_DRIFT',
                });
            }
        }

        mismatchCount = mismatches.length;
        status = mismatchCount > 0 ? 'MISMATCH' : 'PASS';

        const runInsert = await (adminClient as any)
            .from('sys_cache_audit_runs')
            .insert({
                status,
                actor,
                state_code: stateCode,
                checked_skus: checkedSkus,
                mismatch_count: mismatchCount,
                auto_fixed: false,
                fixed_tags: [],
                notes: null,
                started_at: new Date(startedAt).toISOString(),
            })
            .select('id')
            .single();

        if (runInsert.error) {
            throw new Error(runInsert.error.message || 'Failed to insert cache audit run');
        }
        runId = String(runInsert.data?.id || '');

        if (mismatchCount > 0 && runId) {
            const mismatchRows = mismatches.map(m => ({ ...m, run_id: runId }));
            const mismatchInsert = await (adminClient as any).from('sys_cache_audit_mismatches').insert(mismatchRows);
            if (mismatchInsert.error) {
                throw new Error(mismatchInsert.error.message || 'Failed to insert cache audit mismatches');
            }

            const tagsToFix = [CACHE_TAGS.catalog, CACHE_TAGS.catalog_global, stateTag(stateCode)];
            for (const tag of tagsToFix) {
                revalidateTag(tag, 'max');
            }
            fixedTags.push(...tagsToFix);
            autoFixed = true;
            notes = `Detected ${mismatchCount} mismatch(es). Revalidated tags: ${tagsToFix.join(', ')}`;
        }
    } catch (err) {
        status = 'ERROR';
        notes = err instanceof Error ? err.message : String(err);
    } finally {
        const completedAt = Date.now();
        const durationMs = completedAt - startedAt;

        if (runId) {
            await (adminClient as any)
                .from('sys_cache_audit_runs')
                .update({
                    status,
                    completed_at: new Date(completedAt).toISOString(),
                    duration_ms: durationMs,
                    auto_fixed: autoFixed,
                    fixed_tags: fixedTags,
                    notes,
                })
                .eq('id', runId);
        } else {
            await (adminClient as any).from('sys_cache_audit_runs').insert({
                status,
                actor,
                state_code: stateCode,
                checked_skus: checkedSkus,
                mismatch_count: mismatchCount,
                auto_fixed: autoFixed,
                fixed_tags: fixedTags,
                notes,
                started_at: new Date(startedAt).toISOString(),
                completed_at: new Date(completedAt).toISOString(),
                duration_ms: durationMs,
            });
        }

        await sendAuditEmail({
            status,
            stateCode,
            checkedSkus,
            mismatchCount,
            autoFixed,
            notes,
        });
    }

    return {
        ok: status !== 'ERROR',
        status,
        stateCode,
        checkedSkus,
        mismatchCount,
        autoFixed,
        notes,
    };
}

export async function getLatestCatalogCacheAuditSummary(): Promise<CacheAuditSummary | null> {
    const { data, error } = await (adminClient as any)
        .from('sys_cache_audit_runs')
        .select('id, created_at, status, state_code, checked_skus, mismatch_count, auto_fixed, notes')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data) return null;

    return {
        id: String(data.id),
        createdAt: String(data.created_at),
        status: (String(data.status || 'ERROR').toUpperCase() as CacheAuditSummary['status']) || 'ERROR',
        stateCode: String(data.state_code || 'MH'),
        checkedSkus: Number(data.checked_skus || 0),
        mismatchCount: Number(data.mismatch_count || 0),
        autoFixed: Boolean(data.auto_fixed),
        notes: data.notes ? String(data.notes) : null,
    };
}
