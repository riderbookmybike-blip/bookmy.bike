'use client';

/**
 * useSystemCompareLogic — Shared compare hook for DesktopCompare and MobileCompare.
 * Centralizes model resolution, variant sorting, removal, and finance state.
 */

import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { groupProductsByModel } from '@/utils/variantGrouping';
import { slugify } from '@/utils/slugs';
import type { ProductVariant } from '@/types/productMaster';

export function useSystemCompareLogic() {
    const params = useParams();
    const makeSlug = (params.make as string) || '';
    const modelSlug = (params.model as string) || '';

    const { items, isLoading, needsLocation } = useSystemCatalogLogic(undefined, { allowStateOnly: true });

    // ── Variant removal state ──
    const [removedVariantIds, setRemovedVariantIds] = useState<Set<string>>(new Set());

    // ── Model group resolution ──
    const modelGroup = useMemo(() => {
        if (!items.length) return null;
        const groups = groupProductsByModel(items);
        return (
            groups.find(g => {
                const gMake = slugify(g.make);
                const gModel = slugify(g.model);
                const groupSlug = slugify(g.modelSlug || g.model);
                const modelMatch =
                    gModel === modelSlug ||
                    groupSlug === modelSlug ||
                    gModel.startsWith(`${modelSlug}-`) ||
                    groupSlug.startsWith(`${modelSlug}-`) ||
                    modelSlug.startsWith(`${gModel}-`) ||
                    modelSlug.startsWith(`${groupSlug}-`);
                return gMake === makeSlug && modelMatch;
            }) || null
        );
    }, [items, makeSlug, modelSlug]);

    // ── Sorted variants (cheapest first) ──
    const sortedVariants = useMemo(() => {
        if (!modelGroup) return [];
        return [...modelGroup.variants].sort((a, b) => (a.price?.exShowroom || 0) - (b.price?.exShowroom || 0));
    }, [modelGroup]);

    // ── Active variants (excluding removed) ──
    const activeVariants = useMemo(
        () => sortedVariants.filter(v => !removedVariantIds.has(v.id)),
        [sortedVariants, removedVariantIds]
    );

    // ── Variant management ──
    const removeVariant = useCallback(
        (id: string) => {
            if (activeVariants.length <= 2) return;
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
            if (activeVariants.length <= 2) return;
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
