'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Flame, Gauge, Plus, Search, ShieldCheck, Sparkles, Trophy, X } from 'lucide-react';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { ProductVariant } from '@/types/productMaster';
import { formatRating } from '@/utils/formatVehicleSpec';

const MAX_COMPARE = 3;
const DEFAULT_TENURE = 36;
const DEFAULT_DOWNPAYMENT_PCT = 0.2;
const EMI_FACTORS: Record<number, number> = { 12: 0.091, 24: 0.049, 36: 0.035, 48: 0.028, 60: 0.024 };
const STORAGE_KEY = 'bmb_compare_ids';

type CompareBike = {
    id: string;
    name: string;
    tag: string;
    image: string;
    price: string;
    emi: string;
    score: number;
    highlights: string[];
    commercial: Record<string, string>;
    technical: Record<string, string>;
    features: Record<string, string>;
    performance: Record<string, string>;
    resale: Record<string, string>;
    popularity: Record<string, string>;
    isApproxEmi?: boolean;
    metrics?: {
        onRoad?: number;
        emi?: number;
        power?: number;
        torque?: number;
        weight?: number;
        rating?: number;
    };
};

type CompareOption = {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    priceLabel: string;
};

const sections = [
    { id: 'commercial', title: 'Commercials', icon: Sparkles },
    { id: 'technical', title: 'Technical', icon: Gauge },
    { id: 'features', title: 'Features', icon: ShieldCheck },
    { id: 'performance', title: 'Performance', icon: Flame },
    { id: 'resale', title: 'Resale & Ownership', icon: Trophy },
    { id: 'popularity', title: 'Popularity & Trust', icon: CheckCircle2 },
];

const formatCurrency = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '—';
    return `₹${value.toLocaleString('en-IN')}`;
};

const calcApproxEmi = (onRoad: number) => {
    const downpayment = Math.round(onRoad * DEFAULT_DOWNPAYMENT_PCT);
    const loanAmount = Math.max(0, onRoad - downpayment);
    const factor = EMI_FACTORS[DEFAULT_TENURE] ?? EMI_FACTORS[36];
    return Math.max(0, Math.round(loanAmount * factor));
};

const calcEmiRange = (onRoad: number) => {
    const downpaymentLow = Math.round(onRoad * 0.1);
    const downpaymentHigh = Math.round(onRoad * 0.2);
    const loanLow = Math.max(0, onRoad - downpaymentLow);
    const loanHigh = Math.max(0, onRoad - downpaymentHigh);
    const emiLow = Math.round(loanHigh * (EMI_FACTORS[48] ?? EMI_FACTORS[36]));
    const emiHigh = Math.round(loanLow * (EMI_FACTORS[36] ?? EMI_FACTORS[48]));
    return { low: Math.min(emiLow, emiHigh), high: Math.max(emiLow, emiHigh) };
};

