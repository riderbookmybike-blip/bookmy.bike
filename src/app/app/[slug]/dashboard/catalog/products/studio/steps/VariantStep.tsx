'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Trash2,
    Plus,
    Search,
    ImageIcon,
    Video,
    FileText,
    Edit2,
    Gauge,
    Box,
    CheckCircle2,
    Link2,
    X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SKUMediaManager from '@/components/catalog/SKUMediaManager';
import Modal from '@/components/ui/Modal';
import AttributeInput from '@/components/catalog/AttributeInput';
import { toast } from 'sonner';
import CopyableId from '@/components/ui/CopyableId';

// Helper to format text as Title Case
function toTitleCase(str: string): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

export default function VariantStep({ family, existingVariants, onUpdate, tenantId }: any) {
    const [error, setError] = useState<string | null>(null);
    const [newVariantName, setNewVariantName] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const suggestionsRef = useRef<HTMLDivElement | null>(null);
    const lookupBrandRef = useRef<HTMLSelectElement | null>(null);
    const [isReorderSaving, setIsReorderSaving] = useState(false);
    const [showReorderSaved, setShowReorderSaved] = useState(false);
    const reorderSavedTimeoutRef = useRef<number | null>(null);

    const [editingVariant, setEditingVariant] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // ─── Compatibility (Suitable For) State ───
    const [compatEntries, setCompatEntries] = useState<any[]>([]);
    const [compatBrands, setCompatBrands] = useState<any[]>([]);
    const [compatModels, setCompatModels] = useState<any[]>([]);
    const [compatVariants, setCompatVariants] = useState<any[]>([]);
    const [selCompatBrand, setSelCompatBrand] = useState<string>('');
    const [selCompatModel, setSelCompatModel] = useState<string>('');
    const [selCompatVariant, setSelCompatVariant] = useState<string>('');
    const [isSavingVariant, setIsSavingVariant] = useState(false);

    // Card-level compatibility display (map of variantId -> label[])
    const [cardCompatMap, setCardCompatMap] = useState<Record<string, string[]>>({});

    // Fetch brands for compatibility on mount + load card compat for all variants
    useEffect(() => {
        if (family?.category !== 'ACCESSORY') return;
        const fetchBrands = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('cat_brands').select('id, name').eq('is_active', true).order('name');
            if (data) setCompatBrands(data);
        };
        fetchBrands();
        loadAllCardCompat();
    }, [family?.category, existingVariants?.length]);

    // Load compatibility labels for all variant cards
    const loadAllCardCompat = async () => {
        if (family?.category !== 'ACCESSORY' || !existingVariants?.length) return;
        const supabase = createClient();
        const variantIds = existingVariants.map((v: any) => v.id);
        const { data: allCompat } = await supabase
            .from('cat_accessory_suitable_for')
            .select('variant_id, is_universal, target_brand_id, target_model_id, target_variant_id')
            .in('variant_id', variantIds);
        if (!allCompat || allCompat.length === 0) {
            setCardCompatMap({});
            return;
        }

        // Collect unique IDs for batch lookup
        const brandIds = new Set<string>();
        const familyIds = new Set<string>();
        const varIds = new Set<string>();
        allCompat.forEach((c: any) => {
            if (c.target_brand_id) brandIds.add(c.target_brand_id);
            if (c.target_model_id) familyIds.add(c.target_model_id);
            if (c.target_variant_id) varIds.add(c.target_variant_id);
        });

        const [brandsRes, familiesRes, varsRes] = await Promise.all([
            brandIds.size > 0
                ? supabase.from('cat_brands').select('id, name').in('id', Array.from(brandIds))
                : { data: [] },
            familyIds.size > 0
                ? supabase.from('cat_models').select('id, name').in('id', Array.from(familyIds))
                : { data: [] },
            varIds.size > 0
                ? supabase.from('cat_variants_vehicle').select('id, name').in('id', Array.from(varIds))
                : { data: [] },
        ]);
        const brandMap = new Map<string, string>(
            (brandsRes.data || []).map((b: any) => [String(b.id), String(b.name || '')])
        );
        const familyMap = new Map<string, string>(
            (familiesRes.data || []).map((f: any) => [String(f.id), String(f.name || '')])
        );
        const varMap = new Map<string, string>(
            (varsRes.data || []).map((v: any) => [String(v.id), String(v.name || '')])
        );

        const result: Record<string, string[]> = {};
        allCompat.forEach((c: any) => {
            let label = '';
            if (c.is_universal) {
                label = 'UNIVERSAL';
            } else {
                const parts: string[] = [];
                if (c.target_brand_id) parts.push(brandMap.get(String(c.target_brand_id)) || '?');
                if (c.target_model_id) parts.push(familyMap.get(String(c.target_model_id)) || '');
                else if (c.target_brand_id) parts.push('All');
                if (c.target_variant_id) parts.push(varMap.get(String(c.target_variant_id)) || '');
                label = parts.filter(Boolean).join(' ');
            }
            if (!result[c.variant_id]) result[c.variant_id] = [];
            result[c.variant_id].push(label);
        });
        setCardCompatMap(result);
    };

    // Fetch models when compat brand changes
    useEffect(() => {
        if (!selCompatBrand || selCompatBrand === 'UNIVERSAL') {
            setCompatModels([]);
            return;
        }
        const fetch = async () => {
            const supabase = createClient();
            const { data } = await (supabase as any)
                .from('cat_models')
                .select('id, name')
                .eq('brand_id', selCompatBrand)
                .eq('category', 'VEHICLE')
                .eq('status', 'ACTIVE')
                .order('name');
            if (data) setCompatModels(data);
        };
        fetch();
    }, [selCompatBrand]);

    // Fetch variants when compat model changes
    useEffect(() => {
        if (!selCompatModel || selCompatModel === 'ALL_MODELS') {
            setCompatVariants([]);
            return;
        }
        const fetch = async () => {
            const supabase = createClient();
            const { data } = await (supabase as any)
                .from('cat_variants_vehicle')
                .select('id, name')
                .eq('model_id', selCompatModel)
                .eq('status', 'ACTIVE')
                .order('name');
            if (data) setCompatVariants(data);
        };
        fetch();
    }, [selCompatModel]);

    // Fetch compatibility entries when opening edit modal
    const fetchCompatibility = async (variantId: string) => {
        const supabase = createClient();
        const { data: compat } = await supabase
            .from('cat_accessory_suitable_for')
            .select('id, is_universal, target_brand_id, target_model_id, target_variant_id')
            .eq('variant_id', variantId);
        if (compat && compat.length > 0) {
            const enriched = await Promise.all(
                compat.map(async (c: any) => {
                    let label = '';
                    if (c.is_universal) {
                        label = 'UNIVERSAL / ALL MODELS';
                    } else {
                        const parts: string[] = [];
                        if (c.target_brand_id) {
                            const { data: brand } = await supabase
                                .from('cat_brands')
                                .select('name')
                                .eq('id', c.target_brand_id)
                                .single();
                            parts.push(brand?.name || 'Unknown Brand');
                        }
                        if (c.target_model_id) {
                            const { data: fam } = await (supabase as any)
                                .from('cat_models')
                                .select('name')
                                .eq('id', c.target_model_id)
                                .single();
                            if (!c.target_variant_id) parts.push(`${fam?.name || 'All Models'}`);
                            else parts.push(fam?.name || '');
                        } else if (c.target_brand_id && !c.target_model_id) {
                            parts.push('(All Models)');
                        }
                        if (c.target_variant_id) {
                            const { data: v } = await (supabase as any)
                                .from('cat_variants_vehicle')
                                .select('name')
                                .eq('id', c.target_variant_id)
                                .single();
                            parts.push(v?.name || '');
                        }
                        label = parts.join(' ');
                    }
                    return { ...c, label };
                })
            );
            setCompatEntries(enriched);
        } else {
            setCompatEntries([]);
        }
    };

    const addCompatEntry = (overrideBrand?: string) => {
        const brandVal = overrideBrand || selCompatBrand;
        if (brandVal === 'UNIVERSAL') {
            if (compatEntries.some(c => c.is_universal)) return;
            setCompatEntries([
                ...compatEntries,
                {
                    id: `new-${Date.now()}`,
                    is_universal: true,
                    target_brand_id: null,
                    target_family_id: null,
                    target_variant_id: null,
                    label: 'UNIVERSAL / ALL MODELS',
                },
            ]);
        } else if (brandVal) {
            const brandName = compatBrands.find(b => b.id === selCompatBrand)?.name || '';
            const modelName =
                selCompatModel && selCompatModel !== 'ALL_MODELS'
                    ? compatModels.find(m => m.id === selCompatModel)?.name || ''
                    : '';
            const variantName =
                selCompatVariant && selCompatVariant !== 'ALL_VARIANTS'
                    ? compatVariants.find(v => v.id === selCompatVariant)?.name || ''
                    : '';
            const entry: any = {
                id: `new-${Date.now()}`,
                is_universal: false,
                target_brand_id: selCompatBrand,
                target_model_id: selCompatModel && selCompatModel !== 'ALL_MODELS' ? selCompatModel : null,
                target_variant_id: selCompatVariant && selCompatVariant !== 'ALL_VARIANTS' ? selCompatVariant : null,
                label: [brandName, modelName || '(All Models)', variantName].filter(Boolean).join(' '),
            };
            const isDup = compatEntries.some(
                c =>
                    c.target_brand_id === entry.target_brand_id &&
                    c.target_model_id === entry.target_model_id &&
                    c.target_variant_id === entry.target_variant_id
            );
            if (!isDup) setCompatEntries([...compatEntries, entry]);
        }
        setSelCompatBrand('');
        setSelCompatModel('');
        setSelCompatVariant('');
    };

    // Media Manager State
    const [activeMediaVariant, setActiveMediaVariant] = useState<any>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    // Lookup Constants & State
    const isLookupMode = false;
    const [lookupBrands, setLookupBrands] = useState<any[]>([]);
    const [lookupFamilies, setLookupFamilies] = useState<any[]>([]);
    const [lookupVariants, setLookupVariants] = useState<any[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<string>('');
    const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');

    const l1Label = 'Variant';
    // Mock/Common Suggestions if needed, or just unique existing ones
    const commonVariants = ['STANDARD', 'PRO', 'PLUS', 'SE', 'DISC', 'DRUM', 'BASE', 'TOP', 'LUXURY'];

    useEffect(() => {
        const query = newVariantName.trim().toUpperCase();
        if (query) {
            const existingMatches = existingVariants
                .filter((v: any) => v.name.toUpperCase().includes(query))
                .map((v: any) => ({ name: v.name.toUpperCase(), isExisting: true }));

            const commonMatches = commonVariants
                .filter(v => v.includes(query) && !existingVariants.some((ev: any) => ev.name.toUpperCase() === v))
                .map(v => ({ name: v, isExisting: false }));

            const combined = [...existingMatches, ...commonMatches];
            setSuggestions(combined as any);
            setShowSuggestions(combined.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }, [newVariantName, existingVariants]);

    useEffect(() => {
        if (isAdding && isLookupMode) {
            setTimeout(() => lookupBrandRef.current?.focus(), 0);
        }
    }, [isAdding, isLookupMode]);

    useEffect(() => {
        return () => {
            if (reorderSavedTimeoutRef.current) {
                window.clearTimeout(reorderSavedTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!showSuggestions) {
            setHighlightedIndex(-1);
        }
    }, [showSuggestions]);

    useEffect(() => {
        if (!showSuggestions) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (!suggestionsRef.current) return;
            if (!suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [showSuggestions]);

    const selectSuggestion = (suggestion: any) => {
        if (!suggestion?.name) return;
        if (!suggestion.isExisting) {
            handleAddVariant(suggestion.name);
        } else {
            setNewVariantName('');
            setShowSuggestions(false);
        }
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions) {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleAddVariant(newVariantName);
            }
            if (event.key === 'Escape') setShowSuggestions(false);
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlightedIndex(prev => {
                const next = prev + 1;
                return next >= suggestions.length ? 0 : next;
            });
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlightedIndex(prev => {
                const next = prev - 1;
                return next < 0 ? suggestions.length - 1 : next;
            });
            return;
        }
        if (event.key === 'Enter') {
            if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                event.preventDefault();
                selectSuggestion(suggestions[highlightedIndex]);
            }
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            setShowSuggestions(false);
        }
    };

    const handleLookupKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            setIsAdding(false);
            setSelectedBrandId('');
            setSelectedFamilyId('');
            setNewVariantName('');
            return;
        }
        if (event.key === 'Enter') {
            if (!selectedBrandId) return;
            event.preventDefault();
            const selectedBrand = lookupBrands.find(b => b.id === selectedBrandId);
            const selectedModel = lookupFamilies.find(f => f.id === selectedFamilyId);
            const derivedName = newVariantName || selectedModel?.name || selectedBrand?.name || '';
            if (derivedName) handleAddVariant(derivedName);
        }
    };

    // Lookup Effects
    useEffect(() => {
        if (isLookupMode) {
            const fetchBrands = async () => {
                const supabase = createClient();
                const { data } = await supabase.from('cat_brands').select('id, name').order('name');
                if (data) setLookupBrands(data);
            };
            fetchBrands();
        }
    }, [isLookupMode]);

    useEffect(() => {
        if (selectedBrandId) {
            const fetchFamilies = async () => {
                const supabase = createClient();
                let query = supabase.from('cat_models').select('id, name, brand_id, brands:cat_brands(name)');

                if (selectedBrandId !== 'ALL') {
                    query = query.eq('brand_id', selectedBrandId);
                }

                const { data } = await query.order('name');
                if (data) setLookupFamilies(data);
                setLookupVariants([]);
                setSelectedFamilyId('');
            };
            fetchFamilies();
        }
    }, [selectedBrandId]);

    useEffect(() => {
        if (selectedFamilyId) {
            const fetchVariants = async () => {
                const supabase = createClient();
                const { data } = await (supabase as any)
                    .from('cat_variants_vehicle')
                    .select('id, name')
                    .eq('model_id', selectedFamilyId)
                    .order('name');
                if (data) setLookupVariants(data);
            };
            fetchVariants();
        }
    }, [selectedFamilyId]);

    const handleAddVariant = async (name: string) => {
        if (!name.trim()) return;

        // Prevent Adding Exact Duplicates
        const normalizedName = name.trim().toUpperCase();
        const exists = existingVariants.some((ev: any) => ev.name.toUpperCase() === normalizedName);
        if (exists) {
            setNewVariantName('');
            setShowSuggestions(false);
            return;
        }

        try {
            const supabase = createClient();
            const validPositions = existingVariants.map((v: any) => parseInt(v.position)).filter((p: any) => !isNaN(p));
            const nextPosition = validPositions.length > 0 ? Math.max(...validPositions) + 1 : 1;

            const titleCasedName = toTitleCase(name); // Enforce Title Case

            // Robust Slug: family-slug + compact-variant-name
            const cleanVariantName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const generatedSlug = `${family.slug}-${cleanVariantName}`;

            // Pre-emptive uniqueness check locally
            const isDuplicate = existingVariants.some((v: any) => v.slug === generatedSlug);
            if (isDuplicate) {
                toast.error(`A variant with this name/slug already exists for this model.`);
                return;
            }

            const payload = {
                name: titleCasedName,
                specs: { [l1Label]: titleCasedName },
                type: 'VARIANT',
                status: 'ACTIVE',
                brand_id: family.brand_id,
                category: family.category || 'VEHICLE',
                parent_id: family.id,
                slug: generatedSlug,
                position: nextPosition,
                hsn_code: family.hsn_code || '',
            };

            const { data, error: dbError } = await (supabase as any)
                .from('cat_variants_vehicle')
                .upsert(
                    {
                        name: titleCasedName,
                        specs: { [l1Label]: titleCasedName },
                        status: 'ACTIVE',
                        brand_id: family.brand_id,
                        category: family.category || 'VEHICLE',
                        model_id: family.id,
                        slug: generatedSlug,
                        position: nextPosition,
                        hsn_code: family.hsn_code || '',
                    },
                    { onConflict: 'slug' }
                )
                .select()
                .single();

            if (dbError) throw dbError;

            const alreadyExists = existingVariants.some((v: any) => v.slug === data.slug);
            if (!alreadyExists) {
                onUpdate([...existingVariants, data].sort((a: any, b: any) => (a.position || 0) - (b.position || 0)));
            } else {
                onUpdate(
                    existingVariants
                        .map((v: any) => (v.slug === data.slug ? data : v))
                        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                );
            }
            setNewVariantName('');
            setShowSuggestions(false);
            toast.success(`${l1Label} added successfully`);
        } catch (err: unknown) {
            console.error(err);
            setError(err.message);
            toast.error(`Failed to add ${l1Label}`);
        }
    };

    const handleUpdatePosition = async (variantId: string, newPos: number) => {
        const val = parseInt(newPos.toString());
        if (isNaN(val)) return;

        const previousList = [...existingVariants];
        const sorted = [...existingVariants].sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
        const currentIndex = sorted.findIndex((v: any) => v.id === variantId);
        if (currentIndex === -1) return;

        const [movedItem] = sorted.splice(currentIndex, 1);
        const targetIndex = Math.max(0, Math.min(val - 1, sorted.length));
        if (currentIndex === targetIndex) return;
        sorted.splice(targetIndex, 0, movedItem);

        const updatedList = sorted.map((v: any, idx: number) => ({
            ...v,
            position: idx + 1,
        }));

        onUpdate(updatedList);

        const supabase = createClient();
        try {
            setIsReorderSaving(true);
            await Promise.all(
                updatedList.map((item: any) =>
                    supabase.from('cat_variants_vehicle').update({ position: item.position }).eq('id', item.id)
                )
            );
            setShowReorderSaved(true);
            if (reorderSavedTimeoutRef.current) {
                window.clearTimeout(reorderSavedTimeoutRef.current);
            }
            reorderSavedTimeoutRef.current = window.setTimeout(() => {
                setShowReorderSaved(false);
            }, 1200);
        } catch (err) {
            console.error('Reorder failed', err);
            onUpdate(previousList);
            toast.error('Failed to save order');
        } finally {
            setIsReorderSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`Are you sure you want to delete this ${l1Label.toLowerCase()}?`)) return;
        try {
            const supabase = createClient();
            const { error } = await supabase.from('cat_variants_vehicle').delete().eq('id', id);
            if (error) throw error;
            onUpdate(existingVariants.filter((v: any) => v.id !== id));
            toast.success('Variant deleted');
        } catch (err: unknown) {
            toast.error('Failed to delete: ' + err.message);
        }
    };

    const AssetBadge = ({ icon: Icon, shared, specific, color }: any) => (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 group/asset">
            <div className={`p-1 rounded ${color} shadow-sm group-hover/asset:scale-110 transition-transform`}>
                <Icon size={10} />
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black tracking-tighter uppercase whitespace-nowrap">
                <span className="text-indigo-600 font-black">{specific}</span>
                <span className="text-slate-300 mx-0.5">/</span>
                <span className="text-slate-400 font-medium">{shared}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Variant Specifications
                </div>
            </div>

            {existingVariants?.length === 0 && (
                <div className="px-4 py-3 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    No {l1Label.toLowerCase()} yet. Add your first one.
                </div>
            )}

            <div className="flex items-center justify-between text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Variants</span>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {isReorderSaving && <span className="text-indigo-500">Saving order…</span>}
                    {!isReorderSaving && showReorderSaved && <span className="text-emerald-500">Order saved</span>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                {existingVariants.map((v: any) => {
                    // No key attributes
                    const keyAttributes: any[] = [];

                    return (
                        <div
                            key={v.id}
                            className="relative bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col justify-between group hover:border-indigo-500/20 transition-all shadow-xl shadow-slate-200/5 min-h-[200px]"
                        >
                            <div className="absolute -top-2 -left-2 w-7 h-7 bg-slate-900 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center text-white font-black italic text-[10px] shadow-lg z-10">
                                {v.position}
                            </div>

                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        setEditingVariant(v);
                                        setIsEditModalOpen(true);
                                        if (family?.category === 'ACCESSORY') {
                                            fetchCompatibility(v.id);
                                        }
                                    }}
                                    className="p-2 bg-slate-100 dark:bg-white/10 rounded-full text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <Edit2 size={12} />
                                </button>
                            </div>

                            <div className="flex-1">
                                <h4 className="font-black text-lg text-slate-900 dark:text-white uppercase italic leading-none">
                                    {v.name}
                                </h4>
                                <CopyableId id={v.id} className="mt-2" />
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="number"
                                        value={v.position}
                                        onChange={e => handleUpdatePosition(v.id, parseInt(e.target.value))}
                                        className="w-10 bg-slate-100 dark:bg-black/20 rounded-md text-[10px] font-black text-center py-0.5 outline-none border border-transparent focus:border-indigo-500/30"
                                    />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        Sequence No.
                                    </span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 block opacity-30">
                                    {v.slug}
                                </span>

                                {/* Suitable For — on Card */}
                                {family?.category === 'ACCESSORY' && (
                                    <div className="flex flex-wrap items-center gap-1 mt-3">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mr-1">
                                            Suitable For:
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                                            {v.name}
                                        </span>
                                        {cardCompatMap[v.id]?.map((label: string, i: number) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20"
                                            >
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Variant Media Button */}
                                <div className="mt-4">
                                    <button
                                        onClick={() => {
                                            setActiveMediaVariant(v);
                                            setIsMediaModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 group/media"
                                    >
                                        {(() => {
                                            // Dynamic Specs Preview
                                            if (keyAttributes.length > 0) {
                                                return (
                                                    <div className="grid grid-cols-3 gap-2 mb-4 mt-4 py-3 border-t border-slate-100 dark:border-white/5">
                                                        {keyAttributes.map((attr: any, i: number) => (
                                                            <div
                                                                key={attr.key}
                                                                className={`text-center ${i < keyAttributes.length - 1 ? 'border-r border-slate-100 dark:border-white/5' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-center gap-1 text-[9px] uppercase text-slate-400 font-bold mb-0.5">
                                                                    {attr.type === 'number' ? (
                                                                        <Gauge size={10} />
                                                                    ) : (
                                                                        <Box size={10} />
                                                                    )}
                                                                    {attr.label?.split(' ')[0] || attr.key}
                                                                </div>
                                                                <div className="text-xs font-black text-slate-700 dark:text-slate-200">
                                                                    {v.specs?.[attr.key] ? (
                                                                        Array.isArray(v.specs[attr.key]) ? (
                                                                            `${v.specs[attr.key].length} Items`
                                                                        ) : (
                                                                            `${v.specs[attr.key]}${attr.suffix && !attr.label?.toLowerCase().includes('material') && !(attr.key === 'weight' && attr.type === 'select') ? attr.suffix : ''}`
                                                                        )
                                                                    ) : family?.specs?.[attr.key] ? (
                                                                        Array.isArray(family.specs[attr.key]) ? (
                                                                            <span className="text-slate-400">
                                                                                {family.specs[attr.key].length} Items
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-400">
                                                                                {family.specs[attr.key]}
                                                                                {attr.suffix &&
                                                                                !attr.label
                                                                                    ?.toLowerCase()
                                                                                    .includes('material') &&
                                                                                !(
                                                                                    attr.key === 'weight' &&
                                                                                    attr.type === 'select'
                                                                                )
                                                                                    ? attr.suffix
                                                                                    : ''}
                                                                            </span>
                                                                        )
                                                                    ) : (
                                                                        '-'
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }

                                            const ownVideoCount = v.specs?.video_urls?.length || 0;
                                            const ownPdfCount = v.specs?.pdf_urls?.length || 0;
                                            const ownImageCount = v.specs?.gallery?.length || 0;

                                            const inheritedVideoCount = family?.specs?.video_urls?.length || 0;
                                            const inheritedPdfCount = family?.specs?.pdf_urls?.length || 0;
                                            const inheritedImageCount = family?.specs?.gallery?.length || 0;

                                            const totalAssets =
                                                ownImageCount +
                                                ownVideoCount +
                                                ownPdfCount +
                                                inheritedVideoCount +
                                                inheritedPdfCount +
                                                inheritedImageCount;

                                            return totalAssets > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <AssetBadge
                                                        icon={ImageIcon}
                                                        specific={ownImageCount}
                                                        shared={inheritedImageCount}
                                                        color="bg-indigo-50 text-indigo-600"
                                                    />
                                                    <AssetBadge
                                                        icon={Video}
                                                        specific={ownVideoCount}
                                                        shared={inheritedVideoCount}
                                                        color="bg-rose-50 text-rose-600"
                                                    />
                                                    <AssetBadge
                                                        icon={FileText}
                                                        specific={ownPdfCount}
                                                        shared={inheritedPdfCount}
                                                        color="bg-emerald-50 text-emerald-600"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/media:text-indigo-600 group-hover/media:bg-slate-100 transition-all">
                                                    <ImageIcon size={12} /> Add Media
                                                </div>
                                            );
                                        })()}
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(v.id)}
                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    );
                })}

                {/* Add Variant Card / Lookup Mode */}
                {isLookupMode ? (
                    /* LOOKUP MODE: Same flow as normal - click to expand, then select */
                    !isAdding ? (
                        <button
                            onClick={() => {
                                setIsAdding(true);
                                setSelectedBrandId('');
                                setSelectedFamilyId('');
                                setNewVariantName('');
                            }}
                            className="group relative h-40 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] p-6 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-indigo-600 shadow-sm"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm">
                                <Plus size={24} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">Add {l1Label}</span>
                        </button>
                    ) : (
                        <div
                            ref={suggestionsRef}
                            className="relative bg-slate-50/50 dark:bg-white/5 p-8 rounded-[2.5rem] border-2 border-dashed border-indigo-500/40 flex flex-col justify-center gap-4 transition-all shadow-2xl shadow-indigo-500/5"
                            onKeyDown={handleLookupKeyDown}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                                    New {l1Label} Name
                                </span>
                                <button
                                    onClick={() => {
                                        setIsAdding(false);
                                        setSelectedBrandId('');
                                        setSelectedFamilyId('');
                                        setNewVariantName('');
                                    }}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <Plus size={16} className="rotate-45" />
                                </button>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <select
                                        ref={lookupBrandRef}
                                        value={selectedBrandId}
                                        onChange={e => {
                                            setSelectedBrandId(e.target.value);
                                            setSelectedFamilyId('');
                                            setNewVariantName('');
                                        }}
                                        className="flex-1 min-w-[120px] bg-transparent border-none p-0 text-lg font-black uppercase italic text-slate-900 dark:text-white outline-none cursor-pointer"
                                    >
                                        <option value="" className="text-slate-300">
                                            BRAND...
                                        </option>
                                        {lookupBrands.map(b => (
                                            <option key={b.id} value={b.id} className="text-lg font-bold">
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedBrandId && (
                                        <>
                                            <span className="text-slate-300">→</span>
                                            <select
                                                value={selectedFamilyId}
                                                onChange={e => {
                                                    setSelectedFamilyId(e.target.value);
                                                    setNewVariantName('');
                                                }}
                                                className="flex-1 min-w-[120px] bg-transparent border-none p-0 text-lg font-black uppercase italic text-slate-900 dark:text-white outline-none cursor-pointer"
                                            >
                                                <option value="" className="text-slate-300">
                                                    MODEL...
                                                </option>
                                                {lookupFamilies.map(f => (
                                                    <option key={f.id} value={f.id} className="text-lg font-bold">
                                                        {f.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                    {selectedFamilyId && (
                                        <>
                                            <span className="text-slate-300">→</span>
                                            <select
                                                value={newVariantName}
                                                onChange={e => setNewVariantName(e.target.value)}
                                                className="flex-1 min-w-[120px] bg-transparent border-none p-0 text-2xl font-black uppercase italic text-slate-900 dark:text-white outline-none cursor-pointer"
                                            >
                                                <option value="" className="text-slate-300">
                                                    SELECT {l1Label}...
                                                </option>
                                                {lookupVariants.map(v => {
                                                    const isAlreadyAdded = existingVariants.some(
                                                        (ev: any) => ev.name.toUpperCase() === v.name.toUpperCase()
                                                    );
                                                    return (
                                                        <option
                                                            key={v.id}
                                                            value={v.name}
                                                            disabled={isAlreadyAdded}
                                                            className="text-lg font-bold"
                                                        >
                                                            {v.name}
                                                            {isAlreadyAdded ? ' ✓' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </>
                                    )}
                                    <button
                                        onClick={() => {
                                            // Derive name from: variant > model > brand
                                            const selectedBrand = lookupBrands.find(b => b.id === selectedBrandId);
                                            const selectedModel = lookupFamilies.find(f => f.id === selectedFamilyId);
                                            const derivedName =
                                                newVariantName || selectedModel?.name || selectedBrand?.name || '';
                                            if (derivedName) handleAddVariant(derivedName);
                                        }}
                                        disabled={!selectedBrandId}
                                        className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 hover:scale-110 active:scale-95 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                ) : !isAdding ? (
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setTimeout(() => document.getElementById('new-variant-input')?.focus(), 100);
                        }}
                        className="group relative h-40 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] p-6 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-indigo-600 shadow-sm"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm">
                            <Plus size={24} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Add {l1Label}</span>
                    </button>
                ) : (
                    <div
                        ref={suggestionsRef}
                        className="relative bg-slate-50/50 dark:bg-white/5 p-8 rounded-[2.5rem] border-2 border-dashed border-indigo-500/40 flex flex-col justify-center gap-4 transition-all shadow-2xl shadow-indigo-500/5"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                                New {l1Label} Name
                            </span>
                            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                                <Plus size={16} className="rotate-45" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <input
                                    id="new-variant-input"
                                    type="text"
                                    autoComplete="off"
                                    value={newVariantName}
                                    onChange={e => setNewVariantName(e.target.value)}
                                    placeholder={`e.g. STANDARD...`}
                                    onKeyDown={handleInputKeyDown}
                                    className="flex-1 bg-transparent border-none p-0 text-2xl font-black uppercase italic text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-white/10 outline-none"
                                />
                                <button
                                    onClick={() => handleAddVariant(newVariantName)}
                                    className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 hover:scale-110 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
                                >
                                    <Plus size={20} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* Autocomplete Suggestions (Only for Text Mode) */}
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl p-4 z-[100] animate-in zoom-in-95 fade-in duration-200">
                                <div className="flex items-center gap-2 mb-3 px-2">
                                    <Search size={12} className="text-slate-400" />
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                        Suggestions
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.map((s: any, i) => (
                                        <button
                                            key={i}
                                            onClick={e => {
                                                e.stopPropagation();
                                                selectSuggestion(s);
                                            }}
                                            className={`px-4 py-2 border flex items-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${i === highlightedIndex ? 'bg-indigo-600 text-white border-indigo-600' : s.isExisting ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-white/10 border-transparent hover:bg-indigo-600 hover:text-white'}`}
                                        >
                                            {s.name}
                                            {s.isExisting && (
                                                <span className="text-[7px] bg-slate-200 dark:bg-white/10 px-1 rounded">
                                                    EXISTING
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* Media Manager Modal */}
                {isMediaModalOpen && activeMediaVariant && (
                    <SKUMediaManager
                        skuName={activeMediaVariant.name}
                        initialImages={activeMediaVariant.specs?.gallery || []}
                        initialVideos={
                            activeMediaVariant.specs?.video_urls?.length > 0
                                ? activeMediaVariant.specs.video_urls
                                : (family?.specs?.video_urls ?? [])
                        }
                        initialPdfs={
                            activeMediaVariant.specs?.pdf_urls?.length > 0
                                ? activeMediaVariant.specs.pdf_urls
                                : (family?.specs?.pdf_urls ?? [])
                        }
                        initialPrimary={activeMediaVariant.specs?.primary_image}
                        // Pass family media as inherited
                        inheritedVideos={family?.specs?.video_urls || []}
                        inheritedPdfs={family?.specs?.pdf_urls || []}
                        inheritedFrom={family?.name}
                        onSave={async (images, videos, pdfs, primary) => {
                            const updatedSpecs = {
                                ...activeMediaVariant.specs,
                                gallery: images,
                                video_urls: videos,
                                pdf_urls: pdfs,
                                primary_image: primary,
                            };

                            const updatedList = existingVariants.map((v: any) =>
                                v.id === activeMediaVariant.id ? { ...v, specs: updatedSpecs } : v
                            );

                            onUpdate(updatedList);

                            const supabase = createClient();
                            await (supabase as any)
                                .from('cat_variants_vehicle')
                                .update({ specs: updatedSpecs })
                                .eq('id', activeMediaVariant.id);
                        }}
                        onClose={() => setIsMediaModalOpen(false)}
                    />
                )}
            </div>
            {error && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
            )}

            {/* Edit Variant Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`Edit ${editingVariant?.name || 'Variant'}`}
                size="xl"
            >
                {editingVariant && (
                    <div className="space-y-6">
                        {/* Core Basic Info */}
                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                                    {l1Label} Name (Visible to Users)
                                </label>
                                <input
                                    type="text"
                                    value={editingVariant.name}
                                    onChange={e =>
                                        setEditingVariant({ ...editingVariant, name: e.target.value.toUpperCase() })
                                    }
                                    className="w-full bg-transparent font-black text-2xl outline-none border-b-2 border-slate-200 dark:border-white/10 focus:border-indigo-500 py-2 uppercase italic text-slate-900 dark:text-white"
                                    placeholder="e.g. STANDARD"
                                />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight opacity-50">
                                    Current Slug: {editingVariant.slug}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {([] as any[]).map((attr: any) => (
                                <div
                                    key={attr.key}
                                    className={`space-y-2 ${attr.type === 'service_schedule' || attr.type === 'warranty' ? 'md:col-span-2 lg:col-span-3' : ''}`}
                                >
                                    <label
                                        className="text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-help dashed-underline decoration-slate-300"
                                        title={`Key: ${attr.key} | Type: ${attr.type} | Suffix: ${attr.suffix || 'None'}`}
                                    >
                                        {attr.label}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <AttributeInput
                                            attr={attr}
                                            value={editingVariant.specs?.[attr.key]}
                                            onChange={val =>
                                                setEditingVariant({
                                                    ...editingVariant,
                                                    specs: { ...editingVariant.specs, [attr.key]: val },
                                                })
                                            }
                                            className="bg-transparent font-bold text-lg outline-none w-full border-b border-gray-200 dark:border-gray-700 focus:border-indigo-500 py-1"
                                        />
                                        {attr.suffix &&
                                            !attr.label?.toLowerCase().includes('material') &&
                                            !(attr.key === 'weight' && attr.type === 'select') && (
                                                <span className="text-xs font-bold text-indigo-400 text-[10px] uppercase tracking-wider">
                                                    {attr.suffix}
                                                </span>
                                            )}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        Inherited: <span className="font-bold">{family?.specs?.[attr.key] || '-'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ─── SUITABLE FOR (ACCESSORY only) ─── */}
                        {family?.category === 'ACCESSORY' && (
                            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Link2 size={12} className="text-indigo-500" /> Suitable For (Vehicle Compatibility)
                                </label>
                                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                                    {compatEntries.map((entry: any) => (
                                        <div
                                            key={entry.id}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm"
                                        >
                                            {entry.label}
                                            <button
                                                onClick={() =>
                                                    setCompatEntries(
                                                        compatEntries.filter((c: any) => c.id !== entry.id)
                                                    )
                                                }
                                                className="hover:scale-125 transition-transform"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {compatEntries.length === 0 && (
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1">
                                            No Compatibility Set
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-3">
                                    {/* Brand Selector */}
                                    <select
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 shadow-sm"
                                        value={selCompatBrand}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setSelCompatBrand(val);
                                            setSelCompatModel('');
                                            setSelCompatVariant('');
                                            if (val === 'UNIVERSAL') addCompatEntry('UNIVERSAL');
                                        }}
                                    >
                                        <option value="">Select Brand...</option>
                                        <option value="UNIVERSAL">UNIVERSAL / ALL MODELS</option>
                                        {compatBrands.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                    {/* Model Selector */}
                                    {selCompatBrand && selCompatBrand !== 'UNIVERSAL' && (
                                        <select
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 shadow-sm"
                                            value={selCompatModel}
                                            onChange={e => {
                                                setSelCompatModel(e.target.value);
                                                setSelCompatVariant('');
                                            }}
                                        >
                                            <option value="">Select Model...</option>
                                            <option value="ALL_MODELS">
                                                All {compatBrands.find(b => b.id === selCompatBrand)?.name} Models
                                            </option>
                                            {compatModels.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {/* Variant Selector */}
                                    {selCompatModel && selCompatModel !== 'ALL_MODELS' && (
                                        <select
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 shadow-sm"
                                            value={selCompatVariant}
                                            onChange={e => setSelCompatVariant(e.target.value)}
                                        >
                                            <option value="">Select Variant...</option>
                                            <option value="ALL_VARIANTS">
                                                All {compatModels.find(m => m.id === selCompatModel)?.name} Variants
                                            </option>
                                            {compatVariants.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {/* Add Button */}
                                    {selCompatBrand && selCompatBrand !== 'UNIVERSAL' && (
                                        <button
                                            onClick={() => addCompatEntry()}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all w-fit"
                                        >
                                            <Plus size={12} /> Add Compatibility
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-white/5">
                            <button
                                disabled={isSavingVariant}
                                onClick={async () => {
                                    setIsSavingVariant(true);
                                    try {
                                        // Save Logic
                                        const supabase = createClient();

                                        // 1. Prepare Payload
                                        const nameRaw = editingVariant.name.trim();
                                        const nameTitle = toTitleCase(nameRaw);
                                        const newSlug = `${family.slug}-${nameRaw}`
                                            .toLowerCase()
                                            .trim()
                                            .replace(/[^a-z0-9\s-]/g, '')
                                            .replace(/\s+/g, '-')
                                            .replace(/-+/g, '-')
                                            .replace(/^-|-$/g, '');

                                        const updatedSpecs = {
                                            ...editingVariant.specs,
                                            [l1Label]: nameTitle, // Sync the name spec too
                                        };

                                        // 2. Update Database
                                        const { error } = await (supabase as any)
                                            .from('cat_variants_vehicle')
                                            .update({
                                                name: nameTitle,
                                                slug: newSlug,
                                                specs: updatedSpecs,
                                            })
                                            .eq('id', editingVariant.id);

                                        if (error) throw error;

                                        // 3. Sync compatibility entries (ACCESSORY only)
                                        if (family?.category === 'ACCESSORY') {
                                            await supabase
                                                .from('cat_accessory_suitable_for')
                                                .delete()
                                                .eq('variant_id', editingVariant.id);
                                            if (compatEntries.length > 0) {
                                                const compatRows = compatEntries.map((c: any) => ({
                                                    variant_id: editingVariant.id,
                                                    is_universal: c.is_universal || false,
                                                    target_brand_id: c.target_brand_id || null,
                                                    target_model_id: c.target_model_id || c.target_family_id || null,
                                                    target_variant_id: c.target_variant_id || null,
                                                }));
                                                const { error: compatErr } = await supabase
                                                    .from('cat_accessory_suitable_for')
                                                    .insert(compatRows);
                                                if (compatErr)
                                                    console.error('Compatibility insert warning:', compatErr);
                                            }
                                        }

                                        // 4. Update Local State (including the new variant data)
                                        const updatedVariant = {
                                            ...editingVariant,
                                            name: nameTitle,
                                            slug: newSlug,
                                            specs: updatedSpecs,
                                        };

                                        onUpdate(
                                            existingVariants.map((v: any) =>
                                                v.id === editingVariant.id ? updatedVariant : v
                                            )
                                        );
                                        setIsEditModalOpen(false);
                                        if (family?.category === 'ACCESSORY') loadAllCardCompat();
                                        toast.success(
                                            'Variant updated' +
                                                (family?.category === 'ACCESSORY' ? ' with compatibility' : '')
                                        );
                                    } catch (err: unknown) {
                                        toast.error('Failed to update variant: ' + err.message);
                                    } finally {
                                        setIsSavingVariant(false);
                                    }
                                }}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
