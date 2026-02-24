'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronRight, Plus, Loader2, AlertCircle, CheckCircle2, Users, Package, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sanitizeSvg } from '@/lib/utils/sanitizeSvg';
import { getErrorMessage } from '@/lib/utils/errorMessage';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tenantId: string;
}

type PricingPrefill = {
    exShowroom: number;
    rto: number;
    insuranceTp: number;
    zeroDep: number;
    rti: number;
};

type AccessoryOption = {
    id: string;
    name: string;
    amount: number;
};

const toPositiveAmount = (value: unknown): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100) / 100;
};

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export default function NewRequisitionModal({ isOpen, onClose, onSuccess, tenantId }: ModalProps) {
    const supabase = createClient();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Catalog Data
    const [brands, setBrands] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [variants, setVariants] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);

    // Selections
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [customerName, setCustomerName] = useState('');
    const [notes, setNotes] = useState('');
    const [loadingPrefill, setLoadingPrefill] = useState(false);
    const [pricingPrefill, setPricingPrefill] = useState<PricingPrefill | null>(null);
    const [selectedInsuranceAddons, setSelectedInsuranceAddons] = useState<{ zeroDep: boolean; rti: boolean }>({
        zeroDep: false,
        rti: false,
    });
    const [accessoryOptions, setAccessoryOptions] = useState<AccessoryOption[]>([]);
    const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchBrands();
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setStep(1);
        setSelectedBrand(null);
        setSelectedModel(null);
        setSelectedVariant(null);
        setSelectedColor(null);
        setQuantity(1);
        setCustomerName('');
        setNotes('');
        setPricingPrefill(null);
        setSelectedInsuranceAddons({ zeroDep: false, rti: false });
        setAccessoryOptions([]);
        setSelectedAccessoryIds([]);
        setLoadingPrefill(false);
        setError(null);
    };

    const fetchBrands = async () => {
        setLoading(true);
        const { data } = await supabase.from('cat_brands').select('*').eq('is_active', true).order('name');
        setBrands(data || []);
        setLoading(false);
    };

    const fetchModels = async (brandId: string) => {
        setLoading(true);
        const { data } = await (supabase as any)
            .from('cat_models')
            .select('*')
            .eq('brand_id', brandId)
            .eq('status', 'ACTIVE');
        setModels(data || []);
        setLoading(false);
    };

    const fetchVariants = async (modelId: string) => {
        setLoading(true);
        const { data } = await (supabase as any)
            .from('cat_variants_vehicle')
            .select('*')
            .eq('model_id', modelId)
            .eq('status', 'ACTIVE');
        setVariants(data || []);
        setLoading(false);
    };

    const fetchColors = async (variantId: string) => {
        setLoading(true);
        const { data } = await (supabase as any)
            .from('cat_skus')
            .select('*')
            .eq('vehicle_variant_id', variantId)
            .eq('status', 'ACTIVE');
        setColors(data || []);
        setLoading(false);
    };

    const fetchSkuPrefill = async (skuId: string, modelId: string | null, variantId: string | null) => {
        setLoadingPrefill(true);
        setError(null);

        try {
            const { data: priceRows } = await (supabase as any)
                .from('cat_price_state_mh')
                .select(
                    `
                    state_code,
                    publish_stage,
                    ex_showroom,
                    rto_total_state,
                    rto_total_bh,
                    rto_total_company,
                    ins_sum_mandatory_insurance,
                    ins_sum_mandatory_insurance_gst_amount,
                    ins_gross_premium,
                    addon_zero_depreciation_total_amount,
                    addon_return_to_invoice_total_amount
                    `
                )
                .eq('sku_id', skuId);

            const activeRows = (priceRows || []).filter(
                (row: any) => String(row.publish_stage || '').toUpperCase() === 'PUBLISHED'
            );
            const candidateRows = activeRows.length > 0 ? activeRows : priceRows || [];
            const preferredRow =
                candidateRows.find(
                    (row: any) =>
                        String(row.state_code || '').toUpperCase() === 'MH' && toPositiveAmount(row.rto_total_state) > 0
                ) ||
                candidateRows.find((row: any) => String(row.state_code || '').toUpperCase() === 'MH') ||
                candidateRows.find((row: any) => toPositiveAmount(row.rto_total_state) > 0) ||
                candidateRows[0];

            if (!preferredRow) {
                setPricingPrefill(null);
                setAccessoryOptions([]);
                setSelectedAccessoryIds([]);
                return;
            }

            const exShowroom = toPositiveAmount(preferredRow.ex_showroom);
            const rto =
                toPositiveAmount(preferredRow.rto_total_state) ||
                toPositiveAmount(preferredRow.rto_total_bh) ||
                toPositiveAmount(preferredRow.rto_total_company);

            const mandatoryInsurance =
                toPositiveAmount(preferredRow.ins_sum_mandatory_insurance) +
                toPositiveAmount(preferredRow.ins_sum_mandatory_insurance_gst_amount);
            const insuranceTp =
                mandatoryInsurance > 0 ? mandatoryInsurance : toPositiveAmount(preferredRow.ins_gross_premium);

            setPricingPrefill({
                exShowroom,
                rto,
                insuranceTp,
                zeroDep: toPositiveAmount(preferredRow.addon_zero_depreciation_total_amount),
                rti: toPositiveAmount(preferredRow.addon_return_to_invoice_total_amount),
            });

            if (!modelId) {
                setAccessoryOptions([]);
                setSelectedAccessoryIds([]);
                return;
            }

            const { data: accessorySkus } = await (supabase as any)
                .from('cat_skus')
                .select('id, name, price_base, accessory_variant_id')
                .eq('sku_type', 'ACCESSORY')
                .eq('status', 'ACTIVE')
                .eq('model_id', modelId);

            const accessoryIds = (accessorySkus || []).map((item: any) => item.id).filter(Boolean);
            const accessoryVariantIds = (accessorySkus || [])
                .map((item: any) => item.accessory_variant_id)
                .filter(Boolean);

            const [compatResult, accessoryPriceResult] = await Promise.all([
                accessoryVariantIds.length > 0
                    ? (supabase as any)
                          .from('cat_accessory_suitable_for')
                          .select('variant_id, is_universal, target_model_id, target_variant_id')
                          .in('variant_id', accessoryVariantIds)
                    : Promise.resolve({ data: [] }),
                accessoryIds.length > 0
                    ? (supabase as any)
                          .from('cat_price_state_mh')
                          .select('sku_id, state_code, publish_stage, ex_showroom')
                          .in('sku_id', accessoryIds)
                    : Promise.resolve({ data: [] }),
            ]);

            const compatMap = new Map<string, any[]>();
            for (const row of compatResult?.data || []) {
                if (!compatMap.has(row.variant_id)) compatMap.set(row.variant_id, []);
                compatMap.get(row.variant_id)?.push(row);
            }

            const priceMap = new Map<string, number>();
            for (const row of accessoryPriceResult?.data || []) {
                const stage = String(row.publish_stage || '').toUpperCase();
                if (stage && stage !== 'PUBLISHED') continue;
                const state = String(row.state_code || '').toUpperCase();
                if (state && state !== 'MH' && state !== 'ALL') continue;
                const amount = toPositiveAmount(row.ex_showroom);
                if (amount <= 0) continue;
                if (!priceMap.has(row.sku_id)) {
                    priceMap.set(row.sku_id, amount);
                }
            }

            const options: AccessoryOption[] = (accessorySkus || [])
                .filter((item: any) => {
                    if (!item.accessory_variant_id || !variantId) return true;
                    const compatRows = compatMap.get(item.accessory_variant_id) || [];
                    if (compatRows.length === 0) return true;
                    return compatRows.some((row: any) => {
                        if (row.is_universal) return true;
                        if (row.target_variant_id && row.target_variant_id === variantId) return true;
                        if (!row.target_variant_id && row.target_model_id && row.target_model_id === modelId)
                            return true;
                        return false;
                    });
                })
                .map((item: any) => ({
                    id: item.id,
                    name: item.name || 'Accessory',
                    amount: priceMap.get(item.id) || toPositiveAmount(item.price_base),
                }))
                .filter((item: AccessoryOption) => item.amount > 0)
                .sort((a: AccessoryOption, b: AccessoryOption) => a.name.localeCompare(b.name));

            setAccessoryOptions(options);
            setSelectedAccessoryIds(prev => prev.filter(id => options.some(option => option.id === id)));
        } catch (prefillErr: unknown) {
            console.error('Prefill Error:', prefillErr);
            setPricingPrefill(null);
            setAccessoryOptions([]);
            setSelectedAccessoryIds([]);
            setError('Unable to fetch pricing baseline for selected SKU');
        } finally {
            setLoadingPrefill(false);
        }
    };

    const handleBrandSelect = (id: string) => {
        setSelectedBrand(id);
        fetchModels(id);
        setStep(2);
    };

    const handleModelSelect = (id: string) => {
        setSelectedModel(id);
        setSelectedVariant(null);
        setSelectedColor(null);
        setPricingPrefill(null);
        setSelectedInsuranceAddons({ zeroDep: false, rti: false });
        setAccessoryOptions([]);
        setSelectedAccessoryIds([]);
        fetchVariants(id);
        setStep(3);
    };

    const handleVariantSelect = (id: string) => {
        setSelectedVariant(id);
        setSelectedColor(null);
        setPricingPrefill(null);
        setSelectedInsuranceAddons({ zeroDep: false, rti: false });
        setAccessoryOptions([]);
        setSelectedAccessoryIds([]);
        fetchColors(id);
        setStep(4);
    };

    const handleColorSelect = (id: string) => {
        setSelectedColor(id);
        setSelectedInsuranceAddons({ zeroDep: false, rti: false });
        setSelectedAccessoryIds([]);
        setStep(5);
        void fetchSkuPrefill(id, selectedModel, selectedVariant);
    };

    const requiredCostItems = useMemo(() => {
        if (!pricingPrefill) return [];

        return [
            {
                cost_type: 'EX_SHOWROOM' as const,
                expected_amount: pricingPrefill.exShowroom,
                description: 'Auto from SKU pricing',
            },
            {
                cost_type: 'RTO_REGISTRATION' as const,
                expected_amount: pricingPrefill.rto,
                description: 'Auto from SKU pricing',
            },
            {
                cost_type: 'INSURANCE_TP' as const,
                expected_amount: pricingPrefill.insuranceTp,
                description: 'Mandatory insurance from SKU pricing',
            },
        ].filter(item => item.expected_amount > 0);
    }, [pricingPrefill]);

    const selectedAccessoryOptions = useMemo(
        () => accessoryOptions.filter(option => selectedAccessoryIds.includes(option.id)),
        [accessoryOptions, selectedAccessoryIds]
    );

    const selectedAccessoryAmount = useMemo(
        () => Math.round(selectedAccessoryOptions.reduce((sum, option) => sum + option.amount, 0) * 100) / 100,
        [selectedAccessoryOptions]
    );

    const selectedInsuranceAmount = useMemo(() => {
        if (!pricingPrefill) return 0;
        const zeroDep = selectedInsuranceAddons.zeroDep ? pricingPrefill.zeroDep : 0;
        const rti = selectedInsuranceAddons.rti ? pricingPrefill.rti : 0;
        return Math.round((zeroDep + rti) * 100) / 100;
    }, [pricingPrefill, selectedInsuranceAddons]);

    const requiredTotal = useMemo(
        () => Math.round(requiredCostItems.reduce((sum, item) => sum + item.expected_amount, 0) * 100) / 100,
        [requiredCostItems]
    );

    const optionalTotal = Math.round((selectedInsuranceAmount + selectedAccessoryAmount) * 100) / 100;
    const estimatedOnRoad = Math.round((requiredTotal + optionalTotal) * 100) / 100;

    const toggleAccessory = (id: string) => {
        setSelectedAccessoryIds(prev => (prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]));
    };

    const handleSubmit = async () => {
        if (!selectedColor || !tenantId) return;
        if (loadingPrefill) return;
        if (!pricingPrefill || requiredCostItems.length === 0) {
            setError('Pricing baseline missing for selected SKU. Publish SKU pricing first.');
            return;
        }

        setLoading(true);
        setError(null);

        const selectedInsuranceLabels: string[] = [];
        if (selectedInsuranceAddons.zeroDep && pricingPrefill.zeroDep > 0)
            selectedInsuranceLabels.push('Zero Depreciation');
        if (selectedInsuranceAddons.rti && pricingPrefill.rti > 0) selectedInsuranceLabels.push('Return To Invoice');

        const requestItems: Array<{
            cost_type: 'EX_SHOWROOM' | 'RTO_REGISTRATION' | 'INSURANCE_TP' | 'INSURANCE_ZD' | 'ACCESSORY';
            expected_amount: number;
            description?: string;
        }> = [...requiredCostItems];

        if (selectedInsuranceAmount > 0) {
            requestItems.push({
                cost_type: 'INSURANCE_ZD',
                expected_amount: selectedInsuranceAmount,
                description:
                    selectedInsuranceLabels.length > 0
                        ? `Selected insurance add-ons: ${selectedInsuranceLabels.join(', ')}`
                        : 'Selected insurance add-ons',
            });
        }

        if (selectedAccessoryAmount > 0) {
            requestItems.push({
                cost_type: 'ACCESSORY',
                expected_amount: selectedAccessoryAmount,
                description: `Selected accessories: ${selectedAccessoryOptions.map(item => item.name).join(', ')}`,
            });
        }

        try {
            const { createRequest } = await import('@/actions/inventory');

            // For vehicles, create per-unit requisitions for strict unit-level procurement tracking.
            for (let i = 0; i < quantity; i++) {
                const res = await createRequest({
                    tenant_id: tenantId,
                    sku_id: selectedColor,
                    source_type: 'DIRECT',
                    items: requestItems,
                });

                if (!res.success) throw new Error(res.message);
            }

            onSuccess();
            onClose();
        } catch (err: unknown) {
            console.error('Submission Error:', err);
            setError(getErrorMessage(err) || 'Failed to create requisition');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-white/5 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                New Requisition
                            </h2>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                Step {step} of 5 • {step === 5 ? 'Finalize Details' : 'Select Product'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 shrink-0">
                    <div
                        className="h-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${(step / 5) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 scrollbar-none">
                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500">
                            <AlertCircle size={20} />
                            <span className="text-xs font-bold uppercase tracking-wide">{error}</span>
                        </div>
                    )}

                    {/* Step 1: Select Brand */}
                    {step === 1 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {brands.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => handleBrandSelect(b.id)}
                                    className="p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl hover:border-purple-500 hover:bg-purple-500/5 transition-all group flex flex-col items-center gap-4"
                                >
                                    {b.logo_svg ? (
                                        <div
                                            dangerouslySetInnerHTML={{ __html: sanitizeSvg(b.logo_svg) }}
                                            className="w-12 h-12 [&>svg]:w-full [&>svg]:h-full object-contain grayscale group-hover:grayscale-0 transition-all"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-black text-slate-400">
                                            {b.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate w-full text-center">
                                        {b.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 2: Select Model */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 gap-3">
                            {models.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => handleModelSelect(m.id)}
                                    className="p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-purple-500 hover:bg-purple-500/5 transition-all flex items-center justify-between group"
                                >
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                        {m.name}
                                    </span>
                                    <ChevronRight className="text-slate-300 group-hover:text-purple-500" size={18} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 3: Select Variant */}
                    {step === 3 && (
                        <div className="grid grid-cols-1 gap-3">
                            {variants.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => handleVariantSelect(v.id)}
                                    className="p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-purple-500 hover:bg-purple-500/5 transition-all flex flex-col gap-1 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic">
                                            {v.name}
                                        </span>
                                        <ChevronRight
                                            className="text-slate-300 group-hover:text-purple-500"
                                            size={18}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {v.engine_cc ? `${v.engine_cc}cc` : '—'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 4: Select Color */}
                    {step === 4 && (
                        <div className="grid grid-cols-1 gap-3">
                            {colors.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleColorSelect(c.id)}
                                    className="p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-purple-500 hover:bg-purple-500/5 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-6 h-6 rounded-full border border-slate-200 dark:border-white/20"
                                            style={{ backgroundColor: c.hex_primary || '#ccc' }}
                                        />
                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic">
                                            {c.name}
                                        </span>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-purple-500" size={18} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 5: Finalize */}
                    {step === 5 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Summary Card */}
                            <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-[2rem] flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-500">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest">
                                            Target Vehicle
                                        </h4>
                                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase italic">
                                            {brands.find(b => b.id === selectedBrand)?.name}{' '}
                                            {models.find(m => m.id === selectedModel)?.name}
                                        </p>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase">
                                            {variants.find(v => v.id === selectedVariant)?.name} •{' '}
                                            {colors.find(c => c.id === selectedColor)?.name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {loadingPrefill ? (
                                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-5 py-6 flex items-center gap-3">
                                    <Loader2 size={18} className="animate-spin text-indigo-500" />
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                        Loading SKU pricing baseline...
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-3xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-5 py-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">
                                                Required On-Road Components
                                            </p>
                                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                                Total {formatCurrency(requiredTotal)}
                                            </span>
                                        </div>
                                        {requiredCostItems.length === 0 ? (
                                            <p className="text-[10px] font-bold text-rose-500 uppercase">
                                                Pricing baseline not available for this SKU.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {requiredCostItems.map(item => (
                                                    <div
                                                        key={item.cost_type}
                                                        className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900/40 border border-emerald-200/60 dark:border-emerald-500/10 px-3 py-2"
                                                    >
                                                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                                                            {item.cost_type.replace(/_/g, ' ')}
                                                        </p>
                                                        <p className="text-[11px] font-black text-slate-900 dark:text-white">
                                                            {formatCurrency(item.expected_amount)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/30 p-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                Optional Insurance Add-ons
                                            </p>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">
                                                {formatCurrency(selectedInsuranceAmount)}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {[
                                                {
                                                    key: 'zeroDep',
                                                    label: 'Zero Depreciation',
                                                    amount: pricingPrefill?.zeroDep || 0,
                                                },
                                                {
                                                    key: 'rti',
                                                    label: 'Return To Invoice (RTI)',
                                                    amount: pricingPrefill?.rti || 0,
                                                },
                                            ].map(item => {
                                                const checked =
                                                    item.key === 'zeroDep'
                                                        ? selectedInsuranceAddons.zeroDep
                                                        : selectedInsuranceAddons.rti;
                                                const disabled = item.amount <= 0;
                                                return (
                                                    <button
                                                        key={item.key}
                                                        type="button"
                                                        disabled={disabled}
                                                        onClick={() =>
                                                            setSelectedInsuranceAddons(prev =>
                                                                item.key === 'zeroDep'
                                                                    ? { ...prev, zeroDep: !prev.zeroDep }
                                                                    : { ...prev, rti: !prev.rti }
                                                            )
                                                        }
                                                        className={`rounded-xl border px-3 py-3 text-left transition-all ${
                                                            checked
                                                                ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10'
                                                                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40'
                                                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                                                            {item.label}
                                                        </p>
                                                        <p className="text-[11px] font-black text-slate-900 dark:text-white mt-1">
                                                            {item.amount > 0
                                                                ? formatCurrency(item.amount)
                                                                : 'Not available'}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/30 p-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                Optional Accessories
                                            </p>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">
                                                {formatCurrency(selectedAccessoryAmount)}
                                            </span>
                                        </div>
                                        {accessoryOptions.length === 0 ? (
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                No priced accessories found for this model.
                                            </p>
                                        ) : (
                                            <div className="max-h-44 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {accessoryOptions.map(option => {
                                                    const checked = selectedAccessoryIds.includes(option.id);
                                                    return (
                                                        <button
                                                            key={option.id}
                                                            type="button"
                                                            onClick={() => toggleAccessory(option.id)}
                                                            className={`rounded-xl border px-3 py-3 text-left transition-all ${
                                                                checked
                                                                    ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10'
                                                                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40'
                                                            }`}
                                                        >
                                                            <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                                                                {option.name}
                                                            </p>
                                                            <p className="text-[11px] font-black text-slate-900 dark:text-white mt-1">
                                                                {formatCurrency(option.amount)}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 flex items-center justify-between">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Estimated Total Per Unit
                                        </p>
                                        <p className="text-base font-black text-indigo-600 dark:text-indigo-300">
                                            {formatCurrency(estimatedOnRoad)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                        <ArrowRight size={10} className="text-purple-500" /> Quantity
                                    </label>
                                    <div className="flex items-center gap-4 p-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 font-black text-xl hover:bg-slate-50 transition-all active:scale-95"
                                        >
                                            -
                                        </button>
                                        <span className="flex-1 text-center font-black text-xl text-slate-900 dark:text-white">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-xl hover:scale-105 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                        <Users size={12} className="text-indigo-500" /> Customer Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="EX: RAHUL SHARMA..."
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-black focus:outline-none focus:ring-2 focus:ring-purple-500/20 uppercase tracking-widest placeholder:text-slate-400/50"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                        <AlertCircle size={12} className="text-amber-500" /> Internal Notes
                                    </label>
                                    <textarea
                                        placeholder="ANY SPECIFIC DELIVERY TIMELINE OR ACCESSORY REQUIREMENTS..."
                                        rows={3}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl py-4 px-6 text-sm font-black focus:outline-none focus:ring-2 focus:ring-purple-500/20 uppercase tracking-widest placeholder:text-slate-400/50"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-4 shrink-0 mt-auto">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex-1 px-8 py-5 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            Back
                        </button>
                    )}

                    {step === 5 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={loading || loadingPrefill || requiredCostItems.length === 0}
                            className="flex-[2] px-8 py-5 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] hover:scale-105 disabled:opacity-50 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3 italic"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                            {loading
                                ? 'Initiating Demand...'
                                : loadingPrefill
                                  ? 'Loading Baseline...'
                                  : requiredCostItems.length === 0
                                    ? 'Pricing Baseline Required'
                                    : 'Confirm Requisition'}
                        </button>
                    ) : (
                        <button
                            disabled={
                                step === 5 ||
                                (step === 1 && !selectedBrand) ||
                                (step === 2 && !selectedModel) ||
                                (step === 3 && !selectedVariant) ||
                                (step === 4 && !selectedColor)
                            }
                            className="flex-[2] px-8 py-5 rounded-[2rem] bg-slate-100 dark:bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                        >
                            Select Options to Continue
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
