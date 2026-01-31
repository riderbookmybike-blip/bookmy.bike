'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Share2, Heart, MapPin, Zap, Info, ShieldCheck, ChevronDown, ChevronRight, Star, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobilePDPProps {
    make: string;
    model: string;
    variant: string;
}

// Reusable Components specific to this new design

const SpecRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between py-3 border-b border-white/5 last:border-0">
        <span className="text-zinc-500 text-sm font-medium">{label}</span>
        <span className="text-zinc-200 text-sm font-bold text-right">{value}</span>
    </div>
);

const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
    <h3 className="text-lg font-black uppercase italic mb-4 flex items-center gap-2 text-white">
        {Icon && <Icon size={18} className="text-[#F4B000]" />} {title}
    </h3>
);

export const MobilePDP = ({ make, model, variant }: MobilePDPProps) => {
    const router = useRouter();
    const [activeColor, setActiveColor] = useState(0);
    const [showFullSpecs, setShowFullSpecs] = useState(false);

    // Rich Mock Data - Would come from API
    const product = {
        name: decodeURIComponent(model).replace(/-/g, ' ').toUpperCase(),
        make: decodeURIComponent(make).toUpperCase(),
        price: '₹1,24,000',
        emi: '₹2,499',
        colors: [
            { name: 'Matte Axis Grey', hex: '#4A4A4A', image: '/images/templates/t3_night.png' },
            { name: 'Pearl Precious White', hex: '#F0F0F0', image: '/images/templates/t3_day.png' },
            { name: 'Decent Blue', hex: '#2C3E50', image: '/images/templates/t3_night.png' },
        ],
        specs: {
            engine: [
                { label: 'Displacement', value: '109.51 cc' },
                { label: 'Max Power', value: '7.79 PS @ 8000 rpm' },
                { label: 'Max Torque', value: '8.79 Nm @ 5250 rpm' },
                { label: 'Fuel System', value: 'PGM-FI' },
                { label: 'StartingMethod', value: 'Kick & Self' },
            ],
            dimension: [
                { label: 'Length', value: '1833 mm' },
                { label: 'Width', value: '697 mm' },
                { label: 'Height', value: '1156 mm' },
                { label: 'Ground Clearance', value: '162 mm' },
                { label: 'Kerb Weight', value: '106 kg' },
            ],
            brakes: [
                { label: 'Brake Front', value: 'Drum 130mm' },
                { label: 'Brake Rear', value: 'Drum 130mm' },
                { label: 'Brake System', value: 'CBS' },
            ]
        },
        features: [
            'Silent Start with ACG', 'Engine Start/Stop Switch', 'eSP Technology', 'LED DC Headlamp', 'Double Lid External Fuel Fill'
        ],
        reviews: {
            rating: 4.8,
            count: 2450,
            featured: [
                { user: 'Rahul S.', comment: 'Best mileage in current traffic conditions. Suspension is buttery smooth.', rating: 5 },
                { user: 'Priya M.', comment: 'Love the external fuel filling. Very convenient.', rating: 4 }
            ]
        }
    };

    return (
        <div className="bg-black min-h-screen text-white pb-32 font-sans selection:bg-[#F4B000] selection:text-black">
            {/* Custom Header */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black via-black/50 to-transparent pointer-events-none transition-all duration-300">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 pointer-events-auto active:scale-95 text-white hover:bg-white/10"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex gap-3 pointer-events-auto">
                    <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 text-white hover:bg-white/10">
                        <Heart size={20} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 text-white hover:bg-white/10">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Immersive Product Showcase */}
            <div className="relative h-[65vh] w-full bg-zinc-900 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeColor}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={product.colors[activeColor].image}
                            alt={product.colors[activeColor].name}
                            fill
                            className="object-cover"
                            priority
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Gradient Mesh Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />

                {/* Product Title Floating */}
                <div className="absolute bottom-6 left-4 right-4 z-20">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="space-y-1"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-[#F4B000] text-black text-[10px] font-black uppercase rounded tracking-wider">
                                {product.make}
                            </span>
                            <div className="flex items-center px-2 py-0.5 bg-green-900/40 border border-green-500/30 rounded backdrop-blur-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                                <span className="text-[10px] font-bold text-green-400 uppercase">Available in 2h</span>
                            </div>
                        </div>

                        <h1 className="text-5xl font-black italic uppercase leading-[0.85] tracking-tight">{product.name}</h1>

                        <div className="flex items-center justify-between mt-4">
                            <div>
                                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-0.5">On-Road Price</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-white tracking-tight">{product.price}</span>
                                    <span className="text-sm text-zinc-500 line-through">₹1.38L</span>
                                </div>
                            </div>

                            {/* Color Selector Bubbles */}
                            <div className="flex gap-2 p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                                {product.colors.map((color, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveColor(idx)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${idx === activeColor ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        style={{ backgroundColor: color.hex }}
                                        aria-label={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scrollable Details Content */}
            <div className="px-5 py-8 space-y-10 bg-black relative z-10 -mt-4 rounded-t-3xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,1)]">

                {/* Finance / EMI Card */}
                <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-1">Standard EMI Plan</h3>
                                <p className="text-3xl font-black text-[#F4B000]">{product.emi}<span className="text-sm font-bold text-zinc-500 ml-1">/mo</span></p>
                            </div>
                            <button className="text-xs font-bold bg-white/5 px-3 py-1.5 rounded border border-white/10 hover:bg-white/10 transition-colors">
                                View Plans
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">Down Payment</span>
                                <span className="font-bold">₹11,000</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#F4B000] h-full w-[10%]" />
                            </div>
                            <p className="text-[10px] text-zinc-500 italic">*Subject to credit approval. Zero downpayment available for eligible customers.</p>
                        </div>
                    </div>
                </div>

                {/* Tech Specs (Detailed) */}
                <div>
                    <SectionHeader title="Technical Specs" icon={Zap} />

                    <div className="space-y-1">
                        {/* Always visible specs */}
                        {product.specs.engine.map((spec, i) => (
                            <SpecRow key={i} label={spec.label} value={spec.value} />
                        ))}

                        {/* Expandable specs */}
                        <AnimatePresence>
                            {showFullSpecs && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-1 space-y-1">
                                        <div className="py-2 text-xs font-black text-[#F4B000] uppercase tracking-widest mt-4">Dimensions</div>
                                        {product.specs.dimension.map((spec, i) => (
                                            <SpecRow key={i} label={spec.label} value={spec.value} />
                                        ))}

                                        <div className="py-2 text-xs font-black text-[#F4B000] uppercase tracking-widest mt-4">Brakes & Tyres</div>
                                        {product.specs.brakes.map((spec, i) => (
                                            <SpecRow key={i} label={spec.label} value={spec.value} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={() => setShowFullSpecs(!showFullSpecs)}
                            className="w-full py-3 mt-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                        >
                            {showFullSpecs ? 'Show Less' : 'View Full Specs'} <ChevronDown size={14} className={`transition-transform ${showFullSpecs ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Key Features (Grid) */}
                <div>
                    <SectionHeader title="Key Features" icon={Star} />
                    <div className="grid grid-cols-2 gap-3">
                        {product.features.map((feature, i) => (
                            <div key={i} className="bg-zinc-900 border border-white/5 p-3 rounded-lg flex items-start gap-2">
                                <span className="bg-[#F4B000]/20 p-1 rounded-full shrink-0 mt-0.5">
                                    <Zap size={10} className="text-[#F4B000]" />
                                </span>
                                <span className="text-xs font-medium text-zinc-300 leading-tight">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reviews Summary */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <SectionHeader title="Owner Reviews" icon={Star} />
                        <div className="flex items-center gap-1">
                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-lg font-bold">{product.reviews.rating}</span>
                            <span className="text-xs text-zinc-500">({product.reviews.count})</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {product.reviews.featured.map((review, i) => (
                            <div key={i} className="border-b border-white/5 last:border-0 pb-4 last:pb-0">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-zinc-200">{review.user}</span>
                                    <div className="flex gap-0.5">
                                        {[...Array(review.rating)].map((_, i) => <Star key={i} size={10} className="text-yellow-500 fill-yellow-500" />)}
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-400 italic">"{review.comment}"</p>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 py-2 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
                        Read All Reviews
                    </button>
                </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-16 left-0 right-0 p-4 bg-black/90 backdrop-blur-xl border-t border-white/10 z-40">
                <div className="flex gap-3">
                    <button className="flex-1 h-12 bg-zinc-800 rounded-xl font-bold text-white uppercase text-xs tracking-widest border border-white/10 hover:bg-zinc-700 active:scale-95 transition-all">
                        Test Ride
                    </button>
                    <button className="flex-[2] h-12 bg-[#F4B000] rounded-xl font-black text-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(244,176,0,0.3)] hover:shadow-[0_0_30px_rgba(244,176,0,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2">
                        Get Best Quote <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
