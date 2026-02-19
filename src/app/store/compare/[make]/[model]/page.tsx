'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, GitCompareArrows, Menu, Search, X } from 'lucide-react';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { groupProductsByModel } from '@/utils/variantGrouping';
import { ProductCard } from '@/components/store/desktop/ProductCard';
import { slugify } from '@/utils/slugs';
import type { ProductVariant } from '@/types/productMaster';

const PAGE_SIZE = 3;

// --- Spec Diffing Engine ---

/** Flatten a nested object into flat key-value pairs with dot-path keys */
function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    if (!obj || typeof obj !== 'object') return result;
    for (const [key, val] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val)) {
            Object.assign(result, flattenObject(val, path));
        } else if (val !== null && val !== undefined && val !== '') {
            result[path] = String(val);
        }
    }
    return result;
}

/** Human-friendly label from a dot-path key */
function labelFromKey(key: string): string {
    const last = key.split('.').pop() || key;
    return last.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
}

/** Group key by its top-level category */
function categoryFromKey(key: string): string {
    const first = key.split('.')[0] || key;
    return first.replace(/^./, s => s.toUpperCase());
}

type SpecRow = {
    category: string;
    label: string;
    values: (string | null)[];
    isDifferent: boolean;
};

/**
 * Synonym map — keys that are alternate spellings of the same spec.
 * Maps  alias → canonical key.
 * The canonical key is what gets displayed.
 */
const SPEC_SYNONYMS: Record<string, string> = {
    'dimensions.curbWeight': 'dimensions.kerbWeight',
    curbWeight: 'kerbWeight',
};

/** Normalize flat keys using the synonym map */
function normalizeFlatSpecs(flat: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(flat)) {
        const canonical = SPEC_SYNONYMS[key] || key;
        // Keep the first non-empty value for a canonical key
        if (!result[canonical]) {
            result[canonical] = val;
        }
    }
    return result;
}

/**
 * Normalize a spec value for *comparison only* (not for display).
 * - Lowercase
 * - Trim whitespace
 * - Collapse multiple spaces
 * - Strip trailing zeros after decimal (3.20 → 3.2)
 * - Standardize units: KW → kW, NM → Nm, BHP → bhp, PS → ps
 */
function normalizeForCompare(val: string): string {
    let s = val.trim().replace(/\s+/g, ' ').toLowerCase();
    // Normalize trailing decimal zeros: 3.20 → 3.2, 10.00 → 10
    s = s.replace(/(\d+\.\d*?)0+(\s|$)/g, '$1$2').replace(/\.(\s|$)/g, '$1');
    return s;
}

/** Compute ALL specs across variants, flagging which ones differ */
function computeAllSpecs(variants: ProductVariant[]): SpecRow[] {
    if (variants.length === 0) return [];

    const flatSpecs = variants.map(v => {
        const raw = flattenObject((v.specifications || {}) as Record<string, any>);
        return normalizeFlatSpecs(raw);
    });

    // Also include top-level diffable fields
    const extraFields = ['displacement', 'fuelType', 'bodyType', 'segment'] as const;
    for (let i = 0; i < variants.length; i++) {
        for (const field of extraFields) {
            const val = (variants[i] as any)[field];
            if (val !== null && val !== undefined && val !== '') {
                const canonical = SPEC_SYNONYMS[field] || field;
                if (!flatSpecs[i][canonical]) {
                    flatSpecs[i][canonical] = String(val);
                }
            }
        }
    }

    const allKeys = new Set<string>();
    flatSpecs.forEach(fs => Object.keys(fs).forEach(k => allKeys.add(k)));

    const rows: SpecRow[] = [];
    for (const key of allKeys) {
        const values = flatSpecs.map(fs => fs[key] || null);
        const nonNull = values.filter((v): v is string => v !== null && v !== '');
        if (nonNull.length === 0) continue;

        const normalized = nonNull.map(normalizeForCompare);
        const allSame = normalized.every(v => v === normalized[0]);
        const isDifferent = !allSame || nonNull.length < variants.length;

        rows.push({
            category: categoryFromKey(key),
            label: labelFromKey(key),
            values,
            isDifferent,
        });
    }

    rows.sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));
    return rows;
}

// --- Page Component ---

