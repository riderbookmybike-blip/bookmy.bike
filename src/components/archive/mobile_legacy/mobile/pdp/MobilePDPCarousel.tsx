'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProductVariant } from '@/types/productMaster';

interface PDPCarouselProps {
    product: ProductVariant;
}

const SECTIONS = [
    { id: 'image', label: 'Product' },
    { id: 'details', label: 'Details' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'emi', label: 'EMI' },
    { id: 'accessories', label: 'Accessories' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'registration', label: 'Registration' }
];

export const MobilePDPCarousel = ({ product }: PDPCarouselProps) => {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState(0);
    const [showHelper, setShowHelper] = useState(false);

    // Check if helper should be shown
    useEffect(() => {
        const helperShown = localStorage.getItem('pdp_helper_shown');
        if (helperShown !== 'never') {
            setShowHelper(true);
            // Auto-hide after 3 seconds
            const timer = setTimeout(() => {
                setShowHelper(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const nextSection = () => {
        if (activeSection < SECTIONS.length - 1) {
            setActiveSection(activeSection + 1);
        }
    };

    const prevSection = () => {
        if (activeSection > 0) {
            setActiveSection(activeSection - 1);
        }
    };

    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = 50;
        if (info.offset.x < -threshold) {
            nextSection();
        } else if (info.offset.x > threshold) {
            prevSection();
        }
    };

    const handleDismissHelper = () => {
        setShowHelper(false);
    };

    const handleDontShowHelper = () => {
        localStorage.setItem('pdp_helper_shown', 'never');
        setShowHelper(false);
    };

    const renderSection = () => {
        const section = SECTIONS[activeSection];

        switch (section.id) {
            case 'image':
                return <ImageSection product={product} />;
            case 'details':
                return <DetailsSection product={product} />;
            case 'pricing':
                return <PricingSection product={product} />;
            case 'emi':
                return <EMISection product={product} />;
            case 'accessories':
                return <AccessoriesSection product={product} />;
            case 'insurance':
                return <InsuranceSection product={product} />;
            case 'registration':
                return <RegistrationSection product={product} />;
            default:
                return null;
        }
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-lg border border-white/20 flex items-center justify-center"
            >
                <ChevronLeft className="size-5 stroke-white" />
            </button>

            {/* Progress Dots */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 bg-black/40 backdrop-blur-lg px-4 py-2 rounded-full">
                {SECTIONS.map((section, idx) => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(idx)}
                        className={`rounded-full transition-all duration-300 ${idx === activeSection
                            ? 'bg-white w-6 h-2'
                            : 'bg-white/40 w-2 h-2'
                            }`}
                    />
                ))}
                <span className="text-white text-xs ml-2 font-bold">
                    {activeSection + 1}/{SECTIONS.length}
                </span>
            </div>

            {/* Swipeable Carousel */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="w-full h-full"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="w-full h-full"
                    >
                        {renderSection()}
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* Navigation Helper Overlay */}
            <AnimatePresence>
                {showHelper && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center px-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl p-6 max-w-sm w-full"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-zinc-900">
                                    👈 Swipe to explore
                                </h3>
                                <button onClick={handleDismissHelper}>
                                    <X className="size-5 text-zinc-400" />
                                </button>
                            </div>

                            <ul className="text-sm text-zinc-600 space-y-2 mb-6">
                                <li>• Product details & features</li>
                                <li>• Pricing breakdown</li>
                                <li>• EMI calculator</li>
                                <li>• Accessories selection</li>
                                <li>• Insurance plans</li>
                                <li>• Registration details</li>
                            </ul>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleDismissHelper}
                                    className="flex-1 h-12 bg-zinc-100 text-zinc-900 rounded-xl font-bold text-sm"
                                >
                                    Got it!
                                </button>
                                <button
                                    onClick={handleDontShowHelper}
                                    className="flex-1 h-12 bg-black text-white rounded-xl font-bold text-sm"
                                >
                                    Don't show again
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Section 1: Product Image
const ImageSection = ({ product }: { product: ProductVariant }) => {
    const activeColor = product.availableColors?.[0] || { imageUrl: product.imageUrl, hexCode: '#000000' };
    const lightShade = activeColor.hexCode;

    return (
        <div
            className="w-full h-full relative overflow-hidden"
            style={{ background: lightShade }}
        >
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-white/40 via-white/20 to-transparent" />

            {/* Brand Watermark */}
            <div className="relative w-full h-full flex items-center justify-center">
                <span className="absolute font-black text-[90px] uppercase tracking-[0.2em] opacity-[0.06] italic text-zinc-900 select-none">
                    {product.make}
                </span>

                {/* Product Image */}
                <div className="relative w-full h-[60%]">
                    <img
                        src={activeColor.imageUrl || product.imageUrl || '/images/placeholder-bike.png'}
                        alt={product.model}
                        className="w-full h-full object-contain drop-shadow-[0_45px_70px_rgba(0,0,0,0.5)]"
                    />
                </div>
            </div>

            {/* Product Info Overlay */}
            <div className="absolute bottom-0 inset-x-0 p-6 pb-20 bg-gradient-to-t from-white to-transparent">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                    {product.make}
                </div>
                <h1 className="text-3xl font-black text-zinc-900 mb-1">
                    {product.model}
                </h1>
                <p className="text-sm text-zinc-600">
                    {product.variant}
                </p>
            </div>
        </div>
    );
};

// Section 2: Details
const DetailsSection = ({ product }: { product: ProductVariant }) => {
    const specs = product.specifications;

    // Build specs list from actual data
    const specItems = [
        { label: 'Displacement', value: specs?.engine?.displacement },
        { label: 'Max Power', value: specs?.engine?.maxPower },
        { label: 'Max Torque', value: specs?.engine?.maxTorque },
        { label: 'Transmission', value: specs?.transmission?.type },
        { label: 'Gears', value: specs?.transmission?.gears },
        { label: 'Seat Height', value: specs?.dimensions?.seatHeight },
        { label: 'Kerb Weight', value: specs?.dimensions?.kerbWeight || specs?.dimensions?.curbWeight },
        { label: 'Fuel Capacity', value: specs?.dimensions?.fuelCapacity },
        { label: 'ABS', value: specs?.features?.abs },
        { label: 'Bluetooth', value: specs?.features?.bluetooth ? 'Yes' : undefined },
    ].filter(item => item.value);

    // Fall back to defaults if no specs available
    const displaySpecs = specItems.length > 0 ? specItems : [
        { label: 'Engine', value: 'Petrol' },
        { label: 'Features', value: 'LED Headlamp, Digital Console' }
    ];

    return (
        <div className="w-full h-full bg-white overflow-y-auto p-6 pt-20">
            <h2 className="text-2xl font-black text-zinc-900 mb-6">Product Details</h2>
            <div className="space-y-6">
                {/* Specifications */}
                <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Specifications</p>
                    <div className="bg-zinc-50 rounded-xl p-4 space-y-3">
                        {displaySpecs.map((spec, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-200 last:border-0">
                                <span className="text-sm text-zinc-600">{spec.label}</span>
                                <span className="text-sm font-bold text-zinc-900">{spec.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body Type & Fuel */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-zinc-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Body Type</p>
                        <p className="text-lg font-black text-zinc-900">{product.bodyType}</p>
                    </div>
                    <div className="flex-1 bg-zinc-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Fuel Type</p>
                        <p className="text-lg font-black text-zinc-900">{product.fuelType}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Section 3: Pricing
const PricingSection = ({ product }: { product: ProductVariant }) => {
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const price = product.price || { onRoad: 85000, exShowroom: 70000 };
    const colors = product.availableColors || [{ name: 'Black', hexCode: '#000000' }];
    const [selectedColorIndex, setSelectedColorIndex] = useState(0);

    // Calculate breakdown from on-road price
    const exShowroom = price.exShowroom || 0;
    const onRoad = price.onRoad || 0;
    const difference = onRoad - exShowroom;
    // Estimate breakdown (RTO ~50%, Insurance ~35%, Other ~15% of difference)
    const estimatedRto = Math.round(difference * 0.5);
    const estimatedInsurance = Math.round(difference * 0.35);
    const estimatedOther = difference - estimatedRto - estimatedInsurance;

    const breakdownItems = [
        { id: 'exShowroom', label: 'Ex-Showroom Price', value: exShowroom, icon: '🏪' },
        { id: 'rto', label: 'Registration (RTO)', value: estimatedRto, icon: '📋' },
        { id: 'insurance', label: 'Insurance', value: estimatedInsurance, icon: '🛡️' },
        { id: 'other', label: 'Other Charges', value: estimatedOther, icon: '📦' },
    ];

    return (
        <div className="w-full h-full bg-white overflow-y-auto">
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 pt-20 pb-8">
                <h2 className="text-2xl font-black text-white mb-2">Pricing Details</h2>
                <p className="text-sm text-zinc-400">Complete price breakdown</p>
            </div>

            <div className="p-6 space-y-6">
                {/* On-Road Price Card */}
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">On-Road Price</p>
                    <p className="text-5xl font-black mb-4">₹{(price.onRoad / 100000).toFixed(2)}L</p>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>Inclusive of all charges</span>
                    </div>
                </div>

                {/* Color Selector */}
                {colors.length > 1 && (
                    <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Available Colors</p>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {colors.map((color: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedColorIndex(idx)}
                                    className={`shrink-0 flex flex-col items-center gap-2 ${selectedColorIndex === idx ? 'opacity-100' : 'opacity-40'
                                        }`}
                                >
                                    <div
                                        className={`w-12 h-12 rounded-full border-2 ${selectedColorIndex === idx ? 'border-zinc-900 scale-110' : 'border-zinc-300'
                                            }`}
                                        style={{ backgroundColor: color.hexCode }}
                                    />
                                    <span className="text-xs font-medium text-zinc-600">{color.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Breakdown */}
                <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Price Breakdown</p>
                    <div className="space-y-2">
                        {breakdownItems.map((item) => (
                            <div key={item.id} className="bg-zinc-50 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                                    className="w-full p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{item.icon}</span>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-zinc-900">{item.label}</p>
                                            <p className="text-xs text-zinc-500">Tap for details</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-black text-zinc-900">₹{item.value.toLocaleString()}</p>
                                </button>

                                {expandedItem === item.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-4 pb-4 text-xs text-zinc-600"
                                    >
                                        <div className="bg-white rounded-lg p-3 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Base Amount:</span>
                                                <span className="font-bold">₹{item.value.toLocaleString()}</span>
                                            </div>
                                            <p className="text-zinc-400 mt-2">Standard charges applicable</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total Summary */}
                <div className="bg-zinc-100 rounded-2xl p-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-zinc-600">Total On-Road</span>
                        <span className="text-2xl font-black text-zinc-900">₹{price.onRoad.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PriceRow = ({ label, value }: { label: string; value: number }) => (
    <div className="flex justify-between items-center">
        <span className="text-sm text-zinc-600">{label}</span>
        <span className="text-sm font-bold text-zinc-900">₹{value.toLocaleString()}</span>
    </div>
);

// Section 4: EMI Calculator
const EMISection = ({ product }: { product: ProductVariant }) => {
    const [downpayment, setDownpayment] = useState(20000);
    const [tenure, setTenure] = useState(36);

    const price = product.price || { onRoad: 85000 };
    const totalOnRoad = price.onRoad || 85000;
    const minDP = totalOnRoad * 0.05;
    const maxDP = totalOnRoad * 0.50;

    const loanAmount = totalOnRoad - downpayment;
    const annualInterest = 0.12 / 12; // 12% annual = 1% monthly
    const emi = Math.round(
        (loanAmount * annualInterest * Math.pow(1 + annualInterest, tenure)) /
        (Math.pow(1 + annualInterest, tenure) - 1)
    );

    return (
        <div className="w-full h-full bg-white overflow-y-auto p-6 pt-20 pb-32">
            <h2 className="text-2xl font-black text-zinc-900 mb-8">EMI Calculator</h2>

            {/* Downpayment Slider */}
            <div className="bg-zinc-50 rounded-2xl p-6 mb-6">
                <div className="flex justify-between mb-4">
                    <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Downpayment</p>
                        <p className="text-xs text-zinc-400">Adjust to fit budget</p>
                    </div>
                    <p className="text-2xl font-black text-zinc-900">₹{downpayment.toLocaleString()}</p>
                </div>

                <input
                    type="range"
                    min={minDP}
                    max={maxDP}
                    step={1000}
                    value={downpayment}
                    onChange={(e) => setDownpayment(parseInt(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-full appearance-none cursor-pointer"
                />

                <div className="flex justify-between mt-2 text-xs text-zinc-500">
                    <span>₹{minDP.toLocaleString()}</span>
                    <span className="font-bold text-zinc-900">{((downpayment / totalOnRoad) * 100).toFixed(0)}%</span>
                    <span>₹{maxDP.toLocaleString()}</span>
                </div>
            </div>

            {/* Tenure Pills */}
            <div className="space-y-3">
                {[24, 36, 48, 60].map((t) => {
                    const tEmi = Math.round(
                        (loanAmount * annualInterest * Math.pow(1 + annualInterest, t)) /
                        (Math.pow(1 + annualInterest, t) - 1)
                    );
                    const isSelected = tenure === t;

                    return (
                        <button
                            key={t}
                            onClick={() => setTenure(t)}
                            className={`w-full p-4 rounded-2xl border-2 transition-all ${isSelected
                                ? 'bg-zinc-900 border-zinc-900'
                                : 'bg-white border-zinc-200'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="text-left">
                                    <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                                        {t} Months
                                    </p>
                                    <p className={`text-xs ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                        Loan Tenure
                                    </p>
                                </div>
                                <p className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                                    ₹{tEmi.toLocaleString()}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Sticky EMI Display */}
            <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 p-6 border-t border-zinc-800">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <p className="text-xs text-zinc-400 uppercase tracking-widest">Monthly EMI</p>
                        <p className="text-3xl font-black text-white">₹{emi.toLocaleString()}/mo</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-zinc-400">Total</p>
                        <p className="text-lg font-bold text-white">₹{(emi * tenure + downpayment).toLocaleString()}</p>
                    </div>
                </div>
                <button className="w-full h-12 bg-white text-zinc-900 rounded-xl font-black text-sm uppercase tracking-wider">
                    Get Instant Quote
                </button>
            </div>
        </div>
    );
};

const AccessoriesSection = ({ product }: { product: ProductVariant }) => {
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);

    // TODO: Fetch accessories from API - for now using mock data
    const accessories = [
        { id: '1', name: 'Crash Guard', brand: 'OEM', price: 2500, image: null, mandatory: false },
        { id: '2', name: 'Mobile Holder', brand: 'Aftermarket', price: 500, image: null, mandatory: false },
        { id: '3', name: 'Seat Cover', brand: 'Premium', price: 1200, image: null, mandatory: false },
        { id: '4', name: 'Helmet', brand: 'STUDDS', price: 1800, image: null, mandatory: true },
        { id: '5', name: 'Tank Pad', brand: 'OEM', price: 800, image: null, mandatory: false },
        { id: '6', name: 'LED Fog Lamps', brand: 'Aftermarket', price: 3500, image: null, mandatory: false },
    ];

    const toggleAccessory = (id: string) => {
        const accessory = accessories.find((a: any) => a.id === id);
        if (accessory?.mandatory) return; // Can't toggle mandatory items

        setSelectedAccessories(prev =>
            prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
        );
    };

    // Calculate selected accessories price
    const selectedPrice = accessories
        .filter((a: any) => selectedAccessories.includes(a.id) || a.mandatory)
        .reduce((sum: number, a: any) => sum + a.price, 0);

    // Sort: selected first, then mandatory
    const sortedAccessories = [...accessories].sort((a: any, b: any) => {
        const aSelected = selectedAccessories.includes(a.id) || a.mandatory;
        const bSelected = selectedAccessories.includes(b.id) || b.mandatory;
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        if (a.mandatory && !b.mandatory) return -1;
        if (!a.mandatory && b.mandatory) return 1;
        return 0;
    });

    return (
        <div className="w-full h-full bg-white overflow-y-auto pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 pt-20 pb-8">
                <h2 className="text-2xl font-black text-white mb-2">Accessories</h2>
                <p className="text-sm text-white/80">Customize your ride</p>
            </div>

            <div className="p-6">
                {/* Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {sortedAccessories.map((item: any) => {
                        const isSelected = selectedAccessories.includes(item.id) || item.mandatory;
                        const isMandatory = item.mandatory;

                        return (
                            <button
                                key={item.id}
                                onClick={() => toggleAccessory(item.id)}
                                disabled={isMandatory}
                                className={`relative p-4 rounded-2xl border-2 transition-all text-left ${isSelected
                                    ? 'bg-amber-50 border-amber-500'
                                    : 'bg-zinc-50 border-zinc-200'
                                    } ${isMandatory ? 'opacity-60' : ''}`}
                            >
                                {/* Checkmark */}
                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected
                                    ? 'bg-amber-500 border-amber-500'
                                    : 'border-zinc-300'
                                    }`}>
                                    {isSelected && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>

                                {/* Image placeholder */}
                                <div className="w-full aspect-square bg-zinc-200 rounded-xl mb-3 flex items-center justify-center">
                                    <span className="text-4xl">🛠️</span>
                                </div>

                                {/* Name */}
                                <h3 className="text-sm font-black text-zinc-900 mb-1 pr-6">{item.name}</h3>

                                {/* Brand tag */}
                                {item.brand && (
                                    <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-zinc-200 text-zinc-600 font-bold uppercase mb-2">
                                        {item.brand}
                                    </span>
                                )}

                                {/* Mandatory badge */}
                                {isMandatory && (
                                    <span className="block text-[8px] px-2 py-0.5 rounded bg-zinc-800 text-white font-bold uppercase mb-2 w-fit">
                                        REQUIRED
                                    </span>
                                )}

                                {/* Price */}
                                <p className={`text-lg font-black ${isSelected ? 'text-amber-600' : 'text-zinc-900'}`}>
                                    ₹{item.price.toLocaleString()}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sticky Bottom Summary */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-6">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Total Accessories</p>
                        <p className="text-2xl font-black text-zinc-900">₹{selectedPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-zinc-500">{selectedAccessories.filter(id =>
                            !accessories.find((a: any) => a.id === id)?.mandatory
                        ).length + accessories.filter((a: any) => a.mandatory).length} items</p>
                        <p className="text-sm text-amber-600 font-bold">Selected</p>
                    </div>
                </div>
                <button className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black text-sm uppercase tracking-wider">
                    Continue
                </button>
            </div>
        </div>
    );
};

const InsuranceSection = ({ product }: { product: any }) => {
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

    // Mock insurance data
    const requiredInsurance = {
        name: 'Comprehensive Insurance',
        price: 5000,
        description: 'Third-party + Own damage cover'
    };

    const addons = [
        { id: '1', name: 'Zero Depreciation', price: 1500, description: 'No depreciation on claims' },
        { id: '2', name: 'Roadside Assistance', price: 800, description: '24/7 breakdown support' },
        { id: '3', name: 'Engine Protection', price: 2000, description: 'Engine & gearbox cover' },
        { id: '4', name: 'Return to Invoice', price: 1200, description: 'Full invoice value on total loss' },
    ];

    const toggleAddon = (id: string) => {
        setSelectedAddons(prev =>
            prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
        );
    };

    const totalPrice = requiredInsurance.price + addons
        .filter(a => selectedAddons.includes(a.id))
        .reduce((sum, a) => sum + a.price, 0);

    return (
        <div className="w-full h-full bg-white overflow-y-auto pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 pt-20 pb-8">
                <h2 className="text-2xl font-black text-white mb-2">Insurance</h2>
                <p className="text-sm text-white/80">Secure your journey</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Required Insurance */}
                <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Required Coverage</p>
                    <div className="bg-zinc-50 rounded-2xl p-4 border-2 border-zinc-200">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                                <span className="text-xl">🛡️</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-zinc-900 mb-1">{requiredInsurance.name}</h3>
                                <p className="text-xs text-zinc-500 mb-2">{requiredInsurance.description}</p>
                                <span className="inline-block px-2 py-0.5 bg-zinc-800 text-white text-[8px] font-bold uppercase rounded">
                                    MANDATORY
                                </span>
                            </div>
                            <p className="text-lg font-black text-zinc-900">₹{requiredInsurance.price.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Add-ons */}
                <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Extra Coverage (Optional)</p>
                    <div className="space-y-3">
                        {addons.map(addon => {
                            const isSelected = selectedAddons.includes(addon.id);

                            return (
                                <button
                                    key={addon.id}
                                    onClick={() => toggleAddon(addon.id)}
                                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${isSelected
                                        ? 'bg-blue-50 border-blue-500'
                                        : 'bg-zinc-50 border-zinc-200'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Toggle */}
                                        <div className={`w-12 h-6 rounded-full relative shrink-0 mt-1 transition-colors ${isSelected ? 'bg-blue-500' : 'bg-zinc-300'
                                            }`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isSelected ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-sm font-black text-zinc-900 mb-1">{addon.name}</h3>
                                            <p className="text-xs text-zinc-500">{addon.description}</p>
                                        </div>

                                        <p className={`text-lg font-black ${isSelected ? 'text-blue-600' : 'text-zinc-900'
                                            }`}>₹{addon.price.toLocaleString()}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Sticky Bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-6">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Total Insurance</p>
                        <p className="text-2xl font-black text-zinc-900">₹{totalPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-zinc-500">Premium</p>
                        <p className="text-sm text-blue-600 font-bold">{selectedAddons.length} add-ons</p>
                    </div>
                </div>
                <button className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-wider">
                    Continue
                </button>
            </div>
        </div>
    );
};

const RegistrationSection = ({ product }: { product: ProductVariant }) => {
    const [selectedType, setSelectedType] = useState<'STATE' | 'BH' | 'COMPANY'>('STATE');

    const basePrice = product.price?.exShowroom || 70000;

    const options = [
        {
            id: 'STATE' as const,
            name: 'State Registration',
            price: Math.round(basePrice * 0.12),
            description: 'Standard RTO charges for your state',
            badge: 'POPULAR',
            badgeColor: 'bg-emerald-500'
        },
        {
            id: 'BH' as const,
            name: 'Bharat Series (BH)',
            price: Math.round(basePrice * 0.08),
            description: 'For frequent interstate travel',
            badge: null,
            badgeColor: ''
        },
        {
            id: 'COMPANY' as const,
            name: 'Company Registration',
            price: Math.round(basePrice * 0.2),
            description: 'Corporate entity registration',
            badge: null,
            badgeColor: ''
        },
    ];

    return (
        <div className="w-full h-full bg-white overflow-y-auto pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-6 pt-20 pb-8">
                <h2 className="text-2xl font-black text-white mb-2">Registration</h2>
                <p className="text-sm text-white/80">Choose your RTO type</p>
            </div>

            <div className="p-6 space-y-4">
                {options.map(option => {
                    const isSelected = selectedType === option.id;

                    return (
                        <button
                            key={option.id}
                            onClick={() => setSelectedType(option.id)}
                            className={`relative w-full p-5 rounded-2xl border-2 transition-all text-left ${isSelected
                                ? 'bg-green-50 border-green-500'
                                : 'bg-zinc-50 border-zinc-200'
                                }`}
                        >
                            {/* Badge */}
                            {option.badge && (
                                <div className={`absolute -top-2 left-4 ${option.badgeColor} text-white text-[8px] font-black uppercase px-2 py-1 rounded`}>
                                    {option.badge}
                                </div>
                            )}

                            <div className="flex items-start gap-4">
                                {/* Radio */}
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${isSelected
                                    ? 'border-green-500 bg-green-500'
                                    : 'border-zinc-300'
                                    }`}>
                                    {isSelected && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-zinc-900 mb-1">{option.name}</h3>
                                    <p className="text-xs text-zinc-500">{option.description}</p>
                                </div>

                                <p className={`text-xl font-black ${isSelected ? 'text-green-600' : 'text-zinc-900'
                                    }`}>₹{option.price.toLocaleString()}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Info Card */}
            <div className="mx-6 mb-24 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-800">
                    <span className="font-black">ℹ️ Note:</span> Registration charges may vary based on your location and vehicle specifications.
                </p>
            </div>

            {/* Sticky Bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-6">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">RTO Charges</p>
                        <p className="text-2xl font-black text-zinc-900">₹{options.find(o => o.id === selectedType)?.price.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-zinc-500">Type</p>
                        <p className="text-sm text-green-600 font-bold">{selectedType}</p>
                    </div>
                </div>
                <button className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-wider">
                    Continue
                </button>
            </div>
        </div>
    );
};
