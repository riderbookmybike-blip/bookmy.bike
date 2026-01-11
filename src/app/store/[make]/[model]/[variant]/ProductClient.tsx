'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Zap, Star, ShieldCheck, Info, ArrowRight, ChevronDown, Save, Download, Share, Heart } from 'lucide-react';
import { LeadCaptureModal } from '@/components/leads/LeadCaptureModal';
import { createClient } from '@/lib/supabase/client';
import { EmailUpdateModal } from '@/components/auth/EmailUpdateModal';
import PersonalizeLayout from '@/components/store/Personalize/PersonalizeLayout';
import DynamicHeader from '@/components/store/Personalize/DynamicHeader';
import DeliveryChecker from '@/components/store/Personalize/DeliveryChecker';
import TabNavigation from '@/components/store/Personalize/Tabs/TabNavigation';
import AccessoriesTab from '@/components/store/Personalize/Tabs/AccessoriesTab';
import PriceBreakupTab from '@/components/store/Personalize/Tabs/PriceBreakupTab';
import VisualsRow from '@/components/store/Personalize/VisualsRow';

interface ProductClientProps {
    product: any;
    makeParam: string;
    modelParam: string;
    variantParam: string;
    // colorParam removed as it's now a query param
    initialLocation: any;
    initialPrice: any;
}

