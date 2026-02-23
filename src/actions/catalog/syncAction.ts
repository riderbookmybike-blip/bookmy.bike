'use server';

/**
 * syncAction.ts — Controlled Sync Service
 *
 * This is the ONLY module that writes to the database.
 * All writes require explicit user-approved payloads.
 *
 * Responsibilities:
 * 1. Upsert models/variants/colors with provenance.
 * 2. Link downloaded assets to cat_assets with sha256.
 * 3. Provide dry-run mode for QA.
 * 4. Field-level merge with "never overwrite" protection.
 * 5. Legacy linear sync helper retained for backward compatibility only.
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { validateCatalogRow } from '@/lib/validation/catalogSpecs';
import { normalizeSpecsForLinear, segregateSpecs, generateSlug } from './catalogUtils';
import type { Provenance, ExtractedModel, ExtractedVariant, ExtractedColor } from './scraperAction';
import {
    downloadBatch,
    generateAssetPath,
    type DownloadRequest,
    type DownloadResult,
} from '@/lib/utils/assetDownloader';

// ─── Types ──────────────────────────────────────────────────────────────

export type SyncAction = 'CREATE' | 'UPDATE' | 'SKIP';

export interface FieldDiff {
    field: string;
    current: unknown;
    incoming: unknown;
    action: 'accept' | 'reject';
}

export interface SyncItem {
    type: 'PRODUCT' | 'VARIANT' | 'UNIT' | 'SKU';
    name: string;
    action: SyncAction;
    existing_id?: string;
    existing_specs?: Record<string, unknown>;
    diffs: FieldDiff[];
    provenance: Provenance;
    match_key?: string;
    parent_existing_id?: string;
    children?: SyncItem[];
    assets?: SyncAsset[];
}

export interface SyncAsset {
    url: string;
    localPath?: string;
    sha256?: string;
    fileSize?: number;
    contentType?: string;
    action: 'download' | 'link_existing' | 'skip';
}

export interface SyncPlan {
    brand_id: string;
    mode?: 'DISCOVERY' | 'ITEM';
    items: SyncItem[];
    stats: {
        creates: number;
        updates: number;
        skips: number;
        assets_to_download: number;
    };
}

export interface SyncResult {
    success: boolean;
    created: number;
    updated: number;
    skipped: number;
    assets_downloaded: number;
    assets_linked: number;
    errors: string[];
    created_ids: { name: string; id: string; type: string }[];
}

// ─── Never-Overwrite Fields ─────────────────────────────────────────────

const NEVER_OVERWRITE_FIELDS = ['notes', 'manual_price_override', 'custom_description', 'internal_notes'];

// ─── Comparison / Diff Engine ───────────────────────────────────────────

/**
 * Compare extracted data against existing DB records.
 * Returns a SyncPlan with field-level diffs.
 */
