'use client';

import React from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    ArrowRight,
    Heart,
    Share2,
    Shield,
    Zap,
    Fuel,
    Gauge,
    Settings,
    Star,
    ChevronRight,
    Calculator,
    Check,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

/**
 * Yamaha R15M V4 - Product Detail Page
 * Actual specifications from Yamaha Motor India
 */

const BRAND_GOLD = '#F4B000';

// Actual R15M Specifications from Yamaha Motor India
const R15M_DATA = {
    brand: 'Yamaha',
    model: 'R15M',
    variant: 'V4',
    tagline: 'We R Racing Perfection',
    exShowroomPrice: 194412, // Delhi
    onRoadPrice: 215000, // Approx
    colors: [
        { name: 'Racing Blue', hex: '#1a365d' },
        { name: 'Metallic Grey', hex: '#4a5568' },
        { name: 'Dark Knight', hex: '#1a202c' },
    ],
    images: {
        hero: '/images/products/yamaha-r15m-hero.jpg',
        product: '/images/products/yamaha-r15m-product.png',
    },
    specifications: {
        engine: {
            type: 'Liquid Cooled, 4-Stroke, SOHC, 4-Valve',
            displacement: '155 cc',
            maxPower: '18.4 PS @ 10,000 rpm',
            maxTorque: '14.2 Nm @ 7,500 rpm',
            compression: '11.6:1',
            bore: '58.0 mm',
            stroke: '58.7 mm',
            fuelSystem: 'Fuel Injection',
            ignition: 'TCI (Transistor Controlled Ignition)',
        },
        transmission: {
            clutch: 'Wet, Multiple-Disc, Assist & Slipper',
            gearbox: '6-Speed',
            finalDrive: 'Chain',
        },
        chassis: {
            frame: 'Deltabox',
            frontSuspension: 'Telescopic Fork (USD)',
            rearSuspension: 'Linked Type Monocross',
            frontBrake: '282mm Disc',
            rearBrake: '220mm Disc',
            frontTyre: '100/80-17',
            rearTyre: '140/70-17',
        },
        dimensions: {
            length: '1,990 mm',
            width: '725 mm',
            height: '1,135 mm',
            wheelbase: '1,325 mm',
            groundClearance: '170 mm',
            seatHeight: '815 mm',
            kerbWeight: '142 kg',
            fuelCapacity: '11 L',
        },
        performance: {
            topSpeed: '140 km/h',
            mileage: '45 kmpl (Certified)',
            acceleration: '0-60 in 3.2s',
        },
    },
    features: [
        'Variable Valve Actuation (VVA)',
        'Quick Shifter (Upshift)',
        'Traction Control System (TCS)',
        'Dual Channel ABS',
        'LED Headlight with DRL',
        'Negative LCD Instrument Cluster',
        'Y-Connect App Connectivity',
        'Assist & Slipper Clutch',
    ],
    emiOptions: [
        { tenure: 12, emi: 17850, interest: '9.5%' },
        { tenure: 24, emi: 9350, interest: '10.5%' },
        { tenure: 36, emi: 6550, interest: '11.5%' },
        { tenure: 48, emi: 5150, interest: '12.0%' },
    ],
};