export default function VariantComparePage() {
    const params = useParams();
    const router = useRouter();
    const makeSlug = (params.make as string) || '';
    const modelSlug = (params.model as string) || '';

    const { items, isLoading } = useSystemCatalogLogic();
    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const modelGroup = useMemo(() => {
        if (!items.length) return null;
        const groups = groupProductsByModel(items);
        return (
            groups.find(g => {
                const gMake = slugify(g.make);
                const gModel = slugify(g.model);
                return gMake === makeSlug && (gModel === modelSlug || g.modelSlug === modelSlug);
            }) || null
        );
    }, [items, makeSlug, modelSlug]);

    const sortedVariants = useMemo(() => {
        if (!modelGroup) return [];
        return [...modelGroup.variants].sort((a, b) => (a.price?.exShowroom || 0) - (b.price?.exShowroom || 0));
    }, [modelGroup]);

    const allSpecs = useMemo(() => computeAllSpecs(sortedVariants), [sortedVariants]);

    const groupedSpecs = useMemo(() => {
        const map = new Map<string, SpecRow[]>();
        for (const row of allSpecs) {
            const arr = map.get(row.category) || [];
            arr.push(row);
            map.set(row.category, arr);
        }
        return Array.from(map.entries());
    }, [allSpecs]);

    const totalPages = Math.ceil(sortedVariants.length / PAGE_SIZE);
    const visibleVariants = sortedVariants.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d10] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-[#F4B000] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        Loading variants...
                    </p>
                </div>
            </div>
        );
    }

    if (!modelGroup || sortedVariants.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d10] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-lg font-black uppercase tracking-widest text-slate-400">Model not found</p>
                    <button
                        onClick={() => router.push('/store/catalog')}
                        className="px-6 py-3 bg-[#F4B000] text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        Back to Catalog
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d10] transition-colors duration-500">
            {/* Catalog-Style Discovery Bar */}
            <div className="page-container pt-4 pb-4">
                <header
                    className="hidden md:block sticky z-[90] py-0 transition-all duration-300"
                    style={{ top: 'var(--header-h)' }}
                >
                    <div className="w-full">
                        <div className="rounded-full bg-slate-50/15 dark:bg-[#0b0d10]/25 backdrop-blur-3xl border border-slate-200 dark:border-white/10 shadow-2xl h-14 px-4 flex items-center">
                            <div className="flex items-center gap-3 w-full">
                                <button
                                    onClick={() => router.push('/store/catalog')}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white shrink-0"
                                    title="Back to Catalog"
                                >
                                    <Menu size={16} />
                                </button>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 w-full bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2 h-10">
                                        <Search size={14} className="text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search brand, product, variant"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="flex-1 min-w-0 bg-transparent text-[11px] font-black tracking-widest uppercase focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="flex items-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            {/* Catalog-Style Card Grid */}
            <div className="page-container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {visibleVariants.map(v => (
                        <ProductCard key={v.id} v={v} viewMode="grid" downpayment={15000} tenure={36} />
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all ${
                                page === 0
                                    ? 'border-slate-200 dark:border-white/10 text-slate-300 dark:text-white/20 cursor-not-allowed'
                                    : 'border-slate-300 dark:border-white/20 text-slate-600 dark:text-white hover:bg-[#F4B000] hover:border-[#F4B000] hover:text-black'
                            }`}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                                        i === page
                                            ? 'bg-[#F4B000] scale-125'
                                            : 'bg-slate-300 dark:bg-white/20 hover:bg-slate-400'
                                    }`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all ${
                                page >= totalPages - 1
                                    ? 'border-slate-200 dark:border-white/10 text-slate-300 dark:text-white/20 cursor-not-allowed'
                                    : 'border-slate-300 dark:border-white/20 text-slate-600 dark:text-white hover:bg-[#F4B000] hover:border-[#F4B000] hover:text-black'
                            }`}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* ────── Full Specifications Table ────── */}
            {allSpecs.length > 0 && (
                <div className="page-container py-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-[#F4B000]/10 flex items-center justify-center">
                            <GitCompareArrows size={16} className="text-[#F4B000]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                All Specifications
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {allSpecs.filter(s => s.isDifferent).length} of {allSpecs.length} specs differ across
                                variants
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0f1115] border border-black/[0.04] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                        {/* Header Row — variant names */}
                        <div
                            className="grid border-b border-black/[0.04] dark:border-white/5 sticky top-0 bg-white dark:bg-[#0f1115] z-10"
                            style={{ gridTemplateColumns: `180px repeat(${sortedVariants.length}, 1fr)` }}
                        >
                            <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-r border-black/[0.04] dark:border-white/5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    Specification
                                </span>
                            </div>
                            {sortedVariants.map((v, i) => (
                                <div
                                    key={v.id}
                                    className={`p-4 text-center ${i < sortedVariants.length - 1 ? 'border-r border-black/[0.04] dark:border-white/5' : ''}`}
                                >
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                                        {v.variant}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                        ₹{(v.price?.exShowroom || 0).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Category Groups */}
                        {groupedSpecs.map(([category, rows]) => (
                            <div key={category}>
                                {/* Category Label */}
                                <div className="px-4 py-2 border-b border-black/[0.04] dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02]">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F4B000]">
                                        {category}
                                    </span>
                                </div>

                                {/* Spec Rows */}
                                {rows.map((row, rIdx) => (
                                    <div
                                        key={`${category}-${rIdx}`}
                                        className={`grid border-b border-black/[0.04] dark:border-white/5 last:border-b-0 transition-colors ${
                                            row.isDifferent
                                                ? 'bg-[#F4B000]/[0.04] hover:bg-[#F4B000]/[0.08]'
                                                : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                                        }`}
                                        style={{ gridTemplateColumns: `180px repeat(${sortedVariants.length}, 1fr)` }}
                                    >
                                        <div className="px-4 py-3 bg-slate-50/40 dark:bg-white/[0.01] border-r border-black/[0.04] dark:border-white/5 flex items-center gap-1.5">
                                            {row.isDifferent && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#F4B000] shrink-0" />
                                            )}
                                            <span
                                                className={`text-[10px] font-bold ${
                                                    row.isDifferent
                                                        ? 'text-slate-700 dark:text-slate-200'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                }`}
                                            >
                                                {row.label}
                                            </span>
                                        </div>
                                        {row.values.map((val, vIdx) => {
                                            const isUnique =
                                                row.isDifferent &&
                                                val &&
                                                row.values.filter(v => v === val).length === 1;
                                            return (
                                                <div
                                                    key={vIdx}
                                                    className={`px-4 py-3 flex items-center justify-center text-center ${
                                                        vIdx < sortedVariants.length - 1
                                                            ? 'border-r border-black/[0.04] dark:border-white/5'
                                                            : ''
                                                    }`}
                                                >
                                                    <span
                                                        className={`text-[11px] font-semibold ${
                                                            !val
                                                                ? 'text-slate-300 dark:text-white/20 italic'
                                                                : isUnique
                                                                  ? 'text-[#F4B000] font-bold'
                                                                  : 'text-slate-700 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {val || '—'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