const buildCompareFromVariant = (variant: ProductVariant): CompareBike => {
    const onRoad = variant.price?.onRoad || 0;
    const emiValue = calcApproxEmi(onRoad);
    const displacement =
        variant.specifications?.engine?.displacement || (variant.displacement ? `${variant.displacement} cc` : '—');
    const power = variant.specifications?.engine?.maxPower || '—';
    const torque = variant.specifications?.engine?.maxTorque || '—';
    const transmission = variant.specifications?.transmission?.type || '—';
    const gears = variant.specifications?.transmission?.gears || '—';
    const weight =
        variant.specifications?.dimensions?.kerbWeight || variant.specifications?.dimensions?.curbWeight || '—';

    const ratingScore = Number.isFinite(variant.rating) ? Math.round(variant.rating * 20) : 78;
    const parsedPower = numberFromText(variant.specifications?.engine?.maxPower || '') ?? undefined;
    const parsedTorque = numberFromText(variant.specifications?.engine?.maxTorque || '') ?? undefined;
    const parsedWeight =
        numberFromText(variant.specifications?.dimensions?.kerbWeight || '') ??
        numberFromText(variant.specifications?.dimensions?.curbWeight || '') ??
        undefined;

    return {
        id: variant.id,
        name: `${variant.make} ${variant.model}`,
        tag: variant.variant || variant.segment || 'Market pick',
        image: variant.imageUrl || '/images/templates/t3_night.webp',
        price: formatCurrency(onRoad),
        emi: `₹${emiValue.toLocaleString('en-IN')}/mo`,
        score: ratingScore,
        highlights: [
            variant.bodyType?.toLowerCase() || 'Daily ride',
            variant.fuelType === 'EV' ? 'Zero fuel cost' : 'Balanced performance',
            variant.segment || 'Top segment fit',
        ].map(item => item.replace(/(^\w)/, m => m.toUpperCase())),
        commercial: {
            'On-road price': formatCurrency(onRoad),
            'Ex-showroom': formatCurrency(variant.price?.exShowroom || 0),
            'EMI from': `₹${emiValue.toLocaleString('en-IN')}/mo`,
            Savings: formatCurrency(variant.price?.totalSavings || 0),
            Warranty: variant.fuelType === 'EV' ? '3 years (battery)' : '2-5 years',
        },
        technical: {
            Engine: displacement,
            Power: power,
            Torque: torque,
            Transmission: `${transmission}${gears !== '—' ? ` (${gears})` : ''}`,
            Weight: weight,
        },
        features: {
            ABS: variant.specifications?.features?.abs || '—',
            Bluetooth: variant.specifications?.features?.bluetooth ? 'Yes' : 'No',
            'Body type': variant.bodyType,
            'Fuel type': variant.fuelType,
            Segment: variant.segment || '—',
        },
        performance: {
            'Mileage / Range': variant.fuelType === 'EV' ? 'Data coming soon' : 'Data coming soon',
            'Top speed': 'Data coming soon',
            '0-60 km/h': 'Data coming soon',
            'Ride character': variant.segment || 'Balanced',
        },
        resale: {
            'Resale strength': 'Data coming soon',
            'Demand in used market': 'Data coming soon',
            'Depreciation (3 yrs)': 'Data coming soon',
            'Parts availability': 'Data coming soon',
        },
        popularity: {
            'Owner rating': formatRating(Number.isFinite(variant.rating) ? variant.rating : null),
            'Market demand': 'Data coming soon',
            'Service network': 'Data coming soon',
            'Community trust': 'Data coming soon',
        },
        isApproxEmi: true,
        metrics: {
            onRoad,
            emi: emiValue,
            power: parsedPower,
            torque: parsedTorque,
            weight: parsedWeight,
            rating: Number.isFinite(variant.rating) ? variant.rating : undefined,
        },
    };
};

const getSectionData = (bike: CompareBike, sectionId: string) => {
    switch (sectionId) {
        case 'commercial':
            return bike.commercial;
        case 'technical':
            return bike.technical;
        case 'features':
            return bike.features;
        case 'performance':
            return bike.performance;
        case 'resale':
            return bike.resale;
        case 'popularity':
            return bike.popularity;
        default:
            return {};
    }
};

const numberFromText = (value?: string | number) => {
    if (value === null || value === undefined) return null;
    const raw = typeof value === 'number' ? value.toString() : value;
    if (!raw) return null;
    const match = raw.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const num = Number(match[0]);
    return Number.isFinite(num) ? num : null;
};

const lowerIsBetter = new Set([
    'On-road price',
    'Ex-showroom',
    'EMI from',
    'Fuel cost (₹/month)',
    'Service cost (1st yr)',
    'Depreciation (3 yrs)',
    'Weight',
]);

const higherIsBetter = new Set([
    'Power',
    'Torque',
    'Range',
    'Mileage (real world)',
    'Top speed',
    'Owner rating',
    'Overall score',
]);

