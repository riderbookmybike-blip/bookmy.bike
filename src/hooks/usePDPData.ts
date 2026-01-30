'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { slugify } from '@/utils/slugs';

export interface LocalColorConfig {
    id: string;
    skuId?: string;
    name: string;
    hex: string;
    class: string;
    image?: string;
    video?: string;
    dealerOffer?: number;
    pricingOverride?: {
        exShowroom?: number;
        dealerOffer?: number;
        onRoadOverride?: number;
    };
}

// Global type augmentation for debugging
declare global {
    interface Window {
        __BMB_DEBUG__?: {
            pricingSource?: string;
            district?: string;
            schemeId?: string;
            schemeName?: string;
            bankName?: string;
            financeLogic?: string;
            leadId?: string;
            dealerId?: string;
            tenantId?: string;
            pageId?: string;
            userId?: string;
        };
    }
}

import { InsuranceRule } from '@/types/insurance';
import { Accessory, ServiceOption } from '@/types/store';
import { BankScheme, BankPartner } from '@/types/bankPartner';

import { calculateRTO } from '@/lib/utils/pricingUtility';
import { MOCK_REGISTRATION_RULES } from '@/lib/mock/catalogMocks';

import { useMemo } from 'react';
import { calculateOnRoad } from '@/lib/utils/pricingUtility';

