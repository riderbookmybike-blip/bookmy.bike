"use client";

import React from 'react';
import { Logo } from '@/components/brand/Logo';
import Image from 'next/image';

const MOCKUP_DATA = [
    {
        title: "Executive Office (Gold Embossed)",
        bg: "/Users/rathoreajitmsingh/.gemini/antigravity/brain/cd78b524-ae4a-4dc3-9244-d183e663ff56/bg_office_wall_empty_1768066081000.png",
        monochrome: "gold" as const,
        size: 80,
        containerClass: "justify-center items-center pb-24",
        logoStyle: { filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))", transform: "perspective(1000px) rotateX(10deg)" }
    },
    {
        title: "Premium Lifestyle (White Stitching)",
        bg: "/Users/rathoreajitmsingh/.gemini/antigravity/brain/cd78b524-ae4a-4dc3-9244-d183e663ff56/bg_lifestyle_cap_empty_1768066100326.png",
        monochrome: "white" as const,
        size: 40,
        containerClass: "justify-center items-center pt-4 pr-4",
        logoStyle: { filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))", transform: "rotate(-2deg)" }
    },
    {
        title: "Tech Accessory (Matte Black)",
        bg: "/Users/rathoreajitmsingh/.gemini/antigravity/brain/cd78b524-ae4a-4dc3-9244-d183e663ff56/bg_lifestyle_cover_empty_1768066116687.png",
        monochrome: "black" as const,
        size: 50,
        containerClass: "justify-center items-center pb-4",
        logoStyle: { opacity: 0.8, filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.1))" }
    }
];

export default function BrandingPage() {
    return (
        <div className="min-h-screen bg-black text-white p-12 space-y-24">
            <header className="max-w-4xl mx-auto space-y-4 text-center">
                <h1 className="text-5xl font-bold tracking-tight">Brand Asset Showcase</h1>
                <p className="text-gray-400 text-xl font-light">
                    Real React components. Exact brand assets. Expert-level optical alignment.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-24 max-w-6xl mx-auto">
                {MOCKUP_DATA.map((mock, idx) => (
                    <div key={idx} className="space-y-8 group">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-semibold text-white/90">{mock.title}</h2>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-400 border border-white/5 uppercase tracking-widest">
                                    Actual Component
                                </span>
                            </div>
                        </div>

                        <div className="relative aspect-[16/10] rounded-3xl overflow-hidden border border-white/10 bg-gray-900 shadow-2xl">
                            {/* Background Image */}
                            <img
                                src={mock.bg}
                                alt={mock.title}
                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                            />

                            {/* Overlayed Real Component */}
                            <div className={`absolute inset-0 flex ${mock.containerClass}`}>
                                <Logo
                                    monochrome={mock.monochrome}
                                    size={mock.size}
                                    className="scale-100"
                                    style={mock.logoStyle}
                                />
                            </div>

                            {/* Lighting FX Overlay */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                        </div>
                    </div>
                ))}
            </div>

            <footer className="max-w-4xl mx-auto pt-24 pb-12 text-center border-t border-white/10">
                <p className="text-gray-500 font-mono text-sm tracking-widest uppercase">
                    Verification Complete • Built with BookMyBike Design System
                </p>
            </footer>
        </div>
    );
}
