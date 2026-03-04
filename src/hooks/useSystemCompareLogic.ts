'use client';

/**
 * useSystemCompareLogic — Shared compare hook for DesktopCompare and MobileCompare.
 * Centralizes model resolution, variant sorting, removal, and finance state.
 */

import { useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { groupProductsByModel, type ModelGroup } from '@/utils/variantGrouping';
import { slugify } from '@/utils/slugs';
import type { ProductVariant } from '@/types/productMaster';

export function useSystemCompareLogic() {
    const params = useParams();
    const searchParams = useSearchParams();
    const makeSlug = (params.make as string) || '';
    const modelSlug = (params.model as string) || '';
    const skuIdsParam = searchParams.get('skus');

    const { items, isLoading, needsLocation } = useSystemCatalogLogic(undefined, { allowStateOnly: true });

    // ── Variant removal state ──
    const [removedVariantIds, setRemovedVariantIds] = useState<Set<string>>(new Set());

    // ── Model group resolution ──
    const modelGroup = useMemo(() => {
        if (!items.length || !makeSlug || !modelSlug) return null;
        const groups = groupProductsByModel(items);
        const sameMakeGroups = groups.filter(g => slugify(g.make) === makeSlug);

        // Prefer exact model/group slug match to avoid collisions like:
        // "jupiter" accidentally matching "jupiter-125".
        const exactMatch =
            sameMakeGroups.find(g => {
                const gModel = slugify(g.model);
                const groupSlug = slugify(g.modelSlug || g.model);
                return gModel === modelSlug || groupSlug === modelSlug;
            }) || null;

        if (exactMatch) return exactMatch;

        // Legacy fallback: keep relaxed matching only when exact match is unavailable.
        return (
            sameMakeGroups.find(g => {
                const gModel = slugify(g.model);
                const groupSlug = slugify(g.modelSlug || g.model);
                return (
                    gModel.startsWith(`${modelSlug}-`) ||
                    groupSlug.startsWith(`${modelSlug}-`) ||
                    modelSlug.startsWith(`${gModel}-`) ||
                    modelSlug.startsWith(`${groupSlug}-`)
                );
            }) || null
        );
    }, [items, makeSlug, modelSlug]);

    // ── Sorted variants (cheapest first) ──
    const sortedVariants = useMemo(() => {
        if (skuIdsParam) {
            const ids = skuIdsParam.split(',').filter(Boolean);
            // Return exactly the items requested in the order they were requested if possible
            return ids.map(id => items.find(v => v.id === id)).filter(Boolean) as ProductVariant[];
        }
        if (!modelGroup) return [];
        return [...modelGroup.variants].sort((a, b) => (a.price?.exShowroom || 0) - (b.price?.exShowroom || 0));
    }, [items, skuIdsParam, modelGroup]);

    // ── Active variants (excluding removed) ──
    const activeVariants = useMemo(
        () => sortedVariants.filter(v => !removedVariantIds.has(v.id)),
        [sortedVariants, removedVariantIds]
    );

    const isMixedMode =
        !!skuIdsParam ||
        (activeVariants.length > 0 && activeVariants.some(v => v.modelSlug !== activeVariants[0].modelSlug));

    // ── Variant management ──
    const removeVariant = useCallback(
        (id: string) => {
            if (activeVariants.length <= 1) return; // Allow down to 1 in mixed mode?
            setRemovedVariantIds(prev => {
                const next = new Set(prev);
                next.add(id);
                return next;
            });
        },
        [activeVariants.length]
    );

    const removeVariantBySlug = useCallback(
        (slug: string) => {
            if (activeVariants.length <= 1) return;
            const target = activeVariants.find(v => v.slug === slug);
            if (target) {
                setRemovedVariantIds(prev => new Set(prev).add(target.id));
            }
        },
        [activeVariants]
    );

    const restoreAllVariants = useCallback(() => {
        setRemovedVariantIds(new Set());
    }, []);

    // ── Finance state (localStorage-backed, synced across tabs) ──
    const [downpayment, _setDownpayment] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('bkmb_downpayment');
            if (stored) return parseInt(stored);
        }
        return 15000;
    });

    const setDownpayment = useCallback((val: number) => {
        _setDownpayment(val);
        if (typeof window !== 'undefined') {
            localStorage.setItem('bkmb_downpayment', String(val));
            window.dispatchEvent(new CustomEvent('bkmb_dp_changed', { detail: val }));
        }
    }, []);

    const [tenure, setTenure] = useState(36);

    return {
        // Route params
        makeSlug,
        modelSlug,
        isMixedMode,

        // Data
        items,
        isLoading,
        needsLocation,
        modelGroup,
        sortedVariants,
        activeVariants,
        removedVariantIds,

        // Variant management
        removeVariant,
        removeVariantBySlug,
        restoreAllVariants,

        // Finance
        downpayment,
        setDownpayment,
        tenure,
        setTenure,
    };
}
