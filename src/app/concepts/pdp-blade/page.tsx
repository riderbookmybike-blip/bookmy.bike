'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
    Zap, Heart, BarChart3, ChevronLeft, ChevronRight,
    Shield, Gauge, Fuel, Info, Check, ArrowRight,
    Star, StarHalf, Plus
} from 'lucide-react';
import Link from 'next/link';
import { BladeHeader } from '@/components/concepts/blade/BladeHeader';
import { BladeFooter } from '@/components/concepts/blade/BladeFooter';
import { FavoritesProvider, useFavorites } from '@/lib/favorites/favoritesContext';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

// Vehicle Data
const VEHICLES = [
    {
        id: 'honda-activa-standard',
        name: 'Activa Standard',
        make: 'Honda',
        category: 'Scooter',
        price: '76,234',
        emi: '2,450',
        rating: 4.8,
        colors: [
            { name: 'Decent Blue', hex: '#1B365D', img: '/images/concepts/blade/activa_blue.png' },
            { name: 'Matte Grey', hex: '#4A4A4A', img: '/images/concepts/blade/activa_grey.png' },
            { name: 'Black', hex: '#000000', img: '/images/concepts/blade/activa_black.png' },
            { name: 'Pearl White', hex: '#F5F5F5', img: '/images/concepts/blade/activa_white.png' },
            { name: 'Rebel Red', hex: '#8B0000', img: '/images/concepts/blade/activa_red.png' }
        ],
        specs: [
            { label: 'Engine', value: '109.51 CC', sub: 'Fan Cooled, 4 Stroke' },
            { label: 'Power', value: '5.73 kW', sub: '@ 8000 rpm' },
            { label: 'Torque', value: '8.84 Nm', sub: '@ 5500 rpm' },
            { label: 'Seat Ht', value: '692 mm', sub: 'Precision Comfort' }
        ]
    },
    {
        id: 'hero-passion-plus',
        name: 'Passion Plus',
        make: 'Hero',
        category: 'Commuter',
        price: '78,451',
        emi: '2,620',
        rating: 4.6,
        colors: [
            { name: 'Sports Blue', hex: '#1E40AF', img: '/images/concepts/blade/passion_blue.png' },
            { name: 'Black Red', hex: '#DC2626', img: '/images/concepts/blade/passion_black_red.png' },
            { name: 'Black Heavy Grey', hex: '#374151', img: '/images/concepts/blade/passion_grey.png' },
            { name: 'Black Nexus Blue', hex: '#1D4ED8', img: '/images/concepts/blade/passion_nexus_blue.png' }
        ],
        specs: [
            { label: 'Engine', value: '97.2 CC', sub: 'Air Cooled, 4 Stroke' },
            { label: 'Power', value: '5.9 kW', sub: '@ 8000 rpm' },
            { label: 'Torque', value: '8.05 Nm', sub: '@ 6000 rpm' },
            { label: 'Seat Ht', value: '790 mm', sub: 'Standard Stance' }
        ]
    },
    {
        id: 'bajaj-ct-110x',
        name: 'CT 110X',
        make: 'Bajaj',
        category: 'Rugged Commuter',
        price: '69,322',
        emi: '2,100',
        rating: 4.7,
        colors: [
            { name: 'Ebony Black Blue', hex: '#1E3A8A', img: '/images/concepts/blade/ct_black_blue.png' },
            { name: 'Ebony Black Red', hex: '#991B1B', img: '/images/concepts/blade/ct_black_red.png' }
        ],
        specs: [
            { label: 'Engine', value: '115.45 CC', sub: '4-Stroke, Single Cyl' },
            { label: 'Power', value: '8.6 PS', sub: '@ 7000 rpm' },
            { label: 'Torque', value: '9.81 Nm', sub: '@ 5000 rpm' },
            { label: 'Ground Cl.', value: '170 mm', sub: 'Tactical Clearance' }
        ]
    }
];