export async function buildSyncPlan(params: {
    models: ExtractedModel[];
    brandId: string;
    matchOverrides?: Record<string, string>;
    mode?: 'DISCOVERY' | 'ITEM';
}): Promise<SyncPlan> {
    const { models, brandId, matchOverrides, mode = 'ITEM' } = params;
    const supabase = await createServerClient();

    const { data: existingFamilies } = await (supabase as any)
        .from('cat_models')
        .select('id, name, slug, specs, price_base, status')
        .eq('brand_id', brandId);

    const familyByExternalId = new Map<string, any>();
    const familyByName = new Map<string, any>();
    const familyById = new Map<string, any>();
    for (const f of existingFamilies || []) {
        const extId = (f.specs as any)?.provenance?.external_id;
        if (extId) familyByExternalId.set(extId, f);
        familyByName.set(f.name.toLowerCase(), f);
        familyById.set(f.id, f);
    }

    const items: SyncItem[] = [];

    if (mode === 'DISCOVERY') {
        for (const model of models) {
            const familyKey = model.provenance.external_id || model.name.toLowerCase();
            const existing =
                familyByExternalId.get(model.provenance.external_id) || familyByName.get(model.name.toLowerCase());

            items.push({
                type: 'PRODUCT',
                name: model.name,
                action: existing ? 'SKIP' : 'CREATE',
                existing_id: existing?.id,
                existing_specs: existing?.specs || {},
                diffs: [],
                provenance: model.provenance,
                match_key: `PRODUCT|${familyKey}`,
                children: [],
            });
        }

        const plan: SyncPlan = {
            brand_id: brandId,
            mode,
            items,
            stats: { creates: 0, updates: 0, skips: 0, assets_to_download: 0 },
        };
        calculatePlanStats(plan.items, plan.stats);
        return plan;
    }

    for (const model of models) {
        const familyKey = model.provenance.external_id || model.name.toLowerCase();
        const familyMatchKey = `PRODUCT|${familyKey}`;
        const overrideId = matchOverrides?.[familyMatchKey];

        const { modelSpecs, variantSpecs } = segregateSpecs(model.specs);
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedModelName = normalize(model.name);

        const existing =
            (overrideId ? familyById.get(overrideId) : null) ||
            familyByExternalId.get(model.provenance.external_id) ||
            familyByName.get(model.name.toLowerCase()) ||
            existingFamilies?.find((f: any) => normalize(f.name) === normalizedModelName);

        const diffs = computeDiffs(existing?.specs || {}, modelSpecs);
        const action: SyncAction = existing
            ? diffs.filter(d => d.action === 'accept').length > 0
                ? 'UPDATE'
                : 'SKIP'
            : 'CREATE';

        let existingVariants: any[] = [];
        if (existing) {
            const { data } = await (supabase as any)
                .from('cat_variants_vehicle')
                .select('id, name, slug, specs, status, position')
                .eq('model_id', existing.id);
            existingVariants = data || [];
        }

        const childItems: SyncItem[] = [];
        for (const variant of model.variants) {
            const variantKey = variant.provenance.external_id || variant.name.toLowerCase();
            const variantMatchKey = `VARIANT|${familyKey}|${variantKey}`;
            const variantOverrideId = matchOverrides?.[variantMatchKey];
            const existingVar =
                (variantOverrideId ? existingVariants.find(v => v.id === variantOverrideId) : null) ||
                matchItem(existingVariants, variant.provenance.external_id, variant.name);

            const combinedVarSpecs = { ...variantSpecs, ...variant.specs };
            const varDiffs = computeDiffs(existingVar?.specs || {}, combinedVarSpecs);
            const varAction: SyncAction = existingVar
                ? varDiffs.filter(d => d.action === 'accept').length > 0
                    ? 'UPDATE'
                    : 'SKIP'
                : 'CREATE';

            let existingColors: any[] = [];
            if (existingVar) {
                const { data } = await (supabase as any)
                    .from('cat_skus')
                    .select('id, name, slug, hex_primary, hex_secondary, status, position')
                    .eq('vehicle_variant_id', existingVar.id);
                existingColors = data || [];
            }

            const colorItems: SyncItem[] = [];
            for (const color of variant.colors) {
                const colorKey = color.provenance.external_id || color.name.toLowerCase();
                const colorMatchKey = `UNIT|${familyKey}|${variantKey}|${colorKey}`;
                const colorOverrideId = matchOverrides?.[colorMatchKey];
                const existingCol =
                    (colorOverrideId ? existingColors.find(c => c.id === colorOverrideId) : null) ||
                    matchItem(existingColors, color.provenance.external_id, color.name);

                const colDiffs = computeDiffs(existingCol?.specs || {}, {
                    hex_primary: color.hex_primary,
                    hex_secondary: color.hex_secondary,
                    finish: color.finish,
                });
                const colAction: SyncAction = existingCol
                    ? colDiffs.filter(d => d.action === 'accept').length > 0
                        ? 'UPDATE'
                        : 'SKIP'
                    : 'CREATE';

                colorItems.push({
                    type: 'UNIT',
                    name: color.name,
                    action: colAction,
                    existing_id: existingCol?.id,
                    existing_specs: existingCol?.specs || {},
                    diffs: colDiffs,
                    provenance: color.provenance,
                    match_key: colorMatchKey,
                    parent_existing_id: existingVar?.id,
                    assets: color.media_urls.map(url => ({ url, action: 'download' as const })),
                });
            }

            childItems.push({
                type: 'VARIANT',
                name: variant.name,
                action: varAction,
                existing_id: existingVar?.id,
                existing_specs: existingVar?.specs || {},
                diffs: varDiffs,
                provenance: variant.provenance,
                match_key: variantMatchKey,
                parent_existing_id: existing?.id,
                children: colorItems,
            });
        }

        items.push({
            type: 'PRODUCT',
            name: model.name,
            action,
            existing_id: existing?.id,
            existing_specs: existing?.specs || {},
            diffs,
            provenance: model.provenance,
            match_key: familyMatchKey,
            children: childItems,
        });
    }

    const plan: SyncPlan = {
        brand_id: brandId,
        mode,
        items,
        stats: { creates: 0, updates: 0, skips: 0, assets_to_download: 0 },
    };
    calculatePlanStats(plan.items, plan.stats);
    return plan;
}