export function usePDPData({
    initialPrice,
    colors = [],
    insuranceRule,
    registrationRule,
    initialAccessories = [],
    initialServices = [],
    product,
    initialFinance
}: {
    initialPrice: any;
    colors: any[];
    insuranceRule?: InsuranceRule;
    registrationRule?: any;
    initialAccessories?: Accessory[];
    initialServices?: ServiceOption[];
    product?: any;
    initialFinance?: {
        bank: Partial<BankPartner>;
        scheme: BankScheme;
        logic?: string;
    };
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const colorFromQuery = searchParams.get('color');
    const isValidColor = colorFromQuery && colors.some(c => c.id === colorFromQuery);
    const initialColor = isValidColor ? colorFromQuery : (colors[0]?.id || 'default');

    const [selectedColor, setSelectedColor] = useState(initialColor);
    const [regType, setRegType] = useState<'STATE' | 'BH' | 'COMPANY'>('STATE');

    const activeAccessories = initialAccessories.length > 0 ? initialAccessories : [];
    const activeServices = initialServices.length > 0 ? initialServices : [];

    const defaultSelectedAccessoryIds = activeAccessories.filter(a => a.isMandatory || a.inclusionType === 'BUNDLE').map(a => a.id);
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>(defaultSelectedAccessoryIds);
    const defaultInsuranceAddonIds = (insuranceRule?.addons || [])
        .filter((a: any) => (a?.inclusion_type || a?.inclusionType) === 'MANDATORY' || (a?.inclusion_type || a?.inclusionType) === 'BUNDLE')
        .map((a: any) => a.id);
    const [selectedInsuranceAddons, setSelectedInsuranceAddons] = useState<string[]>(defaultInsuranceAddonIds);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const [emiTenure, setEmiTenure] = useState(36);
    const [configTab, setConfigTab] = useState<'PRICE_BREAKUP' | 'FINANCE' | 'ACCESSORIES' | 'INSURANCE' | 'REGISTRATION' | 'SERVICES' | 'OFFERS' | 'WARRANTY' | 'TECH_SPECS'>('PRICE_BREAKUP');
    const [userDownPayment, setUserDownPayment] = useState<number | null>(null);

    // Runtime Debug Persistence
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__BMB_DEBUG__ = {
                ...window.__BMB_DEBUG__,
                pricingSource: registrationRule?.state_code ? 'MARKET_RULES' : 'FALLBACK',
                district: registrationRule?.state_code || 'GLOBAL',
                schemeId: initialFinance?.scheme?.id || 'NONE',
                schemeName: initialFinance?.scheme?.name || undefined,
                bankName: initialFinance?.bank?.name || undefined,
                financeLogic: initialFinance?.logic || (initialFinance ? 'RESOLVED_DEFAULT' : 'NOT_RESOLVED'),
                leadId: searchParams.get('leadId') || undefined,
                dealerId: searchParams.get('dealerId') || undefined,
                tenantId: product?.dealership_id || product?.make || 'NOT_SET',
                pageId: `${product?.make}/${product?.model}/${product?.variant}`,
                userId: typeof window !== 'undefined' ? localStorage.getItem('userId') || 'GUEST' : 'GUEST'
            };
        }
    }, [registrationRule, initialFinance, searchParams]);

    // Color Config & Price Override
    const activeColorConfig = colors.find(c => c.id === selectedColor) || colors[0] || {} as any;
    const baseExShowroom = activeColorConfig.priceOverride || activeColorConfig.pricingOverride?.exShowroom || initialPrice.exShowroom;

    // Real-time Calculation Engine Integration
    const pricingData = useMemo(() => {
        // Find engine CC for calculation (from specs)
        const engineCcStr = product?.specs?.engine?.displacement || product?.specs?.performance?.displacement || "110";
        const engineCc = parseInt(engineCcStr);

        return calculateOnRoad(
            baseExShowroom,
            engineCc,
            registrationRule,
            insuranceRule
        );
    }, [baseExShowroom, registrationRule, insuranceRule, product]);

    const rtoEstimates = regType === 'BH' ? pricingData.rtoBharat.total : pricingData.rtoState.total;
    const rtoBreakdown = regType === 'BH' ? pricingData.rtoBharat.items : pricingData.rtoState.items;
    const insuranceComp = pricingData.insuranceComp || {} as any;
    const insuranceGstRate = Number(
        insuranceComp.gstRate
        ?? insuranceRule?.gstPercentage
        ?? 18
    );
    const applyInsuranceGst = (amount: number) => Math.round(amount + (amount * insuranceGstRate / 100));

    const odBase = Number(insuranceComp.odTotal || 0);
    const tpBase = Number(insuranceComp.tpTotal || 0);
    const odWithGst = Number(insuranceComp.odTotalWithGst || applyInsuranceGst(odBase));
    const tpWithGst = Number(insuranceComp.tpTotalWithGst || applyInsuranceGst(tpBase));

    const baseInsurance = Number(insuranceComp.baseTotal || applyInsuranceGst(odBase + tpBase));
    const insuranceBreakdown = [
        { label: 'Liability Only', amount: tpWithGst, detail: `${insuranceComp.tpTenure || 5}Y Cover` },
        { label: 'Comprehensive', amount: odWithGst, detail: `${insuranceComp.odTenure || 1}Y Cover` }
    ];
    const otherCharges = 0; // Defaulting to 0 since it's not in the engine yet

    const addonAmountMap = new Map<string, number>(
        (insuranceComp.addonItems || [])
            .map((i: any) => [i.componentId || i.label, Number(i.amount || 0)])
    );

    // Mapping Insurance Rule Addons to UI Format (GST inclusive)
    const availableInsuranceAddons = insuranceRule?.addons?.map(a => {
        const inclusionType = (a as any).inclusion_type || (a as any).inclusionType || 'OPTIONAL';
        const baseAmount = addonAmountMap.get(a.id) ?? addonAmountMap.get(a.label) ?? (
            a.type === 'FIXED'
                ? (a.amount || 0)
                : Math.round((a.percentage || 0) * (a.basis === 'EX_SHOWROOM' ? baseExShowroom : 100000) / 100)
        );
        const priceWithGst = applyInsuranceGst(baseAmount);
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
                { label: `GST (${insuranceGstRate}%)`, amount: gstAmount }
            ]
        };
    }) || [];

    const insuranceRequiredItems = [
        {
            id: 'insurance-tp',
            name: `Liability Only (${insuranceComp.tpTenure || 5} Years Cover)`,
            price: tpWithGst,
            description: 'Mandatory',
            isMandatory: true,
            breakdown: [
                { label: 'Base Premium', amount: tpBase },
                { label: `GST (${insuranceGstRate}%)`, amount: Math.max(0, tpWithGst - tpBase) }
            ]
        },
        {
            id: 'insurance-od',
            name: `Comprehensive (${insuranceComp.odTenure || 1} Year${(insuranceComp.odTenure || 1) > 1 ? 's' : ''} Cover)`,
            price: odWithGst,
            description: 'Mandatory',
            isMandatory: true,
            breakdown: [
                { label: 'Base Premium', amount: odBase },
                { label: `GST (${insuranceGstRate}%)`, amount: Math.max(0, odWithGst - odBase) }
            ]
        }
    ];

    const insuranceAddonsPrice = availableInsuranceAddons
        .filter(a => selectedInsuranceAddons.includes(a.id))
        .reduce((sum, a) => sum + (a.discountPrice || a.price || 0), 0);

    const accessoriesPrice = activeAccessories
        .filter(acc => selectedAccessories.includes(acc.id))
        .reduce((sum, acc) => {
            // Priority 1: Zero price if BUNDLE logic applies (assuming the backend sends isFree or inclusionType)
            // The previous check "inclusionType === 'BUNDLE'" returns sum (adding 0).
            // However, we need to ensure that if it has a price but is 'free' due to bundle, it enters as 0.

            // If the item is marked as bundled, it's free.

            const qty = quantities[acc.id] || 1;
            // Priority 2: Discount Price (Effective Price)
            // If discountPrice is present (and >= 0), use it. otherwise use price.
            // Note: Some legacy data might have discountPrice: 0 meaning NO discount. 
            // We should check if discountPrice is arguably set. 
            // Better logic: `isActiveOffer ? discountPrice : price` but here we assume pre-calculated.

            // FIX: The user saw "-₹0" and "Line Total ₹2500" for an item that should be free?
            // If "Activa Silver" (bundled) was shown, it probably had inclusionType='BUNDLE'.
            // In that case, this reducer adds 0. So the TOTAL on road is correct (it didn't add 2500).
            // BUT the UI "Line Total" in MasterPDP might be calculating it differently?
            // MasterPDP says: `Math.max(billedAmount, finalPrice)` where billedAmount = finalPrice * qty.

            // Let's ensure consistency.
            const effectivePrice = (acc.discountPrice !== undefined && acc.discountPrice < acc.price)
                ? acc.discountPrice
                : acc.price;

            return sum + (effectivePrice * qty);
        }, 0);

    const accessoriesDiscount = activeAccessories
        .filter(acc => selectedAccessories.includes(acc.id))
        .reduce((sum, acc) => {
            const qty = quantities[acc.id] || 1;
            const effectivePrice = (acc.discountPrice !== undefined && acc.discountPrice < acc.price)
                ? acc.discountPrice
                : acc.price;
            const discount = Math.max(0, (acc.price || 0) - (effectivePrice || 0));
            return sum + (discount * qty);
        }, 0);

    const servicesPrice = activeServices
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => {
            const qty = quantities[s.id] || 1;
            const price = (s.discountPrice || 0) > 0 ? (s.discountPrice || 0) : (s.price || 0);
            return sum + (price * qty);
        }, 0);

    const servicesDiscount = activeServices
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => {
            const qty = quantities[s.id] || 1;
            const base = s.price || 0;
            const effective = (s.discountPrice || 0) > 0 ? (s.discountPrice || 0) : base;
            const discount = Math.max(0, base - effective);
            return sum + (discount * qty);
        }, 0);

    const insuranceAddonsDiscount = availableInsuranceAddons
        .filter(a => selectedInsuranceAddons.includes(a.id))
        .reduce((sum, a) => {
            const base = a.price || 0;
            const effective = (a.discountPrice || 0) > 0 ? (a.discountPrice || 0) : base;
            const discount = Math.max(0, base - effective);
            return sum + discount;
        }, 0);

    const colorDiscount = activeColorConfig.dealerOffer || activeColorConfig.pricingOverride?.dealerOffer || 0;

    // Offers are now provided via initialServices/initialAccessories, removing legacy mock lookup
    const activeOffers = selectedOffers
        .map(id => initialServices?.find((s: ServiceOption) => s.id === id))
        .filter(Boolean) as ServiceOption[];

    const offersDiscount = activeOffers
        .reduce((sum, o) => sum + (o?.discountPrice || 0), 0);

    const totalOnRoad = baseExShowroom + rtoEstimates + baseInsurance + insuranceAddonsPrice + accessoriesPrice + servicesPrice + otherCharges - colorDiscount - offersDiscount;
    const totalSavings = colorDiscount + offersDiscount + accessoriesDiscount + servicesDiscount + insuranceAddonsDiscount;

    // Dynamic Finance Logic
    const financeScheme = initialFinance?.scheme;

    // Calculate Max Allowed Loan based on Scheme Criteria (Lower of LTV or Amount)
    const ltvMaxLoan = (totalOnRoad * (financeScheme?.maxLTV ?? 100)) / 100;
    const capMaxLoan = financeScheme?.maxLoanAmount || 300000;
    const maxAllowedLoan = Math.min(ltvMaxLoan, capMaxLoan);

    // EMI & Down Payment Constraints
    // Min Down Payment is the gap between On-Road and Max Allowed Loan
    const minDownPayment = Math.max(0, Math.round(totalOnRoad - maxAllowedLoan));
    const maxDownPayment = Math.round(totalOnRoad * 0.95);
    // REQUIREMENT: Default to Zero unless user overrides
    const defaultDownPayment = 0;

    const downPayment = userDownPayment !== null
        ? Math.min(Math.max(userDownPayment, minDownPayment), maxDownPayment)
        : defaultDownPayment;

    const loanAmount = totalOnRoad - downPayment;
    const annualInterest = financeScheme ? (financeScheme.interestRate / 100) : 0.095;
    const monthlyRate = annualInterest / 12;

    // EMI Calculation (handle FLAT vs REDUCING)
    let emi = 0;
    if (loanAmount > 0) {
        if (financeScheme?.interestType === 'FLAT') {
            const totalInterest = (loanAmount * (financeScheme.interestRate / 100) * (emiTenure / 12));
            emi = Math.round((loanAmount + totalInterest) / emiTenure);
        } else {
            emi = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, emiTenure)) / (Math.pow(1 + monthlyRate, emiTenure) - 1));
        }
    }

    // Dynamic Charges Calculation - Consolidate all into "Processing Charges"
    const allCharges = (financeScheme?.charges || []);
    let totalChargeAmount = 0;
    const chargeBreakup: string[] = [];

    allCharges.forEach(charge => {
        let amount = 0;
        if (charge.calculationBasis === 'FIXED') {
            amount = charge.value;
        } else if (charge.type === 'PERCENTAGE') {
            const basisAmount = charge.calculationBasis === 'LOAN_AMOUNT' ? loanAmount : totalOnRoad;
            amount = Math.round(basisAmount * (charge.value / 100));
        } else {
            amount = charge.value;
        }

        totalChargeAmount += amount;

        const taxInfo = charge.taxStatus === 'INCLUSIVE'
            ? ` (incl. ${charge.taxRate}% GST)`
            : charge.taxStatus === 'EXCLUSIVE'
                ? ` + ${charge.taxRate}% GST`
                : '';

        chargeBreakup.push(`${charge.name}: ₹${Math.round(amount).toLocaleString()}${taxInfo}`);
    });

    const financeCharges = allCharges.length > 0 ? [{
        id: 'processing_charges',
        label: 'Processing Charges',
        value: Math.round(totalChargeAmount),
        isDeduction: false,
        helpText: chargeBreakup.join(' • ')
    }] : [];

    const [isReferralActive, setIsReferralActive] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsReferralActive(localStorage.getItem('referral_activated') === 'true');
        }
    }, []);

    const handleColorChange = (newColorId: string) => {
        setSelectedColor(newColorId);
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('color', newColorId);
        router.replace(`?${newParams.toString()}`, { scroll: false });
    };

    return {
        data: {
            colors,
            selectedColor,
            baseExShowroom,
            rtoEstimates,
            rtoBreakdown,
            baseInsurance,
            insuranceBreakdown,
            insuranceAddonsPrice,
            otherCharges,
            accessoriesPrice,
            servicesPrice,
            offersDiscount,
            colorDiscount,
            accessoriesDiscount,
            servicesDiscount,
            insuranceAddonsDiscount,
            totalSavings,
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
            pricingSource: registrationRule?.state_code ? 'MARKET_RULES' : 'ESTIMATE'
        },
        actions: {
            setSelectedColor: handleColorChange,
            setRegType,
            setSelectedAccessories,
            setSelectedInsuranceAddons,
            setEmiTenure,
            setConfigTab,
            setSelectedServices,
            setSelectedOffers,
            setQuantities,
            setUserDownPayment,
            setIsReferralActive
        }
    };
}