export default function YamahaR15MPage() {
    const [selectedColor, setSelectedColor] = React.useState(0);
    const [activeTab, setActiveTab] = React.useState<'specs' | 'features' | 'emi'>('specs');

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-[#0b0d10] text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0d10]/85 backdrop-blur-xl border-b border-white/5">
                <div className="page-container py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/store/catalog"
                            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={16} />
                            <span className="hidden sm:inline">Back to Catalog</span>
                        </Link>
                        <div className="h-4 w-px bg-white/10" />
                        <Logo mode="dark" size={28} variant="full" />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <Heart size={20} />
                        </button>
                        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-20">
                <div className="absolute inset-0 z-0">
                    <img
                        src={R15M_DATA.images.hero}
                        alt={`${R15M_DATA.brand} ${R15M_DATA.model}`}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d10] via-[#0b0d10]/85 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d10]/85 via-transparent to-transparent" />
                </div>

                <div className="page-container relative z-10 py-24 md:py-32">
                    <div className="max-w-2xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-400 mb-4">
                            {R15M_DATA.brand}
                        </p>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-4">{R15M_DATA.model}</h1>
                        <p className="text-xl text-white/60 italic mb-8">{R15M_DATA.tagline}</p>

                        {/* Quick Specs */}
                        <div className="grid grid-cols-3 gap-6 mb-10">
                            <div>
                                <p className="text-3xl font-black">{R15M_DATA.specifications.engine.displacement}</p>
                                <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Engine</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black">
                                    {R15M_DATA.specifications.engine.maxPower.split('@')[0].trim()}
                                </p>
                                <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Power</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black">{R15M_DATA.specifications.performance.topSpeed}</p>
                                <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Top Speed</p>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="mb-8">
                            <p className="text-sm text-white/40 uppercase tracking-wider mb-2">
                                Ex-Showroom Price (Delhi)
                            </p>
                            <p className="text-4xl md:text-5xl font-black" style={{ color: BRAND_GOLD }}>
                                {formatPrice(R15M_DATA.exShowroomPrice)}
                            </p>
                            <p className="text-sm text-white/40 mt-2">
                                On-Road: {formatPrice(R15M_DATA.onRoadPrice)} (approx)
                            </p>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="#emi-calculator"
                                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all group"
                                style={{ backgroundColor: BRAND_GOLD, color: '#000' }}
                            >
                                <Calculator size={18} />
                                Check EMI Options
                            </Link>
                            <button className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-white/20 rounded-2xl font-bold text-sm uppercase tracking-wide hover:bg-white/5 transition-all">
                                Book Now
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Color Selector */}
            <section className="py-12 bg-[#0b0d10] border-y border-white/5">
                <div className="page-container">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Available Colors</p>
                            <div className="flex gap-4">
                                {R15M_DATA.colors.map((color, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedColor(i)}
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === i ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-white/60 mt-3">{R15M_DATA.colors[selectedColor].name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={16} fill="#F4B000" color="#F4B000" />
                            ))}
                            <span className="text-sm text-white/60 ml-2">4.8/5 (324 reviews)</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Specifications Tabs */}
            <section className="py-16 bg-[#0b0d10]">
                <div className="page-container">
                    {/* Tab Headers */}
                    <div className="flex gap-4 mb-12 overflow-x-auto pb-4">
                        {[
                            { id: 'specs', label: 'Specifications' },
                            { id: 'features', label: 'Features' },
                            { id: 'emi', label: 'EMI Calculator' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-white text-black'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Specifications Content */}
                    {activeTab === 'specs' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Engine */}
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                                <div className="flex items-center gap-3 mb-6">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${BRAND_GOLD}20`, color: BRAND_GOLD }}
                                    >
                                        <Settings size={20} />
                                    </div>
                                    <h3 className="font-bold">Engine</h3>
                                </div>
                                <div className="space-y-4">
                                    {Object.entries(R15M_DATA.specifications.engine).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-sm">
                                            <span className="text-white/40 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <span className="text-white font-medium">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Transmission */}
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                                <div className="flex items-center gap-3 mb-6">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${BRAND_GOLD}20`, color: BRAND_GOLD }}
                                    >
                                        <Zap size={20} />
                                    </div>
                                    <h3 className="font-bold">Transmission</h3>
                                </div>
                                <div className="space-y-4">
                                    {Object.entries(R15M_DATA.specifications.transmission).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-sm">
                                            <span className="text-white/40 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <span className="text-white font-medium">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Dimensions */}
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                                <div className="flex items-center gap-3 mb-6">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${BRAND_GOLD}20`, color: BRAND_GOLD }}
                                    >
                                        <Gauge size={20} />
                                    </div>
                                    <h3 className="font-bold">Dimensions</h3>
                                </div>
                                <div className="space-y-4">
                                    {Object.entries(R15M_DATA.specifications.dimensions).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-sm">
                                            <span className="text-white/40 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <span className="text-white font-medium">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Performance */}
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                                <div className="flex items-center gap-3 mb-6">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${BRAND_GOLD}20`, color: BRAND_GOLD }}
                                    >
                                        <Fuel size={20} />
                                    </div>
                                    <h3 className="font-bold">Performance</h3>
                                </div>
                                <div className="space-y-4">
                                    {Object.entries(R15M_DATA.specifications.performance).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-sm">
                                            <span className="text-white/40 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <span className="text-white font-medium">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Features Content */}
                    {activeTab === 'features' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {R15M_DATA.features.map((feature, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5"
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: BRAND_GOLD }}
                                    >
                                        <Check size={16} className="text-black" />
                                    </div>
                                    <span className="font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* EMI Content */}
                    {activeTab === 'emi' && (
                        <div id="emi-calculator">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {R15M_DATA.emiOptions.map((option, i) => (
                                    <div
                                        key={i}
                                        className={`p-6 rounded-3xl border transition-all cursor-pointer hover:scale-105 ${i === 1 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5'}`}
                                    >
                                        {i === 1 && (
                                            <span
                                                className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block"
                                                style={{ backgroundColor: BRAND_GOLD, color: '#000' }}
                                            >
                                                Popular
                                            </span>
                                        )}
                                        <p className="text-4xl font-black mb-2" style={{ color: BRAND_GOLD }}>
                                            {formatPrice(option.emi)}
                                            <span className="text-lg text-white/40">/mo</span>
                                        </p>
                                        <p className="text-sm text-white/60 mb-4">
                                            {option.tenure} months @ {option.interest}
                                        </p>
                                        <button className="w-full py-3 border border-white/20 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-white/5 transition-all">
                                            Apply Now
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-white/30 mt-8 text-center">
                                *EMI calculated on loan amount of {formatPrice(R15M_DATA.onRoadPrice - 20000)} with down
                                payment of ₹20,000. Actual EMI may vary based on credit score and bank policies.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Trust Footer */}
            <section className="py-12 bg-[#0b0d10] border-t border-white/5">
                <div className="page-container">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
                        <div className="flex items-center gap-3">
                            <Shield size={20} style={{ color: BRAND_GOLD }} />
                            <span className="text-sm text-white/60">Lowest EMI Guarantee</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Zap size={20} style={{ color: BRAND_GOLD }} />
                            <span className="text-sm text-white/60">4hr Doorstep Delivery</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Check size={20} style={{ color: BRAND_GOLD }} />
                            <span className="text-sm text-white/60">No Hidden Charges</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