// ─── Execute Sync (DB Writes) ───────────────────────────────────────────

export async function executeSyncPlan(params: { plan: SyncPlan; dryRun?: boolean }): Promise<SyncResult> {
    const { plan, dryRun = false } = params;
    const supabase = await createServerClient();
    const result: SyncResult = {
        success: true,
        created: 0,
        updated: 0,
        skipped: 0,
        assets_downloaded: 0,
        assets_linked: 0,
        errors: [],
        created_ids: [],
    };

    let existingHashes: Set<string> | undefined;
    if (!dryRun) {
        const { data: assetData } = await supabase.from('cat_assets').select('sha256').not('sha256', 'is', null);
        if (assetData) {
            existingHashes = new Set((assetData as any[]).map(a => a.sha256!));
        }
    }

    for (const family of plan.items) {
        try {
            if (family.action === 'SKIP') {
                result.skipped++;
                if (family.children) result.skipped += countAllDescendants(family.children);
                continue;
            }

            let familyId = family.existing_id;
            if (family.action === 'CREATE') {
                if (dryRun) {
                    result.created++;
                    result.created_ids.push({ name: family.name, id: 'dry-run', type: 'PRODUCT' });
                } else {
                    const slug = generateSlug(family.provenance.brand_slug, family.name);
                    const specs = mergeSpecs({}, family.diffs, family.provenance);
                    const { data, error } = await (supabase as any)
                        .from('cat_models')
                        .insert({
                            brand_id: plan.brand_id,
                            name: family.name,
                            slug,
                            status: 'INACTIVE',
                            specs: specs as any,
                        })
                        .select('id')
                        .single();

                    if (error) {
                        result.errors.push(`Family "${family.name}": ${error.message}`);
                        continue;
                    }
                    familyId = data.id;
                    result.created++;
                    result.created_ids.push({ name: family.name, id: familyId!, type: 'PRODUCT' });
                }
            } else if (family.action === 'UPDATE' && familyId) {
                if (!dryRun) {
                    const specs = mergeSpecs(family.existing_specs || {}, family.diffs, family.provenance);
                    const { error } = await (supabase as any)
                        .from('cat_models')
                        .update({ specs: specs as any })
                        .eq('id', familyId);
                    if (error) result.errors.push(`Family update "${family.name}": ${error.message}`);
                }
                result.updated++;
            }

            if (family.assets && family.assets.length > 0 && (familyId || dryRun)) {
                await syncItemAssets({
                    item: family,
                    itemId: familyId || 'dry-run',
                    plan,
                    result,
                    dryRun,
                    familyName: family.name,
                    existingHashes,
                });
            }

            if (family.children && (familyId || dryRun)) {
                for (const variant of family.children) {
                    await syncChild(
                        supabase,
                        variant,
                        familyId || 'dry-run',
                        plan,
                        result,
                        dryRun,
                        family.name,
                        existingHashes
                    );
                }
            }
        } catch (e: unknown) {
            result.errors.push(`Family "${family.name}": ${e.message}`);
            result.success = false;
        }
    }

    // Legacy linear dual-write intentionally disabled.

    if (result.errors.length > 0) result.success = false;
    return result;
}

// ─── Helpers ────────────────────────────────────────────────────────────

