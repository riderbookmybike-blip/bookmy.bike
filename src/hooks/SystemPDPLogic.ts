'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface LocalColorConfig {
    id: string;
    skuId?: string;
    name: string;
    hex: string;
    class: string;
    image?: string;
    video?: string;
    assets?: any[];
    dealerOffer?: number;
    pricingOverride?: {
        exShowroom?: number;
        dealerOffer?: number;
        onRoadOverride?: number;
        priceOverride?: number; // Keep for fallback if needed
    };
}

import { InsuranceRule } from '@/types/insurance';
import { Accessory, ServiceOption } from '@/types/store';
import { BankScheme, BankPartner } from '@/types/bankPartner';
// SOT Phase 3: Rule engine removed, pricing from JSON only

export function useSystemPDPLogic({
    initialPrice,
    colors = [],
    insuranceRule,
    registrationRule,
    initialAccessories = [],
    initialServices = [],
    product,
    initialFinance,
    serverPricing,
}: {
    initialPrice: {
        exShowroom: number;
        total?: number;
        rto?: number;
        insurance?: number;
        breakdown?: any;
    };
    colors: LocalColorConfig[];
    insuranceRule?: InsuranceRule;
    registrationRule?: any; // Still using any if type not fully defined, but better than before
    initialAccessories?: Accessory[];
    initialServices?: ServiceOption[];
    product?: any;
    initialFinance?: {
        bank: Partial<BankPartner>;
        scheme: BankScheme;
        logic?: string;
    };
    // SSPP v2: Server-calculated pricing (SOT JSON structure)
    serverPricing?: {
        ex_showroom: number;
        rto: { STATE: number; BH: number | null; COMPANY: number | null; default: string };
        insurance: {
            od: number;
            tp: number;
            gst_rate: number;
            base_total: number;
            addons: { id: string; label: string; price: number; gst: number; total: number; default: boolean }[];
        };
        dealer: { offer: number; name?: string; id?: string; studio_id?: string | null };
        final_on_road: number;
        location?: { district?: string | null; state_code?: string | null };
        // Legacy fallback (deprecated)
        rto_breakdown?: any[];
        insurance_breakdown?: any[];
    } | null;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const colorFromQuery = searchParams.get('color');
    const isValidColor = colorFromQuery && colors.some(c => c.id === colorFromQuery);
    const initialColor = isValidColor ? colorFromQuery : colors[0]?.id || '';

    const [selectedColor, setSelectedColor] = useState(initialColor);
    const [regType, setRegType] = useState<'STATE' | 'BH' | 'COMPANY'>('STATE');
    const [hasManualRegType, setHasManualRegType] = useState(false);
    const fallbackPricing =
        serverPricing ||
        (initialPrice?.breakdown && typeof initialPrice.breakdown === 'object' ? initialPrice.breakdown : null);
    // Base check: is pricing data available at all?
    const pricingDataAvailable = Boolean(
        fallbackPricing?.ex_showroom ||
        fallbackPricing?.final_on_road ||
        initialPrice?.exShowroom ||
        initialPrice?.total
    );

    const activeAccessories = initialAccessories.length > 0 ? initialAccessories : [];
    const activeServices = initialServices.length > 0 ? initialServices : [];

    const defaultSelectedAccessoryIds = activeAccessories
        .filter(a => a.isMandatory || a.inclusionType === 'BUNDLE')
        .map(a => a.id);
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>(defaultSelectedAccessoryIds);
    // SOT Phase 3: Use JSON addons with default flag; fallback to legacy insuranceRule
    const defaultInsuranceAddonIds = (serverPricing?.insurance?.addons || [])
        .filter(
            (a: { id: string; default?: boolean; inclusion_type?: string; inclusionType?: string }) =>
                a.default === true ||
                (a.inclusion_type || a.inclusionType) === 'MANDATORY' ||
                (a.inclusion_type || a.inclusionType) === 'BUNDLE'
        )
        .map((a: { id: string }) => a.id);
    const [selectedInsuranceAddons, setSelectedInsuranceAddons] = useState<string[]>(defaultInsuranceAddonIds);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const [emiTenure, setEmiTenure] = useState(36);
    const [configTab, setConfigTab] = useState<
        | 'PRICE_BREAKUP'
        | 'FINANCE'
        | 'ACCESSORIES'
        | 'INSURANCE'
        | 'REGISTRATION'
        | 'SERVICES'
        | 'OFFERS'
        | 'WARRANTY'
        | 'TECH_SPECS'
    >('PRICE_BREAKUP');
    const [userDownPayment, setUserDownPayment] = useState<number | null>(null);

    // SSPP v1.8: Re-sync selectedAccessories when accessories are hydrated from dealer
    // This ensures mandatory/bundled items are correctly selected when IDs change from catalog to dealer
    useEffect(() => {
        if (initialAccessories.length > 0) {
            const currentValidIds = selectedAccessories.filter(id => initialAccessories.some(a => a.id === id));

            // If we have no valid IDs or all current IDs are from a previous set, reset to mandatory defaults
            if (currentValidIds.length === 0) {
                const defaults = initialAccessories
                    .filter(a => a.isMandatory || a.inclusionType === 'BUNDLE')
                    .map(a => a.id);
                if (defaults.length > 0) {
                    setSelectedAccessories(defaults);
                }
            }
        }
    }, [initialAccessories]);

    useEffect(() => {
        if (hasManualRegType) return;
        // SOT Phase 3: Use rto.default from JSON instead of rto.type
        const nextType = fallbackPricing?.rto?.default;
        if (nextType && nextType !== regType) {
            setRegType(nextType as 'STATE' | 'BH' | 'COMPANY');
        }
    }, [fallbackPricing?.rto?.default, regType, hasManualRegType]);

    const setRegTypeManual = (type: 'STATE' | 'BH' | 'COMPANY') => {
        setHasManualRegType(true);
        setRegType(type);
    };

    // Color Config & Price Override
    const activeColorConfig = colors.find(c => c.id === selectedColor) || colors[0] || ({} as any);

    // SOT Rule §4.3: Reject pricing when selected color cannot map to valid SKU UUID
    const skuUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const selectedSkuId = typeof activeColorConfig?.skuId === 'string' ? activeColorConfig.skuId : '';
    const hasValidColorSku = skuUuidRegex.test(selectedSkuId);
    const pricingReady = pricingDataAvailable && hasValidColorSku;
    const colorLevelExShowroom =
        activeColorConfig?.pricingOverride?.exShowroom ??
        activeColorConfig?.pricingOverride?.priceOverride ??
        activeColorConfig?.pricingOverride; // Handle case where pricingOverride is just the number (backward compat)

    const baseExShowroom = pricingReady
        ? (fallbackPricing?.ex_showroom ?? colorLevelExShowroom ?? initialPrice?.exShowroom ?? product?.basePrice ?? 0)
        : 0;
    const pricingLocationLabel =
        pricingReady &&
        fallbackPricing?.location?.district &&
        String(fallbackPricing.location.district).toUpperCase() !== 'ALL'
            ? fallbackPricing.location.district
            : undefined;

    const pricingSourceLabel = pricingLocationLabel
        ? fallbackPricing?.dealer?.studio_id
            ? `${pricingLocationLabel} • ${fallbackPricing.dealer.studio_id}`
            : pricingLocationLabel
        : fallbackPricing?.dealer?.studio_id || undefined;

    // SOT Phase 3: Read RTO directly from JSON, no client-side rule engine
    // rto JSON: { STATE: number, BH: number | null, COMPANY: number | null, default: 'STATE' }
    // Note: JSON values may come as strings from Supabase, so use Number() coercion
    // SOT Phase 3: Read RTO directly from JSON, no client-side rule engine
    // rto JSON: { STATE: { total: number, roadTax... }, BH: { ... }, ... }
    const rtoJson = fallbackPricing?.rto;

    const parseRtoData = (val: any): { total: number; breakdown: any[] } | null => {
        if (val === null || val === undefined) return null;

        // Handle legacy number format
        if (typeof val === 'number') return { total: val, breakdown: [] };

        // Handle new object format
        if (typeof val === 'object' && 'total' in val) {
            const hasDetails = val.roadTax || val.registrationCharges || val.smartCardCharges;
            const b = hasDetails
                ? [
                      { label: 'Road Tax', amount: val.roadTax },
                      { label: 'Reg. Charges', amount: val.registrationCharges },
                      { label: 'Smart Card', amount: val.smartCardCharges },
                      { label: 'Hypothecation', amount: val.hypothecationCharges },
                      { label: 'Postal Charges', amount: val.postalCharges },
                      { label: 'Cess', amount: val.cessAmount },
                  ].filter(x => x.amount > 0)
                : [{ label: 'Registration (Estimated)', amount: val.total }];
            return { total: val.total, breakdown: b };
        }
        return null;
    };

    const rtoByType = {
        STATE: parseRtoData(rtoJson?.STATE),
        BH: parseRtoData(rtoJson?.BH),
        COMPANY: parseRtoData(rtoJson?.COMPANY),
    };

    // SSPP v2: Server pricing only (SOT JSON!)
    const rtoBreakdown = pricingReady ? fallbackPricing?.rto_breakdown || [] : [];

    // Build rtoOptions from JSON values
    const availableRtoOptions = [];

    // 1. State Registration
    const stateData = rtoByType.STATE;
    availableRtoOptions.push({
        id: 'STATE',
        name: 'State Registration',
        price: stateData?.total ?? 0,
        description: 'Standard RTO charges for your state.',
        breakdown: stateData?.breakdown || [],
    });

    // 2. BH Registration
    const bhData = rtoByType.BH;
    availableRtoOptions.push({
        id: 'BH',
        name: 'Bharat Series (BH)',
        price: bhData?.total ?? 0, // Should be populated by server now
        description: 'For frequent interstate travel.',
        breakdown: bhData?.breakdown || [],
    });

    // 3. Company Registration
    const companyData = rtoByType.COMPANY;
    availableRtoOptions.push({
        id: 'COMPANY',
        name: 'Company Registration',
        price: companyData?.total ?? 0, // Should be populated by server now
        description: 'Corporate entity registration.',
        breakdown: companyData?.breakdown || [],
    });

    const rtoOptions = pricingReady ? availableRtoOptions : undefined;

    // RE-CALCULATE selectedRtoValue using the defined prices
    const effectiveRtoValues: Record<string, number> = {
        STATE: rtoByType.STATE?.total ?? 0,
        BH: rtoByType.BH?.total ?? 0,
        COMPANY: rtoByType.COMPANY?.total ?? 0,
    };

    // Get RTO for selected type (fallback to STATE if type unavailable)
    const selectedRtoValue = effectiveRtoValues[regType] || effectiveRtoValues.STATE || 0;

    // SSPP v2: Server pricing only (SOT JSON!)
    // Re-assigning rtoEstimates to use the corrected selectedRtoValue
    const rtoEstimates = pricingReady ? selectedRtoValue : 0;

    // SOT Phase 3: Insurance from JSON - no client-side rule engine
    const insuranceJson = fallbackPricing?.insurance;
    const insuranceGstRate = Number(insuranceJson?.gst_rate ?? insuranceRule?.gstPercentage ?? 18);

    // SOT Phase 4: OD/TP are now objects with {base, gst, total}
    const odData = insuranceJson?.od;
    const tpData = insuranceJson?.tp;

    // Handle both old (number) and new (object) formats
    const odWithGst = pricingReady
        ? typeof odData === 'object'
            ? Number(odData?.total || 0)
            : Number(odData || 0)
        : 0;
    const tpWithGst = pricingReady
        ? typeof tpData === 'object'
            ? Number(tpData?.total || 0)
            : Number(tpData || 0)
        : 0;

    // SOT: base_total = od + tp + GST (excludes addons)
    const baseInsurance = pricingReady ? Number(insuranceJson?.base_total || 0) : 0;

    const insuranceBreakdown = pricingReady
        ? fallbackPricing?.insurance_breakdown || [
              { label: 'Liability Only', amount: tpWithGst, detail: '5Y Cover' },
              { label: 'Comprehensive', amount: odWithGst, detail: '1Y Cover' },
          ]
        : [];
    const otherCharges = 0;

    // SOT Phase 3: Build addons from JSON + Fallback Merge
    const normalizeAddonKey = (val: any) =>
        String(val || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    const jsonAddons = (insuranceJson?.addons || []) as {
        id: string;
        label: string;
        price: number;
        gst: number;
        total: number;
        default: boolean;
    }[];

    // Map Rule addons to UI format (Fallback source)
    const ruleAddons =
        insuranceRule?.addons?.map(a => {
            const inclusionType = (a as any).inclusion_type || (a as any).inclusionType || 'OPTIONAL';
            const baseAmount =
                a.type === 'FIXED'
                    ? a.amount || 0
                    : Math.round(((a.percentage || 0) * (a.basis === 'EX_SHOWROOM' ? baseExShowroom : 100000)) / 100);
            const priceWithGst = Math.round(baseAmount + (baseAmount * insuranceGstRate) / 100);
            const gstAmount = Math.max(0, priceWithGst - baseAmount);

            return {
                id: a.id,
                name: a.label,
                price: priceWithGst,
                description: a.type === 'PERCENTAGE' ? `${a.percentage}% of ${a.basis}` : 'Fixed Coverage',
                discountPrice: 0,
                isMandatory: inclusionType === 'MANDATORY',
                inclusionType: inclusionType,
                breakdown: [
                    { label: 'Base Premium', amount: baseAmount },
                    { label: `GST (${insuranceGstRate}%)`, amount: gstAmount },
                ],
            };
        }) || [];

    const ruleAddonIndex = new Map<string, any>();
    ruleAddons.forEach(a => {
        ruleAddonIndex.set(normalizeAddonKey(a.id), a);
        ruleAddonIndex.set(normalizeAddonKey(a.name), a);
    });

    // Map JSON addons to UI format (with rule fallback when totals are missing/zero)
    const mappedJsonAddons = jsonAddons.map(addon => {
        const addonTotal = Number(addon.total ?? (addon.price || 0) + (addon.gst || 0));
        const ruleMatch =
            ruleAddonIndex.get(normalizeAddonKey(addon.id)) || ruleAddonIndex.get(normalizeAddonKey(addon.label));
        const resolvedPrice = addonTotal > 0 ? addonTotal : Number(ruleMatch?.price || addonTotal || 0);
        const resolvedBreakdown =
            addonTotal > 0
                ? [
                      { label: 'Base Premium', amount: addon.price },
                      { label: `GST (${insuranceGstRate}%)`, amount: addon.gst },
                  ]
                : ruleMatch?.breakdown || [
                      { label: 'Base Premium', amount: addon.price },
                      { label: `GST (${insuranceGstRate}%)`, amount: addon.gst },
                  ];
        const resolvedInclusionType = addon.default ? 'BUNDLE' : ruleMatch?.inclusionType || 'OPTIONAL';

        return {
            id: addon.id,
            name: addon.label,
            price: resolvedPrice,
            description: 'Coverage',
            discountPrice: 0,
            isMandatory: addon.default === true || ruleMatch?.isMandatory,
            inclusionType: resolvedInclusionType,
            breakdown: resolvedBreakdown,
        };
    });

    // Merge: Prefer JSON addons, append missing ones from Rules
    // This allows SOT to override prices but falls back to rule engine for missing options
    const jsonAddonIds = new Set(mappedJsonAddons.map(a => a.id));
    const missingRuleAddons = ruleAddons.filter(a => !jsonAddonIds.has(a.id));

    const availableInsuranceAddons = [...mappedJsonAddons, ...missingRuleAddons];

    const insuranceRequiredItems = [
        {
            id: 'insurance-tp',
            name: 'Liability Only (5 Years Cover)',
            price: tpWithGst,
            description: 'Mandatory',
            isMandatory: true,
            breakdown: [
                { label: 'Base Premium', amount: Math.max(0, tpWithGst) },
                { label: `GST (${insuranceGstRate}%)`, amount: 0 },
            ],
        },
        {
            id: 'insurance-od',
            name: 'Comprehensive (1 Year Cover)',
            price: odWithGst,
            description: 'Mandatory',
            isMandatory: true,
            breakdown: [
                { label: 'Base Premium', amount: Math.max(0, odWithGst) },
                { label: `GST (${insuranceGstRate}%)`, amount: 0 },
            ],
        },
    ];

    const insuranceAddonsPrice = availableInsuranceAddons
        .filter(a => selectedInsuranceAddons.includes(a.id))
        .reduce((sum, a) => sum + (a.discountPrice || a.price || 0), 0);

    const resolveAccessoryPricing = (acc: Accessory) => {
        const base = Number(acc.price || 0);
        const override = acc.discountPrice;
        const effective =
            override === undefined || override === null || Number.isNaN(Number(override)) ? base : Number(override);
        return { base, effective };
    };

    const accessoriesPrice = activeAccessories
        .filter(acc => selectedAccessories.includes(acc.id))
        .reduce((sum, acc) => {
            const qty = Number(quantities[acc.id] || 1);

            // BUNDLE Logic: If bundled, it is free (0 price)
            if (acc.inclusionType === 'BUNDLE') {
                return sum;
            }

            const { effective } = resolveAccessoryPricing(acc);
            return sum + effective * qty;
        }, 0);

    const accessoriesDiscount = activeAccessories
        .filter(acc => selectedAccessories.includes(acc.id))
        .reduce((sum, acc) => {
            const qty = quantities[acc.id] || 1;

            // BUNDLE Logic: If bundled, discount is 100% of price
            if (acc.inclusionType === 'BUNDLE') {
                return sum + (acc.price || 0) * qty;
            }

            const { base, effective } = resolveAccessoryPricing(acc);
            const discount = Math.max(0, base - effective);
            return sum + discount * qty;
        }, 0);

    const accessoriesSurge = activeAccessories
        .filter(acc => selectedAccessories.includes(acc.id))
        .reduce((sum, acc) => {
            const qty = quantities[acc.id] || 1;

            if (acc.inclusionType === 'BUNDLE') {
                return sum;
            }

            const { base, effective } = resolveAccessoryPricing(acc);
            const surge = Math.max(0, effective - base);
            return sum + surge * qty;
        }, 0);

    const servicesPrice = activeServices
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => {
            const qty = Number(quantities[s.id] || 1);
            const base = Number(s.price || 0);
            const disc = Number(s.discountPrice ?? base);
            const price = disc > 0 && disc < base ? disc : base;
            return sum + price * qty;
        }, 0);

    const servicesDiscount = activeServices
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => {
            const qty = Number(quantities[s.id] || 1);
            const base = Number(s.price || 0);
            const disc = Number(s.discountPrice ?? base);
            const discount = Math.max(0, base - disc);
            return sum + discount * qty;
        }, 0);

    const servicesSurge = activeServices
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => {
            const qty = Number(quantities[s.id] || 1);
            const base = Number(s.price || 0);
            const disc = Number(s.discountPrice ?? base);
            const surge = Math.max(0, disc - base);
            return sum + surge * qty;
        }, 0);

    const insuranceAddonsDiscount = availableInsuranceAddons
        .filter(a => selectedInsuranceAddons.includes(a.id))
        .reduce((sum, a) => {
            const base = a.price || 0;
            const effective = (a.discountPrice || 0) > 0 ? a.discountPrice || 0 : base;
            const discount = Math.max(0, base - effective);
            return sum + discount;
        }, 0);

    const insuranceAddonsSurge = availableInsuranceAddons
        .filter(a => selectedInsuranceAddons.includes(a.id))
        .reduce((sum, a) => {
            const base = a.price || 0;
            const effective = (a.discountPrice || 0) > 0 ? a.discountPrice || 0 : base;
            const surge = Math.max(0, effective - base);
            return sum + surge;
        }, 0);

    const colorDelta = pricingReady
        ? Number(
              fallbackPricing?.dealer?.offer ||
                  activeColorConfig?.dealerOffer ||
                  activeColorConfig?.pricingOverride?.dealerOffer ||
                  0
          )
        : 0;
    const colorDiscount = colorDelta < 0 ? Math.abs(colorDelta) : 0;
    const colorSurge = colorDelta > 0 ? colorDelta : 0;

    // Offers Tab Logic (Distinct from Services/AMC)
    const activeOffers = (selectedOffers || [])
        .map(id => initialServices?.find((s: any) => s.id === id))
        .filter(Boolean) as any[];

    const offersDelta = activeOffers.reduce((sum, o) => {
        const base = Number(o?.price || 0);
        const effective = o?.discountPrice !== undefined && o?.discountPrice !== null ? Number(o.discountPrice) : base;
        const delta = effective - base; // negative = discount, positive = surge
        return sum + delta;
    }, 0);
    const offersItems = activeOffers.map(o => ({
        id: o.id,
        name: o.name,
        price: Number(o.price || 0),
        discountPrice: o.discountPrice !== undefined && o.discountPrice !== null ? Number(o.discountPrice) : undefined,
    }));
    const offersDiscount = offersDelta;
    const offersDiscountAmount = offersDelta < 0 ? Math.abs(offersDelta) : 0;
    const offersSurge = offersDelta > 0 ? offersDelta : 0;

    const baseOnRoad = pricingReady ? Number(baseExShowroom + baseInsurance + rtoEstimates) : 0;

    // Final Calculation: Correcting delta logic
    // accessoriesPrice, servicesPrice, insuranceAddonsPrice are already NET (paid by user)
    // otherCharges is assumed paid.
    // colorDelta is a signed difference (negative for discount, positive for surge)
    // offersDelta is a signed difference (negative for discount)
    const totalOnRoadRaw =
        baseOnRoad + insuranceAddonsPrice + accessoriesPrice + servicesPrice + otherCharges + colorDelta + offersDelta;

    const totalOnRoad = pricingReady ? totalOnRoadRaw : 0;
    const totalSavings = pricingReady
        ? colorDiscount + offersDiscountAmount + accessoriesDiscount + servicesDiscount + insuranceAddonsDiscount
        : 0;
    const totalSurge = pricingReady
        ? colorSurge + offersSurge + accessoriesSurge + servicesSurge + insuranceAddonsSurge
        : 0;

    // Dynamic Finance Logic
    const financeScheme = initialFinance?.scheme;
    const financeBank = initialFinance?.bank;
    useEffect(() => {
        if (typeof window === 'undefined' || !financeScheme) return;
        try {
            const payload = {
                scheme: {
                    id: financeScheme.id,
                    name: financeScheme.name,
                    interestRate: financeScheme.interestRate,
                    interestType: financeScheme.interestType,
                    maxLTV: financeScheme.maxLTV,
                    maxLoanAmount: financeScheme.maxLoanAmount,
                    charges: financeScheme.charges || [],
                },
                bankName: financeBank?.name || null,
                cachedAt: Date.now(),
                expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            };
            localStorage.setItem('bmb_finance_scheme_cache', JSON.stringify(payload));
        } catch {}
    }, [financeScheme]);

    // ── Step 1: Compute upfront charges FIRST (needed for DP constraints) ──
    // Upfront charges are paid from the customer's pocket to the financier,
    // NOT to the dealer. The loan amount must compensate for this gap.
    const allCharges = financeScheme?.charges || [];

    // Pre-compute total upfront charges (using totalOnRoad as basis for any %-based ones)
    let totalUpfrontCharges = 0;
    allCharges.forEach(charge => {
        if (charge.impact !== 'UPFRONT') return;
        if (charge.calculationBasis === 'FIXED') {
            totalUpfrontCharges += charge.value;
        } else if (charge.type === 'PERCENTAGE') {
            // For upfront %-based charges, use totalOnRoad as the basis
            // (loanAmount isn't known yet; LOAN_AMOUNT basis is rare for upfront)
            totalUpfrontCharges += Math.round(totalOnRoad * (charge.value / 100));
        } else {
            totalUpfrontCharges += charge.value;
        }
    });

    // ── Step 2: Max loan + Down Payment constraints (upfront-aware) ──
    const ltvMaxLoan = (totalOnRoad * (financeScheme?.maxLTV ?? 100)) / 100;
    const capMaxLoan = financeScheme?.maxLoanAmount || 300000;
    const maxAllowedLoan = Math.min(ltvMaxLoan, capMaxLoan);

    // Min DP ensures: loanAmount = totalOnRoad - DP + upfront <= maxAllowedLoan
    // => DP >= totalOnRoad + upfront - maxAllowedLoan
    const minDownPayment = Math.max(0, Math.round(totalOnRoad + totalUpfrontCharges - maxAllowedLoan));
    const maxDownPayment = Math.round(totalOnRoad * 0.95);
    const defaultDownPayment = minDownPayment; // Default to minimum (covers upfront)

    const downPayment =
        userDownPayment !== null
            ? Math.min(Math.max(userDownPayment, minDownPayment), maxDownPayment)
            : defaultDownPayment;

    // ── Step 3: Loan Amount (upfront-compensated) ──
    // Dealer receives: loanAmount (from bank) + (DP - upfront) (from customer) = totalOnRoad
    const loanAmount = Math.min(maxAllowedLoan, totalOnRoad - downPayment + totalUpfrontCharges);
    const annualInterest = financeScheme ? financeScheme.interestRate / 100 : 0.095;
    const monthlyRate = annualInterest / 12;

    // EMI Calculation (handle FLAT vs REDUCING)
    let emi = 0;
    if (loanAmount > 0) {
        if (financeScheme?.interestType === 'FLAT') {
            const totalInterest = loanAmount * (financeScheme.interestRate / 100) * (emiTenure / 12);
            emi = Math.round((loanAmount + totalInterest) / emiTenure);
        } else {
            emi = Math.round(
                (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, emiTenure)) /
                    (Math.pow(1 + monthlyRate, emiTenure) - 1)
            );
        }
    }

    // ── Step 4: Full charge breakdown for display ──
    let totalChargeAmount = 0;
    const financeChargeItems: {
        id: string;
        label: string;
        value: number;
        isDeduction: boolean;
        helpText?: string;
        impact?: 'UPFRONT' | 'FUNDED' | 'MONTHLY';
        type?: string;
        calculationBasis?: string;
        taxStatus?: string;
        taxRate?: number;
        rawValue?: number;
        basisAmount?: number;
    }[] = [];

    allCharges.forEach((charge, idx) => {
        let amount = 0;
        let basisAmount = totalOnRoad;
        if (charge.calculationBasis === 'LOAN_AMOUNT') {
            basisAmount = loanAmount;
        } else if (charge.calculationBasis === 'GROSS_LOAN_AMOUNT') {
            basisAmount = loanAmount;
        }

        if (charge.calculationBasis === 'FIXED') {
            amount = charge.value;
        } else if (charge.type === 'PERCENTAGE') {
            amount = Math.round(basisAmount * (charge.value / 100));
        } else {
            amount = charge.value;
        }

        totalChargeAmount += amount;

        const taxInfo =
            charge.taxStatus === 'INCLUSIVE'
                ? ` (incl. ${charge.taxRate}% GST)`
                : charge.taxStatus === 'EXCLUSIVE'
                  ? ` + ${charge.taxRate}% GST`
                  : '';

        financeChargeItems.push({
            id: charge.id || `charge_${idx}`,
            label: charge.name || 'Charge',
            value: Math.round(amount),
            isDeduction: false,
            helpText: taxInfo || undefined,
            impact: charge.impact || 'UPFRONT',
            type: charge.type,
            calculationBasis: charge.calculationBasis,
            taxStatus: charge.taxStatus,
            taxRate: charge.taxRate,
            rawValue: charge.value,
            basisAmount,
        });
    });

    const financeCharges = financeChargeItems;

    const [isReferralActive, setIsReferralActive] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsReferralActive(localStorage.getItem('referral_activated') === 'true');
        }
    }, []);

    const handleColorChange = (newColorId: string) => {
        if (!newColorId || !colors.some(c => c.id === newColorId)) return;
        setSelectedColor(newColorId);
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('color', newColorId);
        router.replace(`?${newParams.toString()}`, { scroll: false });
    };

    return {
        data: {
            colors,
            selectedColor,
            selectedSkuId,
            hasValidColorSku,
            isUnavailable: !hasValidColorSku,
            baseExShowroom,
            rtoEstimates,
            rtoBreakdown,
            baseInsurance,
            insuranceBreakdown,
            insuranceAddonsPrice,
            insuranceOD: odWithGst,
            insuranceTP: tpWithGst,
            insuranceGstRate,
            otherCharges,
            accessoriesPrice,
            servicesPrice,
            offersDiscount,
            offersItems,
            colorDiscount,
            colorSurge,
            accessoriesDiscount,
            accessoriesSurge,
            servicesDiscount,
            servicesSurge,
            insuranceAddonsDiscount,
            insuranceAddonsSurge,
            totalSavings,
            totalSurge,
            totalOnRoad,
            downPayment,
            minDownPayment,
            maxDownPayment,
            emi,
            annualInterest,
            interestType: financeScheme?.interestType,
            loanAmount,
            financeCharges, // Newly exposed
            activeAccessories,
            activeServices,
            availableInsuranceAddons,
            insuranceRequiredItems,
            warrantyItems: product?.specs?.warranty || [],
            regType,
            rtoOptions,
            stateCode: registrationRule?.state_code || null,
            emiTenure,
            configTab,
            selectedAccessories,
            selectedInsuranceAddons,
            selectedServices,
            selectedOffers,
            quantities,
            userDownPayment,
            isReferralActive,
            initialFinance,
            pricingSource: pricingSourceLabel,
        },
        actions: {
            setSelectedColor: handleColorChange,
            setRegType: setRegTypeManual,
            setSelectedAccessories,
            setSelectedInsuranceAddons,
            setEmiTenure,
            setConfigTab,
            setSelectedServices,
            setSelectedOffers,
            setQuantities,
            setUserDownPayment,
            setIsReferralActive,
        },
    };
}
