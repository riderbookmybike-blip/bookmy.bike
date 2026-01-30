'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PDPCarouselProps {
    product: any;
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
const ImageSection = ({ product }: { product: any }) => {
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
const DetailsSection = ({ product }: { product: any }) => (
    <div className="w-full h-full bg-white overflow-y-auto p-6 pt-20">
        <h2 className="text-2xl font-black text-zinc-900 mb-6">Product Details</h2>
        <div className="space-y-4">
            <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Features</p>
                <ul className="space-y-2">
                    {(product.features || ['LED Headlamp', 'Digital Console', 'Disc Brakes']).map((feature: string, idx: number) => (
                        <li key={idx} className="text-sm text-zinc-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
);

// Section 3: Pricing
const PricingSection = ({ product }: { product: any }) => {
    const price = product.price || { onRoad: 85000, exShowroom: 70000, rto: 8000, insurance: 5000, other: 2000 };

    return (
        <div className="w-full h-full bg-zinc-50 overflow-y-auto p-6 pt-20">
            <h2 className="text-2xl font-black text-zinc-900 mb-6">Pricing</h2>

            {/* On-Road Price */}
            <div className="bg-white rounded-2xl p-6 mb-4">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">On-Road Price</p>
                <p className="text-4xl font-black text-zinc-900">₹{(price.onRoad / 100000).toFixed(2)}L</p>
            </div>

            {/* Breakdown */}
            <div className="bg-white rounded-2xl p-6 space-y-3">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Breakdown</p>
                <PriceRow label="Ex-Showroom" value={price.exShowroom} />
                <PriceRow label="RTO" value={price.rto} />
                <PriceRow label="Insurance" value={price.insurance} />
                <PriceRow label="Other Charges" value={price.other} />
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
const EMISection = ({ product }: { product: any }) => {
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

const AccessoriesSection = ({ product }: { product: any }) => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-900 text-2xl font-bold">Accessories Section</p>
    </div>
);

const InsuranceSection = ({ product }: { product: any }) => (
    <div className="w-full h-full flex items-center justify-center bg-white">
        <p className="text-zinc-900 text-2xl font-bold">Insurance Section</p>
    </div>
);

const RegistrationSection = ({ product }: { product: any }) => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-900 text-2xl font-bold">Registration Section</p>
    </div>
);