async function syncChild(
    supabase: any,
    item: SyncItem,
    parentId: string,
    plan: SyncPlan,
    result: SyncResult,
    dryRun: boolean,
    familyName?: string,
    existingHashes?: Set<string>
) {
    if (item.action === 'SKIP') {
        result.skipped++;
        if (item.children) result.skipped += countAllDescendants(item.children);
        return;
    }

    let itemId = item.existing_id;
    if (item.action === 'CREATE') {
        if (dryRun) {
            result.created++;
            result.created_ids.push({ name: item.name, id: 'dry-run', type: item.type });
        } else {
            const slug = generateSlug(item.provenance.brand_slug, item.name);
            const specs = mergeSpecs({}, item.diffs, item.provenance);
            const { data, error } =
                item.type === 'VARIANT'
                    ? await supabase
                          .from('cat_variants_vehicle')
                          .insert({
                              model_id: parentId,
                              brand_id: plan.brand_id,
                              name: item.name,
                              slug,
                              status: 'INACTIVE',
                              specs: specs as any,
                          } as any)
                          .select('id')
                          .single()
                    : await supabase
                          .from('cat_skus')
                          .insert({
                              vehicle_variant_id: parentId,
                              brand_id: plan.brand_id,
                              name: item.name,
                              slug,
                              status: 'INACTIVE',
                              hex_primary: (specs as any)?.hex_primary || null,
                              hex_secondary: (specs as any)?.hex_secondary || null,
                          } as any)
                          .select('id')
                          .single();

            if (error) {
                result.errors.push(`${item.type} "${item.name}": ${error.message}`);
                return;
            }
            itemId = data.id;
            result.created++;
            result.created_ids.push({ name: item.name, id: itemId!, type: item.type });
        }
    } else if (item.action === 'UPDATE' && itemId) {
        if (!dryRun) {
            const specs = mergeSpecs(item.existing_specs || {}, item.diffs, item.provenance);
            const targetTable = item.type === 'VARIANT' ? 'cat_variants_vehicle' : 'cat_skus';
            const { error } = await (supabase as any)
                .from(targetTable)
                .update({ specs: specs as any })
                .eq('id', itemId);
            if (error) result.errors.push(`${item.type} update "${item.name}": ${error.message}`);
        }
        result.updated++;
    }

    if (item.assets && item.assets.length > 0 && (itemId || dryRun)) {
        await syncItemAssets({
            item,
            itemId: itemId || 'dry-run',
            plan,
            result,
            dryRun,
            familyName,
            existingHashes,
        });
    }

    if (item.children && (itemId || dryRun)) {
        for (const child of item.children) {
            await syncChild(supabase, child, itemId || 'dry-run', plan, result, dryRun, familyName, existingHashes);
        }
    }
}

async function syncItemAssets(params: {
    item: SyncItem;
    itemId: string;
    plan: SyncPlan;
    result: SyncResult;
    dryRun: boolean;
    familyName?: string;
    existingHashes?: Set<string>;
}) {
    const { item, itemId, plan, result, dryRun, familyName, existingHashes } = params;
    const downloadRequests: DownloadRequest[] = (item.assets || [])
        .filter(a => a.action === 'download')
        .map((a, idx) => {
            const cleanUrl = a.url.split('?')[0];
            const urlExt = cleanUrl.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
            const allowed = ['webp', 'jpg', 'jpeg', 'png', 'svg', 'avif', 'gif', 'mp4', 'pdf'];
            const ext = urlExt && allowed.includes(urlExt) ? urlExt : 'webp';

            return {
                url: a.url,
                targetPath: generateAssetPath({
                    brandSlug: item.provenance.brand_slug,
                    modelSlug: familyName || item.name,
                    colorSlug: item.type === 'PRODUCT' ? undefined : item.name,
                    filename: `${idx + 1}.${ext}`,
                }),
            };
        });

    if (downloadRequests.length > 0) {
        if (dryRun) {
            result.assets_downloaded += downloadRequests.length;
        } else {
            const batchResult = await downloadBatch(downloadRequests, existingHashes);
            result.assets_downloaded += batchResult.completed + batchResult.skipped;

            if (itemId !== 'dry-run') {
                const linkResult = await linkAssets({
                    itemId,
                    assets: batchResult.results,
                    dryRun: false,
                });
                result.assets_linked += linkResult.linked;
                if (linkResult.errors.length > 0) result.errors.push(...linkResult.errors);
            }
        }
    }
}