const presets = [
    {
        id: 'balanced',
        label: 'Balanced',
        weights: { commercial: 0.25, technical: 0.2, features: 0.15, performance: 0.2, resale: 0.1, popularity: 0.1 },
    },
    {
        id: 'value',
        label: 'Best Value',
        weights: { commercial: 0.45, technical: 0.15, features: 0.1, performance: 0.1, resale: 0.1, popularity: 0.1 },
    },
    {
        id: 'performance',
        label: 'Performance',
        weights: {
            commercial: 0.15,
            technical: 0.35,
            features: 0.15,
            performance: 0.25,
            resale: 0.05,
            popularity: 0.05,
        },
    },
    {
        id: 'resale',
        label: 'Resale Focus',
        weights: { commercial: 0.2, technical: 0.15, features: 0.1, performance: 0.1, resale: 0.3, popularity: 0.15 },
    },
    {
        id: 'city',
        label: 'City Commuter',
        weights: { commercial: 0.35, technical: 0.15, features: 0.15, performance: 0.15, resale: 0.1, popularity: 0.1 },
    },
];

const buildOptionsFromVariants = (variants: ProductVariant[]): CompareOption[] =>
    variants.map(item => ({
        id: item.id,
        title: `${item.make} ${item.model}`,
        subtitle: item.variant || item.segment || item.bodyType,
        image: item.imageUrl || '/images/templates/t3_night.webp',
        priceLabel: formatCurrency(item.price?.onRoad || 0),
    }));

