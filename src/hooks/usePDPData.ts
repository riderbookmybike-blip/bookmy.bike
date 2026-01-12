'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface LocalColorConfig {
    id: string;
    name: string;
    hex: string;
    class: string;
    pricingOverride?: {
        exShowroom?: number;
        dealerOffer?: number;
        onRoadOverride?: number;
    };
}

export const productColors: LocalColorConfig[] = [
    { id: 'obsidian-black', name: 'Obsidian Black', hex: '#000000', class: 'bg-black', pricingOverride: { exShowroom: 78000 } },
    { id: 'stellar-silver', name: 'Stellar Silver', hex: '#cbd5e1', class: 'bg-slate-300', pricingOverride: { exShowroom: 78000 } },
    { id: 'racing-red', name: 'Racing Red', hex: '#dc2626', class: 'bg-red-600', pricingOverride: { exShowroom: 79500, dealerOffer: 1500 } },
    { id: 'electric-blue', name: 'Electric Blue', hex: '#2563eb', class: 'bg-blue-600', pricingOverride: { exShowroom: 79500 } },
];

export const mandatoryAccessories = [
    { id: 'acc-lock', name: 'Smart Lock Security', price: 1200, description: 'GPS-enabled anti-theft locking system with mobile alerts.', discountPrice: 0, maxQty: 1 },
    { id: 'acc-numberplate', name: 'HSRP Number Plate', price: 850, description: 'Government mandated high security registration plate.', discountPrice: 0, maxQty: 1 },
];

export const optionalAccessories = [
    { id: 'acc-guard', name: 'Chrome Crash Guard', price: 2400, description: 'Heavy-duty stainless steel protection for engine and body.', discountPrice: 2100, maxQty: 1 },
    { id: 'acc-cover', name: 'All-Weather Cover', price: 950, description: 'Waterproof styling cover with UV protection coating.', discountPrice: 0, maxQty: 2 },
    { id: 'acc-grips', name: 'Comfort Palm Grips', price: 450, description: 'Ergonomic rubber grips for reduced vibration fatigue.', discountPrice: 0, maxQty: 2 },
    { id: 'acc-seat', name: 'Touring Seat Overlay', price: 1500, description: 'Gel-padded seat cover for long distance comfort.', discountPrice: 1250, maxQty: 1 },
];

export const mandatoryInsurance = [
    { id: 'ins-comp', name: 'Comprehensive Policy', price: 3200, description: 'Basic own-damage coverage mandated by law.', discountPrice: 0, isMandatory: true },
    { id: 'ins-liability', name: 'Third-Party Liability', price: 2300, description: 'Coverage for damages to third-party property/persons.', discountPrice: 0, isMandatory: true },
];

export const insuranceAddons = [
    { id: 'ins-zerodep', name: 'Zero Depreciation', price: 1800, description: 'Full claim coverage without depreciation deduction on parts.', discountPrice: 0 },
    { id: 'ins-rsa', name: 'Roadside Assistance', price: 800, description: '24/7 breakdown support, towing, and fuel delivery.', discountPrice: 0 },
    { id: 'ins-engine', name: 'Engine Protection', price: 1200, description: 'Coverage for engine damage due to water ingression or leakage.', discountPrice: 999 },
];

export const serviceOptions = [
    { id: 'srv-amc', name: 'Annual Maintenance Contract', price: 2500, description: 'Pre-paid service package for 1 year including consumables.', discountPrice: 2000, maxQty: 3 },
    { id: 'srv-teflon', name: '3M Teflon Coating', price: 1200, description: 'Paint protection treatment for long-lasting shine.', discountPrice: 0, maxQty: 1 },
];

export const offerOptions = [
    { id: 'off-exchange', name: 'Exchange Bonus', price: 0, description: 'Additional value on exchanging your old two-wheeler.', discountPrice: 5000 },
    { id: 'off-corporate', name: 'Corporate Discount', price: 0, description: 'Special pricing for employees of partner companies.', discountPrice: 3000 },
    { id: 'off-bank', name: 'HDFC Bank Offer', price: 0, description: 'Instant cashback on credit card EMI transactions.', discountPrice: 2000 },
];