function countAllDescendants(items: SyncItem[]): number {
    let count = 0;
    for (const item of items) {
        count++;
        if (item.children) count += countAllDescendants(item.children);
    }
    return count;
}

function calculatePlanStats(
    items: SyncItem[],
    stats: { creates: number; updates: number; skips: number; assets_to_download: number }
) {
    for (const item of items) {
        if (item.action === 'CREATE') stats.creates++;
        else if (item.action === 'UPDATE') stats.updates++;
        else if (item.action === 'SKIP') stats.skips++;

        if (item.assets) stats.assets_to_download += item.assets.filter(a => a.action === 'download').length;
        if (item.children) calculatePlanStats(item.children, stats);
    }
}

function computeDiffs(currentSpecs: Record<string, unknown>, incomingSpecs: Record<string, unknown>): FieldDiff[] {
    const diffs: FieldDiff[] = [];
    const allKeys = new Set([...Object.keys(currentSpecs), ...Object.keys(incomingSpecs)]);

    for (const key of allKeys) {
        if (key === 'provenance' || key === 'gallery' || key === 'media' || key === 'video_urls' || key === 'pdf_urls')
            continue;
        const current = currentSpecs[key];
        const incoming = incomingSpecs[key];
        if (incoming === undefined || incoming === null) continue;
        if (JSON.stringify(current) === JSON.stringify(incoming)) continue;

        diffs.push({
            field: key,
            current,
            incoming,
            action: NEVER_OVERWRITE_FIELDS.includes(key) ? 'reject' : 'accept',
        });
    }
    return diffs;
}

function mergeSpecs(
    baseSpecs: Record<string, unknown>,
    diffs: FieldDiff[],
    provenance: Provenance
): Record<string, unknown> {
    const merged = { ...baseSpecs };
    for (const diff of diffs) {
        if (diff.action === 'accept') merged[diff.field] = diff.incoming;
    }
    merged.provenance = provenance;
    return merged;
}

function matchItem(existingItems: any[], externalId: string, name: string): any | null {
    const byProvenance = existingItems.find(i => i.specs?.provenance?.external_id === externalId);
    if (byProvenance) return byProvenance;

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedTarget = normalize(name);
    return (
        existingItems.find(
            i => i.name.toLowerCase() === name.toLowerCase() || normalize(i.name) === normalizedTarget
        ) || null
    );
}

/**
 * Link downloaded assets to a cat_skus record via cat_assets.
 */
export async function linkAssets(params: {
    itemId: string;
    assets: DownloadResult[];
    dryRun?: boolean;
}): Promise<{ linked: number; errors: string[] }> {
    const { itemId, assets, dryRun = false } = params;
    const supabase = await createServerClient();
    let linked = 0;
    const errors: string[] = [];

    for (const asset of assets) {
        if (asset.status !== 'downloaded' && asset.status !== 'dedupe_skipped') continue;
        if (dryRun) {
            linked++;
            continue;
        }

        try {
            const assetType = asset.contentType?.startsWith('video/')
                ? 'VIDEO'
                : asset.contentType === 'application/pdf'
                  ? 'PDF'
                  : 'IMAGE';

            const { error } = await supabase.from('cat_assets').upsert(
                {
                    item_id: itemId,
                    type: assetType,
                    url: asset.localPath,
                    sha256: asset.sha256,
                    content_type: asset.contentType,
                    file_size: asset.fileSize,
                    is_primary: linked === 0,
                    position: linked,
                    metadata: {
                        source_url: asset.url,
                        downloaded_at: new Date().toISOString(),
                    },
                },
                {
                    onConflict: 'item_id,sha256',
                }
            );

            if (error) errors.push(`Asset ${asset.localPath}: ${error.message}`);
            else linked++;
        } catch (e: unknown) {
            errors.push(`Asset ${asset.localPath}: ${e.message}`);
        }
    }
    return { linked, errors };
}

/**
 * Deprecated no-op: linear table sync is retired.
 */
export async function refreshLinearCatalogForBrand(_supabase: any, _brandId: string) {
    return;
}