function BladePDPContent() {
    const searchParams = useSearchParams();
    const bikeId = searchParams.get('bike');

    // Find initial index based on bike query param
    const initialIdx = VEHICLES.findIndex(v => v.id === bikeId);

    const [selectedIdx, setSelectedIdx] = useState(initialIdx !== -1 ? initialIdx : 0);
    const [colorIdx, setColorIdx] = useState(0);
    const [userName, setUserName] = useState<string>('Hritik Roshan');
    const { toggleFavorite, isFavorite } = useFavorites();

    const current = VEHICLES[selectedIdx];

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.full_name) {
                setUserName(user.user_metadata.full_name);
            } else if (user?.user_metadata?.name) {
                setUserName(user.user_metadata.name);
            } else {
                const storedName = localStorage.getItem('user_name');
                if (storedName) setUserName(storedName);
            }
        };
        fetchUser();
    }, []);

    const handleNext = () => {
        setSelectedIdx((prev) => (prev + 1) % VEHICLES.length);
        setColorIdx(0);
    };

    const handlePrev = () => {
        setSelectedIdx((prev) => (prev - 1 + VEHICLES.length) % VEHICLES.length);
        setColorIdx(0);
    };

    return (
        <div className="bg-black text-white min-h-screen selection:bg-[#F4B000] selection:text-black font-sans">
            <BladeHeader />

            {/* ════════════ THE ARSENAL HERO ════════════ */}
            <main className="relative pt-24 overflow-hidden">
                {/* Background Slashes */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-2/3 h-screen bg-white/[0.02] skew-x-[-20deg] translate-x-32" />
                    <div className="absolute top-1/2 left-0 w-1/3 h-64 bg-[#F4B000]/5 skew-y-[-5deg] blur-3xl opacity-50" />
                </div>

                <div className="max-w-[1800px] mx-auto px-6 md:px-12 relative z-10">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 xl:gap-24 items-center">

                        {/* LEFT: Visual & Switcher */}
                        <div className="order-2 xl:order-1 relative group">
                            {/* Massive Background Text */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none">
                                <span className="text-[20rem] font-black italic tracking-tighter uppercase whitespace-nowrap">
                                    {current.name.split(' ')[0]}
                                </span>
                            </div>

                            {/* Image Container */}
                            <div className="aspect-[16/10] relative flex items-center justify-center">
                                {current.colors[colorIdx].img ? (
                                    <img
                                        src={current.colors[colorIdx].img}
                                        alt={current.name}
                                        className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(244,176,0,0.2)] transform hover:scale-105 transition-transform duration-1000"
                                    />
                                ) : (
                                    <div className="w-full h-full border border-white/5 bg-white/[0.03] flex items-center justify-center">
                                        <span className="text-white/20 font-black uppercase italic tracking-[0.5em]">Unit Encoded</span>
                                    </div>
                                )}

                                {/* Navigation Arrows */}
                                <div className="absolute inset-y-0 -left-6 flex items-center">
                                    <button onClick={handlePrev} className="w-12 h-12 bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-[#F4B000] hover:text-black transition-all skew-x-[-10deg]">
                                        <ChevronLeft size={24} />
                                    </button>
                                </div>
                                <div className="absolute inset-y-0 -right-6 flex items-center">
                                    <button onClick={handleNext} className="w-12 h-12 bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-[#F4B000] hover:text-black transition-all skew-x-[-10deg]">
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Color Selector */}
                            <div className="mt-12 flex justify-center items-center gap-4">
                                {current.colors.map((c, i) => (
                                    <button
                                        key={c.name}
                                        onClick={() => setColorIdx(i)}
                                        className={`group relative p-1 border transition-all ${colorIdx === i ? 'border-[#F4B000] scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                    >
                                        <div className="w-12 h-6 skew-x-[-15deg]" style={{ backgroundColor: c.hex }} />
                                        <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-[8px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            {c.name}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Content */}
                        <div className="order-1 xl:order-2 space-y-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="px-4 py-1 bg-[#F4B000] text-black text-[10px] font-black uppercase tracking-[0.3em] skew-x-[-15deg]">
                                        {current.make} ARSENAL
                                    </span>
                                    <div className="flex gap-1 text-[#F4B000]/40">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={`w-1 h-1 rotate-45 ${i < Math.floor(current.rating) ? 'bg-[#F4B000]' : 'bg-white/10'}`} />
                                        ))}
                                    </div>
                                </div>
                                <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-none">
                                    {current.name.split(' ')[0]} <br />
                                    <span className="text-[#F4B000]">{current.name.split(' ').slice(1).join(' ')}</span>
                                </h1>
                                <p className="text-xs font-bold text-white/40 uppercase tracking-[0.4em] italic leading-relaxed">
                                    Operational Class: {current.category} | Deployment Status: Available
                                </p>
                            </div>

                            {/* Member Authorization Badge */}
                            <div className="bg-[#111] border border-[#F4B000]/20 p-8 flex items-center justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4B000]/5 -rotate-45 translate-x-16 -translate-y-16" />
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-12 h-12 bg-[#F4B000] flex items-center justify-center text-black">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest italic mb-1">Authorization Clearance</p>
                                        <p className="text-lg font-black uppercase tracking-tight italic text-white">Member: {userName}</p>
                                    </div>
                                </div>
                                <div className="hidden md:block text-right relative z-10">
                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest italic mb-1">Access Protocol</p>
                                    <p className="text-xs font-black text-[#F4B000] uppercase tracking-[0.2em]">Verified Secure</p>
                                </div>
                            </div>

                            {/* Tactical Specs Array */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {current.specs.map((s) => (
                                    <div key={s.label} className="group p-6 bg-white/[0.03] border border-white/5 hover:border-[#F4B000]/30 transition-all">
                                        <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-2 italic group-hover:text-[#F4B000]/60">{s.label}</p>
                                        <p className="text-2xl font-black italic tracking-tighter text-white mb-1">{s.value}</p>
                                        <p className="text-[9px] font-bold text-white/30 lowercase italic tracking-wide">{s.sub}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Price & Action */}
                            <div className="flex flex-col md:flex-row items-center gap-8 pt-6">
                                <div className="w-full md:w-auto p-8 border border-white/10 flex-1 relative overflow-hidden group">
                                    <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-[#F4B000] shadow-[0_0_15px_#F4B000]" />
                                    <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1 italic">Mission Valuation</p>
                                    <div className="flex items-end gap-3">
                                        <span className="text-4xl font-black italic tracking-tighter text-white">₹{current.price}</span>
                                        <span className="text-xs font-bold text-white/20 mb-1 uppercase tracking-widest">On-Road*</span>
                                    </div>
                                </div>

                                <div className="w-full md:w-auto p-8 border border-[#F4B000]/40 flex-1 relative overflow-hidden bg-[#F4B000]/5">
                                    <div className="absolute top-2 right-4 text-[#F4B000]">
                                        <Zap size={14} className="animate-pulse" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase text-[#F4B000]/60 tracking-widest mb-1 italic">Flash Approval Plan</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-black italic tracking-tighter text-[#F4B000]">₹{current.emi}</span>
                                        <span className="text-xs font-bold text-white/40 mb-1 uppercase tracking-widest">/Month</span>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Section */}
                            <div className="flex items-center gap-6">
                                <button className="flex-1 py-6 bg-white text-black text-xs font-black uppercase tracking-[0.4em] skew-x-[-10deg] hover:bg-[#F4B000] transition-all transform active:scale-95">
                                    Initiate Booking
                                </button>
                                <button
                                    onClick={() => toggleFavorite(current.id)}
                                    className={`w-20 h-20 border flex items-center justify-center transition-all skew-x-[-10deg] ${isFavorite(current.id) ? 'bg-[#F4B000] border-[#F4B000] text-black' : 'border-white/10 text-white hover:border-white/40'}`}
                                >
                                    <Heart className={isFavorite(current.id) ? 'fill-current' : ''} size={28} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Decorative Section */}
                <div className="max-w-[1800px] mx-auto px-6 md:px-12 mt-32 pb-24">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/5 pt-12">
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#F4B000] italic underline underline-offset-8 decoration-2">Tactical Features</h4>
                            <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest italic">Equipped with cutting-edge fuel efficiency and reinforced chassis for urban endurance.</p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#F4B000] italic underline underline-offset-8 decoration-2">Maintenance Protocol</h4>
                            <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest italic">Digital tracking for service intervals and performance optimization updates.</p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#F4B000] italic underline underline-offset-8 decoration-2">Safety Arsenal</h4>
                            <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest italic">Advanced braking sensitivity and high-intensity illumination for 24/7 mission capability.</p>
                        </div>
                    </div>
                </div>
            </main>

            <BladeFooter />
        </div>
    );
}

export default function BladePDPPage() {
    return (
        <Suspense fallback={<div className="min-h-screen text-white text-center pt-20">Loading Arsenal...</div>}>
            <FavoritesProvider>
                <BladePDPContent />
            </FavoritesProvider>
        </Suspense>
    );
}