export function ComparePageClient() {
    const { items, isLoading } = useSystemCatalogLogic();
    const initializedRef = useRef(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerQuery, setPickerQuery] = useState('');
    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const [activePreset, setActivePreset] = useState(presets[0].id);

    const catalogVariants = items;
    const catalogOptions = buildOptionsFromVariants(catalogVariants);

    useEffect(() => {
        if (initializedRef.current) return;
        if (isLoading) return;
        const params = new URLSearchParams(window.location.search);
        const paramIds = params.get('items')?.split(',').filter(Boolean) || [];
        const availableIds = new Set(catalogOptions.map(opt => opt.id));
        const validParamIds = paramIds.filter(id => availableIds.has(id));

        if (validParamIds.length > 0) {
            setSelectedIds(validParamIds.slice(0, MAX_COMPARE));
        } else {
            const cached = localStorage.getItem(STORAGE_KEY);
            const cachedIds = cached ? cached.split(',').filter(id => availableIds.has(id)) : [];
            if (cachedIds.length > 0) {
                setSelectedIds(cachedIds.slice(0, MAX_COMPARE));
            } else if (catalogOptions.length > 0) {
                setSelectedIds(catalogOptions.slice(0, MAX_COMPARE).map(opt => opt.id));
            } else {
                setSelectedIds([]);
            }
        }
        initializedRef.current = true;
    }, [catalogOptions, isLoading]);

    useEffect(() => {
        if (!initializedRef.current) return;
        if (selectedIds.length > 0) {
            localStorage.setItem(STORAGE_KEY, selectedIds.join(','));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [selectedIds]);

    useEffect(() => {
        if (!initializedRef.current) return;
        const params = new URLSearchParams(window.location.search);
        if (selectedIds.length > 0) {
            params.set('items', selectedIds.join(','));
        } else {
            params.delete('items');
        }
        const nextUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', nextUrl);
    }, [selectedIds]);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            await navigator.share({ title: 'BookMyBike Compare', url });
            return;
        }
        await navigator.clipboard.writeText(url);
        alert('Comparison link copied');
    };

    const compareBikes = useMemo(() => {
        const map = new Map(catalogVariants.map(item => [item.id, item]));
        return selectedIds
            .map(id => {
                const match = map.get(id);
                if (match) return buildCompareFromVariant(match);
                return null;
            })
            .filter(Boolean) as CompareBike[];
    }, [selectedIds, catalogVariants]);

    const availableOptions = catalogOptions;
    const filteredOptions = availableOptions.filter(option =>
        `${option.title} ${option.subtitle}`.toLowerCase().includes(pickerQuery.toLowerCase())
    );

    const handleOpenPicker = (slotIndex: number) => {
        setActiveSlot(slotIndex);
        setPickerQuery('');
        setPickerOpen(true);
    };

    const handlePickOption = (id: string) => {
        setSelectedIds(prev => {
            const next = [...prev];
            if (activeSlot === null) return next;
            next[activeSlot] = id;
            return Array.from(new Set(next)).slice(0, MAX_COMPARE);
        });
        setPickerOpen(false);
        setActiveSlot(null);
    };

    const handleRemoveSlot = (slotIndex: number) => {
        setSelectedIds(prev => prev.filter((_, index) => index !== slotIndex));
    };

    const sectionAttributes = (sectionId: string) => {
        const attributes = new Set<string>();
        compareBikes.forEach(bike => {
            Object.keys(getSectionData(bike, sectionId)).forEach(key => attributes.add(key));
        });
        return Array.from(attributes);
    };

    const slotCards = Array.from({ length: MAX_COMPARE }, (_, index) => compareBikes[index] || null);

    const scoreMap = useMemo(() => {
        const bikes = slotCards.filter(Boolean) as CompareBike[];
        if (bikes.length === 0) return new Map<string, number>();

        const metrics = bikes.map(bike => bike.metrics || {});
        const maxOf = (key: keyof NonNullable<CompareBike['metrics']>) =>
            Math.max(...metrics.map(m => (typeof (m as any)?.[key] === 'number' ? ((m as any)?.[key] as number) : 0)));
        const minOf = (key: keyof NonNullable<CompareBike['metrics']>) =>
            Math.min(...metrics.map(m => (typeof (m as any)?.[key] === 'number' ? ((m as any)?.[key] as number) : 0)));

        const normalize = (value: number | undefined, min: number, max: number, higherBetter: boolean) => {
            if (value === undefined || Number.isNaN(value)) return 0.5;
            if (max === min) return 0.5;
            const ratio = (value - min) / (max - min);
            return higherBetter ? ratio : 1 - ratio;
        };

        const onRoadMin = minOf('onRoad');
        const onRoadMax = maxOf('onRoad');
        const emiMin = minOf('emi');
        const emiMax = maxOf('emi');
        const powerMin = minOf('power');
        const powerMax = maxOf('power');
        const torqueMin = minOf('torque');
        const torqueMax = maxOf('torque');
        const weightMin = minOf('weight');
        const weightMax = maxOf('weight');
        const ratingMin = minOf('rating');
        const ratingMax = maxOf('rating');

        const preset = presets.find(p => p.id === activePreset) || presets[0];
        const weights = preset.weights;

        return new Map(
            bikes.map(bike => {
                const m = bike.metrics || {};
                const commercialScore =
                    (normalize(m.onRoad, onRoadMin, onRoadMax, false) + normalize(m.emi, emiMin, emiMax, false)) / 2;
                const technicalScore =
                    (normalize(m.power, powerMin, powerMax, true) + normalize(m.torque, torqueMin, torqueMax, true)) /
                    2;
                const featuresScore = 0.6;
                const performanceScore = 0.6;
                const resaleScore = 0.6;
                const popularityScore = normalize(m.rating, ratingMin, ratingMax, true);

                const total =
                    commercialScore * weights.commercial +
                    technicalScore * weights.technical +
                    featuresScore * weights.features +
                    performanceScore * weights.performance +
                    resaleScore * weights.resale +
                    popularityScore * weights.popularity;

                return [bike.id, Math.round(total * 100)];
            })
        );
    }, [slotCards, activePreset]);

    const badgeMap = useMemo(() => {
        const bikes = slotCards.filter(Boolean) as CompareBike[];
        if (bikes.length === 0) return new Map<string, string[]>();

        const minOnRoad = Math.min(...bikes.map(b => b.metrics?.onRoad || Infinity));
        const minEmi = Math.min(...bikes.map(b => b.metrics?.emi || Infinity));
        const maxPower = Math.max(...bikes.map(b => b.metrics?.power || 0));
        const maxRating = Math.max(...bikes.map(b => b.metrics?.rating || 0));
        const minWeight = Math.min(...bikes.map(b => b.metrics?.weight || Infinity));

        return new Map(
            bikes.map(bike => {
                const tags: string[] = [];
                if (bike.metrics?.onRoad === minOnRoad) tags.push('Lowest price');
                if (bike.metrics?.emi === minEmi) tags.push('Lowest EMI');
                if (bike.metrics?.power === maxPower) tags.push('Most power');
                if (bike.metrics?.rating === maxRating) tags.push('Best rated');
                if (bike.metrics?.weight === minWeight) tags.push('Lightest');
                return [bike.id, tags.slice(0, 2)];
            })
        );
    }, [slotCards]);
    const getRowWinnerIndex = (sectionId: string, label: string) => {
        const values = slotCards.map(bike => {
            const raw = bike ? getSectionData(bike, sectionId)[label] : undefined;
            return numberFromText(raw);
        });
        const filtered = values.filter(v => v !== null) as number[];
        if (filtered.length <= 1) return null;
        const isLower = lowerIsBetter.has(label);
        const isHigher = higherIsBetter.has(label);
        if (!isLower && !isHigher) return null;
        const target = isLower ? Math.min(...filtered) : Math.max(...filtered);
        return values.findIndex(v => v === target);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#fef3c7,transparent_55%),radial-gradient(circle_at_20%_20%,#c7d2fe,transparent_40%),radial-gradient(circle_at_90%_20%,#fde68a,transparent_45%)] opacity-70" />
                <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-slate-200/60 text-[11px] font-black tracking-[0.2em] uppercase text-slate-600">
                        Compare Studio
                    </div>
                    <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight text-slate-900">
                        Smart bike comparison that helps you decide fast
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm md:text-base text-slate-600 font-medium">
                        Commercials, technical specs, real-world performance, resale strength and popularity all in one
                        screen.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                            className="px-5 py-2 rounded-xl bg-black text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"
                            onClick={() => handleOpenPicker(0)}
                        >
                            Customize Comparison
                            <ArrowRight size={14} />
                        </button>
                        <button
                            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100"
                            onClick={handleShare}
                        >
                            Share
                        </button>
                        <span className="text-xs text-slate-500 font-semibold">
                            Choose any cross-category products (bike, scooter, EV)
                        </span>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Presets</span>
                        {presets.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => setActivePreset(preset.id)}
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                    activePreset === preset.id
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'border-slate-300 text-slate-600'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <div
                className="sticky z-[90] bg-white/90 backdrop-blur border-y border-slate-200/60"
                style={{ top: 'var(--header-h)' }}
            >
                <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {slotCards.map((bike, index) => (
                            <div
                                key={`sticky-${index}`}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold"
                            >
                                <span className="text-slate-500">#{index + 1}</span>
                                <span className="text-slate-900">{bike ? bike.name : 'Add vehicle'}</span>
                                <button
                                    className="ml-2 text-slate-500 hover:text-slate-900"
                                    onClick={() => handleOpenPicker(index)}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:ml-auto text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {sections.map(section => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition"
                            >
                                {section.title}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <section className="max-w-6xl mx-auto px-6 md:px-10">
                <div className="grid md:grid-cols-3 gap-6 -mt-10">
                    {slotCards.map((bike, index) => (
                        <div
                            key={bike?.id || `slot-${index}`}
                            className="bg-white rounded-3xl border border-slate-200/70 shadow-xl shadow-slate-200/40 overflow-hidden"
                        >
                            <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                {bike ? (
                                    <img src={bike.image} alt={bike.name} className="h-32 object-contain" />
                                ) : (
                                    <button
                                        onClick={() => handleOpenPicker(index)}
                                        className="flex flex-col items-center gap-2 text-slate-500"
                                    >
                                        <Plus size={24} />
                                        <span className="text-xs font-semibold">Add vehicle</span>
                                    </button>
                                )}
                            </div>
                            <div className="p-5 space-y-3">
                                {bike ? (
                                    <>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900">{bike.name}</h3>
                                                <p className="text-xs text-slate-500 font-semibold">{bike.tag}</p>
                                            </div>
                                            <button
                                                className="text-slate-400 hover:text-slate-900"
                                                onClick={() => handleRemoveSlot(index)}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-500 uppercase tracking-widest">On-road</span>
                                            <span className="text-slate-900">{bike.price}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-500 uppercase tracking-widest">EMI</span>
                                            <span className="text-emerald-600">{bike.emi}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                                            <span>EMI range</span>
                                            <span>
                                                ₹{calcEmiRange(bike.metrics?.onRoad || 0).low.toLocaleString('en-IN')} -
                                                ₹{calcEmiRange(bike.metrics?.onRoad || 0).high.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="pt-2">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                <span>Overall score</span>
                                                <span>{scoreMap.get(bike.id) ?? bike.score}/100</span>
                                            </div>
                                            <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                                                    style={{ width: `${scoreMap.get(bike.id) ?? bike.score}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {bike.highlights.map(item => (
                                                <span
                                                    key={item}
                                                    className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                            {(badgeMap.get(bike.id) || []).map(item => (
                                                <span
                                                    key={item}
                                                    className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-xs text-slate-500">Choose another product to compare.</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 space-y-8">
                    {sections.map(section => {
                        const Icon = section.icon;
                        const attributes = sectionAttributes(section.id);
                        return (
                            <div
                                key={section.id}
                                id={section.id}
                                className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden"
                            >
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <Icon size={18} className="text-slate-700" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900">{section.title}</h4>
                                        <p className="text-[11px] text-slate-500">
                                            Compare key differentiators side by side
                                        </p>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-[220px_repeat(3,1fr)]">
                                    <div className="hidden md:block border-r border-slate-100 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Attribute
                                    </div>
                                    {slotCards.map((bike, index) => (
                                        <div
                                            key={`${section.id}-head-${index}`}
                                            className="border-b border-slate-100 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                        >
                                            {bike?.name || `Slot ${index + 1}`}
                                        </div>
                                    ))}

                                    {attributes.map(label => (
                                        <React.Fragment key={`${section.id}-${label}`}>
                                            <div className="border-t border-slate-100 px-6 py-4 text-xs font-semibold text-slate-600">
                                                {label}
                                            </div>
                                            {slotCards.map((bike, index) => {
                                                const winnerIndex = getRowWinnerIndex(section.id, label);
                                                const isWinner = winnerIndex === index;
                                                return (
                                                    <div
                                                        key={`${section.id}-${label}-${index}`}
                                                        className={`border-t border-slate-100 px-6 py-4 text-sm font-semibold ${
                                                            isWinner
                                                                ? 'text-emerald-600 bg-emerald-50/60'
                                                                : 'text-slate-900'
                                                        }`}
                                                    >
                                                        {bike ? getSectionData(bike, section.id)[label] : '—'}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl px-6 md:px-10 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black">Ready to narrow it down?</h3>
                        <p className="text-sm text-white/70 mt-2">
                            Shortlist 2 vehicles, compare finances, then generate a quote in one click.
                        </p>
                    </div>
                    <button className="px-5 py-3 rounded-2xl bg-[#F4B000] text-black text-xs font-black uppercase tracking-widest">
                        Build My Final Shortlist
                    </button>
                </div>
            </section>

            {pickerOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
                    <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-black text-slate-900">Select a vehicle</h4>
                                <p className="text-xs text-slate-500">Choose any bike, scooter or EV to compare.</p>
                            </div>
                            <button
                                onClick={() => setPickerOpen(false)}
                                className="text-slate-500 hover:text-slate-900"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200">
                                <Search size={18} className="text-slate-400" />
                                <input
                                    value={pickerQuery}
                                    onChange={event => setPickerQuery(event.target.value)}
                                    placeholder="Search make, model, variant"
                                    className="flex-1 bg-transparent text-sm text-slate-700 focus:outline-none"
                                />
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto space-y-3">
                                {filteredOptions.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => handlePickOption(option.id)}
                                        className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl border border-slate-200 hover:border-slate-400 transition"
                                    >
                                        <img
                                            src={option.image}
                                            alt={option.title}
                                            className="w-16 h-12 object-contain"
                                        />
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-black text-slate-900">{option.title}</p>
                                            <p className="text-xs text-slate-500">{option.subtitle}</p>
                                        </div>
                                        <span className="text-xs font-bold text-emerald-600">{option.priceLabel}</span>
                                    </button>
                                ))}
                                {filteredOptions.length === 0 && (
                                    <div className="text-sm text-slate-500 text-center py-10">
                                        No matching vehicles.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
