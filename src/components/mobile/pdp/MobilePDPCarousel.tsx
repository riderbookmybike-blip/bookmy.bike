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

// Placeholder section components
const ImageSection = ({ product }: { product: any }) => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
        <p className="text-white text-2xl font-bold">Image Section</p>
    </div>
);

const DetailsSection = ({ product }: { product: any }) => (
    <div className="w-full h-full flex items-center justify-center bg-white">
        <p className="text-zinc-900 text-2xl font-bold">Details Section</p>
    </div>
);

const PricingSection = ({ product }: { product: any }) => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-900 text-2xl font-bold">Pricing Section</p>
    </div>
);

const EMISection = ({ product }: { product: any }) => (
    <div className="w-full h-full flex items-center justify-center bg-white">
        <p className="text-zinc-900 text-2xl font-bold">EMI Section</p>
    </div>
);

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