export function usePDPData(initialPrice: any) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const colorFromQuery = searchParams.get('color');
    const isValidColor = colorFromQuery && productColors.some(c => c.id === colorFromQuery);
    const initialColor = isValidColor ? colorFromQuery : productColors[0].id;

    const [selectedColor, setSelectedColor] = useState(initialColor);
    const [regType, setRegType] = useState<'STATE' | 'BH' | 'COMPANY'>('STATE');
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>(['acc-lock', 'acc-numberplate']);
    const [selectedInsuranceAddons, setSelectedInsuranceAddons] = useState<string[]>(mandatoryInsurance.map(i => i.id));
    const [emiTenure, setEmiTenure] = useState(36);
    const [configTab, setConfigTab] = useState<'PRICE_BREAKUP' | 'FINANCE' | 'ACCESSORIES' | 'INSURANCE' | 'REGISTRATION' | 'SERVICES' | 'OFFERS'>('PRICE_BREAKUP');
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [userDownPayment, setUserDownPayment] = useState<number | null>(null);
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

    const activeColorConfig = productColors.find(c => c.id === selectedColor) || productColors[0];
    const baseExShowroom = activeColorConfig.pricingOverride?.exShowroom || initialPrice?.exShowroom || 78000;

    let rtoEstimates = Math.round(baseExShowroom * 0.12);
    if (regType === 'BH') rtoEstimates = Math.round(baseExShowroom * 0.08);
    if (regType === 'COMPANY') rtoEstimates = Math.round(baseExShowroom * 0.20);

    const insuranceAddonsPrice = [...mandatoryInsurance, ...insuranceAddons]
        .filter(addon => selectedInsuranceAddons.includes(addon.id))
        .reduce((sum, addon) => sum + (addon.discountPrice > 0 ? addon.discountPrice : addon.price), 0);

    const accessoriesPrice = [...mandatoryAccessories, ...optionalAccessories]
        .filter(acc => selectedAccessories.includes(acc.id))
        .reduce((sum, acc) => {
            const qty = quantities[acc.id] || 1;
            const price = acc.discountPrice > 0 ? acc.discountPrice : acc.price;
            return sum + (price * qty);
        }, 0);

    const servicesPrice = serviceOptions
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => {
            const qty = quantities[s.id] || 1;
            const price = s.discountPrice > 0 ? s.discountPrice : s.price;
            return sum + (price * qty);
        }, 0);

    const offersDiscount = offerOptions
        .filter(o => selectedOffers.includes(o.id))
        .reduce((sum, o) => sum + o.discountPrice, 0);

    const colorDiscount = activeColorConfig.pricingOverride?.dealerOffer || 0;
    const roadTax = 1200;

    const totalOnRoad = (activeColorConfig.pricingOverride?.onRoadOverride)
        ? activeColorConfig.pricingOverride.onRoadOverride
        : (baseExShowroom + rtoEstimates + insuranceAddonsPrice + roadTax + accessoriesPrice + servicesPrice - offersDiscount - colorDiscount);

    // EMI
    const minDownPayment = Math.round(totalOnRoad * 0.1);
    const maxDownPayment = Math.round(totalOnRoad * 0.8);
    const defaultDownPayment = Math.round(totalOnRoad * 0.2);
    const downPayment = userDownPayment !== null
        ? Math.min(Math.max(userDownPayment, minDownPayment), maxDownPayment)
        : defaultDownPayment;

    const loanAmount = totalOnRoad - downPayment;
    const annualInterest = 0.095;
    const monthlyRate = annualInterest / 12;
    const emi = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, emiTenure)) / (Math.pow(1 + monthlyRate, emiTenure) - 1));

    return {
        selectedColor, setSelectedColor: handleColorChange,
        regType, setRegType,
        selectedAccessories, setSelectedAccessories,
        selectedInsuranceAddons, setSelectedInsuranceAddons,
        emiTenure, setEmiTenure,
        configTab, setConfigTab,
        selectedServices, setSelectedServices,
        selectedOffers, setSelectedOffers,
        quantities, setQuantities,
        userDownPayment, setUserDownPayment,
        isReferralActive, setIsReferralActive,
        baseExShowroom, rtoEstimates, insuranceAddonsPrice, roadTax, accessoriesPrice, servicesPrice, offersDiscount, colorDiscount, totalOnRoad,
        downPayment, minDownPayment, maxDownPayment, emi, annualInterest, loanAmount
    };
}