export default function ProductClient({
    product,
    makeParam,
    modelParam,
    variantParam,
    initialLocation,
    initialPrice
}: ProductClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Mock Data for Colors with Pricing Overrides (Simulating ProductMaster data)
    interface LocalColorConfig {
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

    const productColors: LocalColorConfig[] = [
        {
            id: 'obsidian-black',
            name: 'Obsidian Black',
            hex: '#000000',
            class: 'bg-black',
            pricingOverride: { exShowroom: 78000 }
        },
        {
            id: 'stellar-silver',
            name: 'Stellar Silver',
            hex: '#cbd5e1',
            class: 'bg-slate-300',
            pricingOverride: { exShowroom: 78000 }
        },
        {
            id: 'racing-red',
            name: 'Racing Red',
            hex: '#dc2626',
            class: 'bg-red-600',
            pricingOverride: { exShowroom: 79500, dealerOffer: 1500 }
        },
        {
            id: 'electric-blue',
            name: 'Electric Blue',
            hex: '#2563eb',
            class: 'bg-blue-600',
            pricingOverride: { exShowroom: 79500 }
        },
    ];

    // SEO REFACTOR: State Sync with Query Param
    // 1. Read from URL or Default
    const colorFromQuery = searchParams.get('color');
    const isValidColor = colorFromQuery && productColors.some(c => c.id === colorFromQuery);

    // Auto-Redirect if invalid color in query
    useEffect(() => {
        if (colorFromQuery && !isValidColor) {
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('color');
            router.replace(`?${newParams.toString()}`, { scroll: false });
        }
    }, [colorFromQuery, isValidColor, searchParams, router]);

    const initialColor = isValidColor ? colorFromQuery : productColors[0].id; // Fallback to first color

    const [selectedColor, setSelectedColor] = useState(initialColor);

    // Sync state if URL changes externally
    useEffect(() => {
        const currentQueryColor = searchParams.get('color');
        if (currentQueryColor && currentQueryColor !== selectedColor && productColors.some(c => c.id === currentQueryColor)) {
            setSelectedColor(currentQueryColor);
        }
    }, [searchParams]); // Dependent on searchParams

    const [isReferralActive, setIsReferralActive] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [showQuoteSuccess, setShowQuoteSuccess] = useState(false);
    const [referralCode, setReferralCode] = useState('');

    // Phase 3 State
    const [regType, setRegType] = useState<'STATE' | 'BH' | 'COMPANY'>('STATE');
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>(['acc-lock', 'acc-numberplate']); // Mandatory IDs
    const [selectedInsuranceAddons, setSelectedInsuranceAddons] = useState<string[]>([]);
    const [emiTenure, setEmiTenure] = useState(36);

    // Updated Config Tabs for 6-tab layout
    const [pricingMode, setPricingMode] = useState<'CASH' | 'FINANCE'>('FINANCE'); // Default to "Finance" as requested
    const [configTab, setConfigTab] = useState<'PRICE_BREAKUP' | 'FINANCE' | 'ACCESSORIES' | 'INSURANCE' | 'REGISTRATION' | 'SERVICES' | 'OFFERS'>('PRICE_BREAKUP');
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [userDownPayment, setUserDownPayment] = useState<number | null>(null); // Interactive Down Payment state

    // Mock Data for Phase 3
    const mandatoryAccessories = [
        { id: 'acc-lock', name: 'Smart Lock Security', price: 1200, description: 'GPS-enabled anti-theft locking system with mobile alerts.', discountPrice: 0, maxQty: 1 },
        { id: 'acc-numberplate', name: 'HSRP Number Plate', price: 850, description: 'Government mandated high security registration plate.', discountPrice: 0, maxQty: 1 },
    ];
    const optionalAccessories = [
        { id: 'acc-guard', name: 'Chrome Crash Guard', price: 2400, description: 'Heavy-duty stainless steel protection for engine and body.', discountPrice: 2100, maxQty: 1 },
        { id: 'acc-cover', name: 'All-Weather Cover', price: 950, description: 'Waterproof styling cover with UV protection coating.', discountPrice: 0, maxQty: 2 },
        { id: 'acc-grips', name: 'Comfort Palm Grips', price: 450, description: 'Ergonomic rubber grips for reduced vibration fatigue.', discountPrice: 0, maxQty: 2 },
        { id: 'acc-seat', name: 'Touring Seat Overlay', price: 1500, description: 'Gel-padded seat cover for long distance comfort.', discountPrice: 1250, maxQty: 1 },
    ];

    const mandatoryInsurance = [
        { id: 'ins-comp', name: 'Comprehensive Policy', price: 3200, description: 'Basic own-damage coverage mandated by law.', discountPrice: 0, isMandatory: true },
        { id: 'ins-liability', name: 'Third-Party Liability', price: 2300, description: 'Coverage for damages to third-party property/persons.', discountPrice: 0, isMandatory: true },
    ];

    const insuranceAddons = [
        { id: 'ins-zerodep', name: 'Zero Depreciation', price: 1800, description: 'Full claim coverage without depreciation deduction on parts.', discountPrice: 0 },
        { id: 'ins-rsa', name: 'Roadside Assistance', price: 800, description: '24/7 breakdown support, towing, and fuel delivery.', discountPrice: 0 },
        { id: 'ins-engine', name: 'Engine Protection', price: 1200, description: 'Coverage for engine damage due to water ingression or leakage.', discountPrice: 999 },
    ];
    const serviceOptions = [
        { id: 'srv-amc', name: 'Annual Maintenance Contract', price: 2500, description: 'Pre-paid service package for 1 year including consumables.', discountPrice: 2000, maxQty: 3 },
        { id: 'srv-teflon', name: '3M Teflon Coating', price: 1200, description: 'Paint protection treatment for long-lasting shine.', discountPrice: 0, maxQty: 1 },
    ];
    const offerOptions = [
        { id: 'off-exchange', name: 'Exchange Bonus', price: 0, description: 'Additional value on exchanging your old two-wheeler.', discountPrice: 5000 },
        { id: 'off-corporate', name: 'Corporate Discount', price: 0, description: 'Special pricing for employees of partner companies.', discountPrice: 3000 },
        { id: 'off-bank', name: 'HDFC Bank Offer', price: 0, description: 'Instant cashback on credit card EMI transactions.', discountPrice: 2000 },
    ];

    // ... (Tech specs skipped for brevity)

    const techSpecs: any = {
        'ENGINE': [
            { label: 'Type', value: '4 Stroke, SI Engine, BS-VI' },
            { label: 'Displacement', value: '109.51 cc' },
            { label: 'Max Power', value: '5.73 kW @ 8000 rpm' },
            { label: 'Max Torque', value: '8.79 Nm @ 5250 rpm' },
            { label: 'Fuel System', value: 'PGM-FI' },
        ],
        'DIMENSIONS': [
            { label: 'Length', value: '1833 mm' },
            { label: 'Width', value: '697 mm' },
            { label: 'Height', value: '1156 mm' },
            { label: 'Wheelbase', value: '1260 mm' },
            { label: 'Ground Clearance', value: '162 mm' },
        ],
        'CHASSIS': [
            { label: 'Frame Type', value: 'Under Bone' },
            { label: 'Front Suspension', value: 'Telescopic' },
            { label: 'Rear Suspension', value: '3-Step Adjustable Spring Loaded Hydraulic' },
            { label: 'Braking System', value: 'CBS' },
        ],
        'ELECTRICALS': [
            { label: 'Headlamp', value: 'LED' },
            { label: 'Battery', value: '12V 3.0 Ah' },
        ],
        'FEATURES': [
            { label: 'Silent Start', value: 'ACG Starter Motor' },
            { label: 'Idling Stop', value: 'Start-Stop System' },
            { label: 'Storage', value: '18L Under Seat' },
            { label: 'Console', value: 'Analogue + Digital' },
        ],
        'WARRANTY': [
            { label: 'Standard', value: '3 Years / 30,000 Km' },
            { label: 'Extended', value: 'Optional +2 Years' },
            { label: 'Service Interval', value: 'Every 4,000 Km' },
        ]
    };
    const [specTab, setSpecTab] = useState<'ENGINE' | 'DIMENSIONS' | 'CHASSIS' | 'ELECTRICALS' | 'FEATURES' | 'WARRANTY'>('ENGINE');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsReferralActive(localStorage.getItem('referral_activated') === 'true');
        }
        // Initialize Mandatory Insurance
        setSelectedInsuranceAddons(prev => {
            const mandatoryIds = mandatoryInsurance.map(i => i.id);
            const unique = new Set([...prev, ...mandatoryIds]);
            return Array.from(unique);
        });
    }, []);

    // SEO REFACTOR: Update Logic
    const handleColorChange = (newColorId: string) => {
        setSelectedColor(newColorId);

        // Update URL Shallowly
        // Preserve existing params (like pincode, utm_source etc)
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('color', newColorId);

        router.replace(`?${newParams.toString()}`, { scroll: false });
    };

    if (!product) return <div>Product Not Found</div>;

    // Dynamic Pricing Calculation
    // Find selected color config
    const activeColorConfig = productColors.find(c => c.id === selectedColor) || productColors[0];
    const activePricingOverride = activeColorConfig.pricingOverride;

    // Use derived ExShowroom from override or default
    // Use derived ExShowroom from override or default
    const baseExShowroom = activePricingOverride?.exShowroom || initialPrice?.exShowroom || 78000;
    // Breakdown Ex-Showroom for Display (Standard vs Premium)


    // RTO Calculation based on Reg Type & Color Price
    // Logic: Color affects ExShowroom -> affects RTO/Insurance
    let rtoEstimates = Math.round(baseExShowroom * 0.12); // Default 12%
    if (regType === 'BH') rtoEstimates = Math.round(baseExShowroom * 0.08);
    if (regType === 'COMPANY') rtoEstimates = Math.round(baseExShowroom * 0.20);

    // Insurance Base (Optional Logic could go here, but kept simple)
    const baseInsurance = 0;

    // Calculate Addons
    const insuranceAddonsPrice = [...mandatoryInsurance, ...insuranceAddons]
        .filter(addon => selectedInsuranceAddons.includes(addon.id))
        .reduce((sum, addon) => {
            return sum + (addon.discountPrice > 0 ? addon.discountPrice : addon.price);
        }, 0);

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

    // Color Broker Discount?
    const colorDiscount = activePricingOverride?.dealerOffer || 0;

    const roadTax = 1200;

    // Total On Road Calculation
    const totalOnRoad = (activePricingOverride?.onRoadOverride)
        ? activePricingOverride.onRoadOverride
        : (baseExShowroom + rtoEstimates + baseInsurance + insuranceAddonsPrice + roadTax + accessoriesPrice + servicesPrice - offersDiscount - colorDiscount);

    // Calculate Total MRP (For Strike-through) - Sum of all components at full price
    const insuranceMRP = [...mandatoryInsurance, ...insuranceAddons]
        .filter(addon => selectedInsuranceAddons.includes(addon.id))
        .reduce((sum, addon) => sum + addon.price, 0);

    const accessoriesMRP = [...mandatoryAccessories, ...optionalAccessories]
        .filter(acc => selectedAccessories.includes(acc.id))
        .reduce((sum, acc) => {
            const qty = quantities[acc.id] || 1;
            return sum + (acc.price * qty);
        }, 0);

    const servicesMRP = serviceOptions
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => {
            const qty = quantities[s.id] || 1;
            return sum + (s.price * qty);
        }, 0);

    // If product.mrp is missing, assume a standard markup on ex-showroom
    const baseMRP = product.mrp || (baseExShowroom + 5000);
    const totalMRP = baseMRP + rtoEstimates + baseInsurance + insuranceMRP + roadTax + accessoriesMRP + servicesMRP;

    // Delta Calculation vs Default Color
    const defaultColorConfig = productColors.find(c => c.id === 'pearl-precious-white') || productColors[0];
    const defaultPricingOverride = defaultColorConfig.pricingOverride;

    // Default Components
    const defaultExShowroom = defaultPricingOverride?.exShowroom || initialPrice?.exShowroom || (product.make === 'Royal Enfield' ? 193000 : 82000);

    let defaultRto = Math.round(defaultExShowroom * 0.12);
    if (regType === 'BH') defaultRto = Math.round(defaultExShowroom * 0.08);
    if (regType === 'COMPANY') defaultRto = Math.round(defaultExShowroom * 0.20);

    const defaultColorDiscount = defaultPricingOverride?.dealerOffer || 0;

    const defaultTotalOnRoad = (defaultPricingOverride?.onRoadOverride)
        ? defaultPricingOverride.onRoadOverride
        : (defaultExShowroom + defaultRto + baseInsurance + insuranceAddonsPrice + roadTax + accessoriesPrice + servicesPrice - offersDiscount - defaultColorDiscount);

    // Deltas
    const deltaExShowroom = baseExShowroom - (defaultPricingOverride?.exShowroom || 78000);
    const deltaRto = rtoEstimates - defaultRto;
    const deltaDiscount = colorDiscount - defaultColorDiscount;
    const deltaTotal = totalOnRoad - defaultTotalOnRoad;


    // EMI Calculation (Mock)
    const minDownPayment = Math.round(totalOnRoad * 0.1); // Min 10%
    const maxDownPayment = Math.round(totalOnRoad * 0.8); // Max 80%
    const defaultDownPayment = Math.round(totalOnRoad * 0.2);

    // Use user input if available, otherwise default. Ensure it's within bounds if totalOnRoad changes drastically.
    const downPayment = userDownPayment !== null
        ? Math.min(Math.max(userDownPayment, minDownPayment), maxDownPayment)
        : defaultDownPayment;

    const loanAmount = totalOnRoad - downPayment;
    const annualInterest = 0.095;
    const monthlyRate = annualInterest / 12;
    const emi = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, emiTenure)) / (Math.pow(1 + monthlyRate, emiTenure) - 1));

    const handleShareQuote = () => {
        // Construct Context-Aware Share URL
        const url = new URL(window.location.href);

        url.searchParams.set('color', selectedColor);
        if (initialLocation?.pincode) {
            url.searchParams.set('pincode', initialLocation.pincode);
        }

        if (navigator.share) {
            navigator.share({
                title: `${product.model} Configuration`,
                text: `Check out ${product.model} on BookMyBike! On-Road Price in ${initialLocation?.city || 'India'}: ₹${totalOnRoad.toLocaleString()}`,
                url: url.toString(),
            }).catch(console.error);
        } else {
            // Fallback - Copy to clipboard
            navigator.clipboard.writeText(url.toString());
            alert('Context-aware Share URL copied to clipboard!');
        }
    };

    const handleDownloadQuote = () => {
        // Mock download
        alert('Downloading Quote PDF...');
    };

    const handleSaveQuote = () => {
        // Mock save -> trigger success modal
        setShowQuoteSuccess(true);
    };

    const toggleAccessory = (id: string) => {
        if (mandatoryAccessories.some(a => a.id === id)) return; // Locked
        setSelectedAccessories(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleInsuranceAddon = (id: string) => {
        if (mandatoryInsurance.some(i => i.id === id)) return; // Locked
        setSelectedInsuranceAddons(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const updateQuantity = (id: string, delta: number, max: number = 1) => {
        setQuantities(prev => {
            const current = prev[id] || 1;
            const next = Math.min(Math.max(1, current + delta), max);
            return { ...prev, [id]: next };
        });
    };

    const toggleService = (id: string) => {
        setSelectedServices(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleOffer = (id: string) => {
        // Logic: specific offers might be mutually exclusive, but for now allow multiple
        setSelectedOffers(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleRedeem = () => {
        if (referralCode.length > 5) {
            localStorage.setItem('referral_activated', 'true');
            setIsReferralActive(true);
            setShowReferralModal(false);
            // Trigger success animation/notification if needed
        }
    };

    const [showEmailModal, setShowEmailModal] = useState(false);

    // ... existing handleBookingRequest ...

    const handleBookingRequest = async () => {
        // 1. Check for Real Email Logic
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // If email is fake (placeholder), block booking and ask for update
        if (user?.email?.endsWith('@bookmy.bike')) {
            setShowEmailModal(true);
            return;
        }

        // 2. Proceed with Referral or Success Flow
        if (!isReferralActive) {
            setShowReferralModal(true);
        } else {
            setShowQuoteSuccess(true);
        }
    };

    const renderConfigContent = (tabId: string) => {
        // Shared sorting logic


        const ConfigItemRow = ({ item, isSelected, onToggle, isMandatory = false, isRadio = false }: { item: any, isSelected: boolean, onToggle?: () => void, isMandatory?: boolean, isRadio?: boolean }) => {
            // Logic: If not selected, Qty is 0, Billed is 0.
            // If selected, Qty is from state (default 1), Billed is Price * Qty.
            const quantity = isSelected ? (quantities[item.id] || 1) : 0;
            const finalPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
            const discountPercent = item.discountPrice > 0 ? Math.round(((item.price - item.discountPrice) / item.price) * 100) : 0;
            const billedAmount = isSelected ? (finalPrice * quantity) : 0;

            return (
                <div
                    className={`group relative p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${isSelected ? 'bg-blue-900/10 border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.1)] backdrop-blur-sm' : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'}`}
                >
                    {/* Clickable Area for Toggle (Except Qty Controls) */}
                    <div
                        onClick={(e) => {
                            // Prevent toggle if clicking quantity or if mandatory
                            if ((e.target as HTMLElement).closest('.qty-control')) return;
                            if (!isMandatory && onToggle) onToggle();
                        }}
                        className={`flex-1 grid md:grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr] items-center gap-4 ${!isMandatory ? 'cursor-pointer' : ''}`}
                    >
                        {/* 1. Item Details (Name & Desc) */}
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${isSelected ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-white/5 border-white/10 text-slate-500 group-hover:border-white/20 group-hover:text-slate-400'}`}>
                                {tabId === 'INSURANCE' ? <ShieldCheck className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className={`text-sm font-black uppercase italic leading-tight transition-colors ${isSelected ? 'text-white' : 'text-slate-300'}`}>{item.name}</p>
                                <div className="relative md:hidden mt-2">
                                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                        Info <Info className="w-3 h-3 text-blue-500" />
                                    </span>
                                    <div className="absolute left-0 top-6 w-48 p-3 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-20 hidden group-hover:block transition-all">
                                        <p className="text-[10px] text-slate-400 leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                                <p className="hidden md:block text-[10px] font-medium text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                            </div>
                        </div>

                        {/* 2. MRP */}
                        <div className="hidden md:block text-center">
                            <span className="text-sm font-medium text-slate-500">₹{item.price.toLocaleString()}</span>
                        </div>

                        {/* 3. Offer Price */}
                        <div className="hidden md:block text-center">
                            <span className={`text-sm font-black italic ${isSelected ? 'text-white' : 'text-slate-300'}`}>₹{finalPrice.toLocaleString()}</span>
                        </div>

                        {/* 4. Your Saving */}
                        <div className="hidden md:block text-center">
                            {item.discountPrice > 0 ? (
                                <span className="text-sm font-bold text-emerald-500">₹{(item.price - item.discountPrice).toLocaleString()}</span>
                            ) : (
                                <span className="text-sm font-medium text-slate-700">-</span>
                            )}
                        </div>

                        {/* 5. Quantity */}
                        <div className="hidden md:flex justify-center">
                            {isSelected && item.maxQty > 1 ? (
                                <div className="qty-control flex items-center bg-slate-950 rounded-lg border border-white/10 p-1 shadow-inner">
                                    <button
                                        onClick={() => updateQuantity(item.id, -1, item.maxQty)}
                                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                    >-</button>
                                    <span className="w-8 text-center text-[10px] font-bold text-white">{quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, 1, item.maxQty)}
                                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                    >+</button>
                                </div>
                            ) : (
                                <span className={`text-sm font-medium ${isSelected ? 'text-slate-600' : 'text-slate-700'}`}>{quantity}</span>
                            )}
                        </div>

                        {/* 6. Billed Amount */}
                        <div className="hidden md:block text-right pr-8">
                            <span className={`text-sm font-black italic ${isSelected ? 'text-blue-400' : 'text-slate-700'}`}>₹{billedAmount.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className={`w-6 h-6 absolute right-4 top-1/2 -translate-y-1/2 rounded-full border flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-blue-500 bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.6)] scale-110' : 'border-white/20 group-hover:border-white/40'}`}>
                        {isSelected && <div className={`w-2 h-2 bg-white rounded-full ${isRadio ? '' : ''}`} />}
                    </div>
                </div>
            );
        };

        switch (tabId) {
            case 'MANDATORY':
                return (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 italic border-b border-white/5 mx-1 mb-2 text-center">
                            <span className="text-left">Item Details</span>
                            <span>MRP</span>
                            <span>Offer Price</span>
                            <span>Your Saving</span>
                            <span>Quantity</span>
                            <span className="text-right pr-8">Billed Amount</span>
                        </div>
                        <div className="space-y-2">
                            {mandatoryAccessories.map(acc => (
                                <ConfigItemRow key={acc.id} item={acc} isSelected={true} isMandatory={true} />
                            ))}
                        </div>
                    </div>
                );
            case 'REGISTRATION':
                const registrationOptions = [
                    { id: 'STATE', name: 'State Registration (DL)', price: Math.round(baseExShowroom * 0.12), description: 'Standard Local RTO registration.', discountPrice: 0 },
                    { id: 'BH', name: 'Bharat Series (BH)', price: Math.round(baseExShowroom * 0.08), description: 'Pan-India transferable registration for eligible employees.', discountPrice: 0 },
                    { id: 'COMPANY', name: 'Company Registration', price: Math.round(baseExShowroom * 0.20), description: 'Registration in company name with business tax benefits.', discountPrice: 0 }
                ];
                return (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 italic border-b border-white/5 mx-1 text-center">
                            <span className="text-left">Registration Type</span>
                            <span>MRP</span>
                            <span>Offer Price</span>
                            <span>Your Saving</span>
                            <span>Quantity</span>
                            <span className="text-right pr-8">Billed Amount</span>
                        </div>
                        <div className="space-y-2">
                            {registrationOptions.map(option => (
                                <ConfigItemRow
                                    key={option.id}
                                    item={option}
                                    isSelected={regType === option.id}
                                    onToggle={() => setRegType(option.id as any)}
                                    isRadio={true}
                                />
                            ))}
                        </div>
                    </div>
                );
            case 'ACCESSORIES':
                return (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 italic border-b border-white/5 mx-1 text-center">
                            <span className="text-left">Accessory Name</span>
                            <span>MRP</span>
                            <span>Offer Price</span>
                            <span>Your Saving</span>
                            <span>Quantity</span>
                            <span className="text-right pr-8">Billed Amount</span>
                        </div>
                        <div className="space-y-2">
                            {optionalAccessories.map(acc => (
                                <ConfigItemRow
                                    key={acc.id}
                                    item={acc}
                                    isSelected={selectedAccessories.includes(acc.id)}
                                    onToggle={() => toggleAccessory(acc.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            case 'INSURANCE':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 italic border-b border-white/5 mx-1 text-center">
                            <span className="text-left">Coverage Plan</span>
                            <span>MRP</span>
                            <span>Offer Price</span>
                            <span>Your Saving</span>
                            <span>Quantity</span>
                            <span className="text-right pr-8">Billed Amount</span>
                        </div>

                        {/* Mandatory Insurance */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 pt-2">Mandatory Coverage</p>
                            {mandatoryInsurance.map(addon => (
                                <ConfigItemRow
                                    key={addon.id}
                                    item={addon}
                                    isSelected={true}
                                    onToggle={() => { }}
                                    isMandatory={true}
                                />
                            ))}
                        </div>

                        {/* Optional Add-ons */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 pt-2">Optional Add-ons</p>
                            {insuranceAddons.map(addon => (
                                <ConfigItemRow
                                    key={addon.id}
                                    item={addon}
                                    isSelected={selectedInsuranceAddons.includes(addon.id)}
                                    onToggle={() => toggleInsuranceAddon(addon.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            case 'SERVICES':
                return (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 italic border-b border-white/5 mx-1 text-center">
                            <span className="text-left">Service Package</span>
                            <span>MRP</span>
                            <span>Offer Price</span>
                            <span>Your Saving</span>
                            <span>Quantity</span>
                            <span className="text-right pr-8">Billed Amount</span>
                        </div>
                        <div className="space-y-2">
                            {serviceOptions.map(srv => (
                                <ConfigItemRow
                                    key={srv.id}
                                    item={srv}
                                    isSelected={selectedServices.includes(srv.id)}
                                    onToggle={() => toggleService(srv.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            case 'OFFERS':
                return (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 italic border-b border-white/5 mx-1 text-center">
                            <span className="text-left">Offer Name</span>
                            <span>MRP</span>
                            <span>Offer Price</span>
                            <span>Your Saving</span>
                            <span>Quantity</span>
                            <span className="text-right pr-8">Billed Amount</span>
                        </div>
                        <div className="space-y-2">
                            {offerOptions.map(offer => (
                                <ConfigItemRow
                                    key={offer.id}
                                    item={offer}
                                    isSelected={selectedOffers.includes(offer.id)}
                                    onToggle={() => toggleOffer(offer.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const currentColorName = productColors.find(c => c.id === selectedColor)?.name || '';

    const getProductImage = () => {
        switch (product.bodyType) {
            case 'SCOOTER': return '/images/categories/scooter_nobg.png';
            case 'MOTORCYCLE': return '/images/categories/motorcycle_nobg.png';
            case 'MOPED': return '/images/categories/moped_nobg.png';
            default: return '/images/hero-bike.png';
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white pb-32 transition-colors duration-500">
            {/* =====================================================================================
                UNIFIED PERSONALIZE SECTION (Responisve 60/40 Split)
               ===================================================================================== */}

            <PersonalizeLayout
                className="mt-0"
                header={
                    <DynamicHeader
                        title={product.model}
                        variantName={variantParam}
                        colorName={currentColorName}
                        mrp={totalMRP}
                        offerPrice={totalOnRoad}
                        breadcrumb={
                            <>
                                STORE / <span className="text-slate-300">{product.make}</span> / <span className="text-slate-300">{product.model}</span> / {variantParam} / {currentColorName}
                            </>
                        }
                        actions={
                            <>
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Price Protection</span>
                                </div>
                                <button onClick={handleShareQuote} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all backdrop-blur-md">
                                    <Share size={18} />
                                </button>
                                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all backdrop-blur-md">
                                    <Heart size={18} />
                                </button>
                            </>
                        }
                    />
                }
                visuals={
                    <VisualsRow
                        colors={productColors}
                        selectedColor={selectedColor}
                        onColorSelect={handleColorChange}
                        productImage={getProductImage()}
                        videoSource="S2N_O8lC7OM"
                    />
                }
                tabs={
                    <TabNavigation
                        activeTab={configTab}
                        onTabChange={(id) => setConfigTab(id as any)}
                        tabs={[
                            { id: 'PRICE_BREAKUP', label: 'Price Breakup' },
                            { id: 'FINANCE', label: 'Finance Options' },
                            { id: 'ACCESSORIES', label: 'Accessories', count: selectedAccessories.length },
                            { id: 'INSURANCE', label: 'Insurance' },
                            { id: 'REGISTRATION', label: 'Registration' },
                            { id: 'SERVICES', label: 'Services' },
                            { id: 'OFFERS', label: 'Offers' },
                        ]}
                    />
                }
            >
                {/* ACTIVE TAB CONTENT RENDERER */}
                {configTab === 'PRICE_BREAKUP' && (
                    <div className="space-y-6">
                        <PriceBreakupTab
                            items={[
                                { label: 'Ex-Showroom Price', value: baseExShowroom, description: 'Base price of the vehicle including heavy discounts.' },
                                { label: 'RTO Registration', value: rtoEstimates, description: `Based on ${regType} registration type.` },
                                { label: 'Insurance (Mandatory)', value: mandatoryInsurance.reduce((sum, i) => sum + i.price, 0), description: '1 Year Comprehensive + 5 Years Third Party.' },
                                { label: 'Insurance Add-ons', value: insuranceAddonsPrice, description: 'Selected extra coverage.' },
                                { label: 'Accessories', value: accessoriesPrice, description: 'Selected optional styling and protection.' },
                                { label: 'Services / AMC', value: servicesPrice, description: 'Pre-paid maintenance plans.' },
                                { label: 'Road Tax & Handling', value: roadTax, description: 'Local processing charges.' },
                                { label: 'Offers Applied', value: offersDiscount, isDeduction: true, description: 'Seasonal and bank offers.' },
                                ...(colorDiscount > 0 ? [{
                                    label: 'Color Special Offer',
                                    value: colorDiscount,
                                    isDeduction: true,
                                    description: `Special discount on ${activeColorConfig.name}.`
                                }] : []),
                                ...(isReferralActive ? [{
                                    label: 'Dealer Invitation Discount',
                                    value: 5000,
                                    isDeduction: true,
                                    description: 'Exclusive pricing unlocked via BMB Buddy.'
                                }] : []),
                                { label: 'Total On-Road Price', value: totalOnRoad - (isReferralActive ? 5000 : 0), isTotal: true, description: `Final price payable in ${initialLocation?.city || 'India'}` }
                            ]}
                        />

                        {/* Delta Section - Only if selected color is non-standard */}
                        {selectedColor !== defaultColorConfig.id && (
                            <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Price Impact vs {defaultColorConfig.name}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-600 dark:text-slate-400">Ex-Showroom Difference</span>
                                            <span className={`font-mono font-bold ${deltaExShowroom > 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-500'}`}>
                                                {deltaExShowroom > 0 ? '+' : ''}{deltaExShowroom.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-600 dark:text-slate-400">RTO & Tax Impact</span>
                                            <span className={`font-mono font-bold ${deltaRto > 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-500'}`}>
                                                {deltaRto > 0 ? '+' : ''}{deltaRto.toLocaleString()}
                                            </span>
                                        </div>
                                        {deltaDiscount !== 0 && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-600 dark:text-slate-400">Offer Difference</span>
                                                <span className="font-mono font-bold text-emerald-500">
                                                    {deltaDiscount > 0 ? '-' : '+'}{Math.abs(deltaDiscount).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:border-l md:border-slate-200 md:dark:border-white/10 md:pl-4 flex items-center justify-between md:justify-center">
                                        <div className="text-right md:text-center">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Net On-Road Difference</p>
                                            <p className={`text-xl font-black italic tracking-tighter ${deltaTotal > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-500'}`}>
                                                {deltaTotal > 0 ? '+' : ''}{deltaTotal.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {configTab === 'FINANCE' && (
                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* 1. Promo Header */}
                        <div className="p-8 md:p-10 border-b border-slate-200 dark:border-white/10 flex items-start gap-6">
                            <div className="w-12 h-12 bg-blue-600/10 dark:bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                                <Zap className="text-blue-600 dark:text-blue-500 w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                                    Finance Options
                                </h3>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                                    Flexible EMI Plans powered by HDFC Bank
                                </p>
                            </div>
                        </div>

                        <div className="p-8 md:p-10 space-y-10">
                            {/* 2. Down Payment Budget Slider */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white">Down Payment</h4>
                                    <div className="text-2xl font-black italic text-slate-900 dark:text-white">
                                        <span className="text-xs not-italic font-bold mr-1">₹</span>
                                        {downPayment.toLocaleString()}
                                    </div>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="range"
                                        min={minDownPayment}
                                        max={maxDownPayment}
                                        step={1000}
                                        value={downPayment}
                                        onChange={(e) => setUserDownPayment(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                                    />
                                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
                                        <span>Min: ₹{minDownPayment.toLocaleString()}</span>
                                        <span>Max: ₹{maxDownPayment.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Choose Preferred EMI List (Simple List) */}
                            <div className="space-y-4 pt-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white">Select Tenure</h4>
                                <div className="grid gap-3">
                                    {[60, 48, 36, 24].map((tenure) => {
                                        const monthlyInterest = annualInterest / 12;
                                        const optionEmi = Math.round((loanAmount * monthlyInterest * Math.pow(1 + monthlyInterest, tenure)) / (Math.pow(1 + monthlyInterest, tenure) - 1));
                                        const isSelected = emiTenure === tenure;

                                        return (
                                            <button
                                                key={tenure}
                                                onClick={() => setEmiTenure(tenure)}
                                                className={`group relative w-full p-6 rounded-[2rem] border transition-all duration-300 flex items-center justify-between ${isSelected
                                                    ? 'bg-blue-600 border-blue-500 shadow-2xl scale-[1.02] z-10'
                                                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-blue-500/50 dark:hover:bg-white/10 dark:hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-white bg-white' : 'border-slate-300 dark:border-white/20 group-hover:border-blue-500 dark:group-hover:border-white/40'}`}>
                                                        {isSelected && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-xl font-black italic uppercase ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                                ₹{optionEmi.toLocaleString()}
                                                            </span>
                                                            <span className={`text-[8px] font-bold uppercase ${isSelected ? 'text-white/60' : 'text-slate-500 dark:text-white/60'}`}>per month</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right flex items-center gap-3">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-lg font-black italic uppercase leading-none ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                            {tenure} Months
                                                        </span>
                                                        {tenure === 36 && (
                                                            <span className="text-[7px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400 mt-1">Recommended</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* 4. Footer Disclaimer */}
                        <div className="p-6 bg-slate-100 dark:bg-slate-950/20 border-t border-slate-200 dark:border-white/5">
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-relaxed text-center italic uppercase tracking-widest">
                                *Indicative EMI based on {annualInterest * 100}% annual interest. Final terms subject to credit approval.
                            </p>
                        </div>
                    </div>
                )}

                {configTab === 'ACCESSORIES' && (
                    <AccessoriesTab
                        items={[...mandatoryAccessories.map(i => ({ ...i, isMandatory: true })), ...optionalAccessories]}
                        selectedIds={[...mandatoryAccessories.map(i => i.id), ...selectedAccessories]}
                        onToggle={toggleAccessory}
                    />
                )}

                {/* Reuse existing rendering logic or generic rows for other tabs for now */}
                {['INSURANCE', 'REGISTRATION', 'SERVICES', 'OFFERS'].includes(configTab) && (
                    renderConfigContent(configTab)
                )}

            </PersonalizeLayout>

            <LeadCaptureModal
                isOpen={showQuoteSuccess}
                onClose={() => setShowQuoteSuccess(false)}
                productName={`${product.make} ${product.model}`}
                model={product.model}
                variant={variantParam}
                color={selectedColor}
                priceSnapshot={{
                    exShowroom: baseExShowroom,
                    onRoad: totalOnRoad,
                    city: initialLocation?.city
                }}
            />
        </div>
    );
}
