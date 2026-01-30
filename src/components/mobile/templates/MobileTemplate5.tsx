'use client';

import React from 'react';
import { Menu, ArrowRight } from 'lucide-react';
import Image from 'next/image';

const MagazineHeader = () => {
    return (
        <div className="fixed top-0 left-0 p-6 z-50 mix-blend-difference text-white">
            <Menu size={32} strokeWidth={1} />
        </div>
    );
};

export const MobileTemplate5 = () => {
    return (
        <div className="bg-[#EBEBEB] min-h-screen text-black font-serif overflow-hidden">
            <MagazineHeader />

            {/* Cover Section */}
            <div className="h-screen relative flex flex-col justify-between p-6 pb-12">
                {/* Background Text Layer */}
                <div className="absolute top-20 left-0 right-0 text-center leading-[0.8] opacity-10 pointer-events-none select-none overflow-hidden">
                    <h1 className="text-[25vw] font-black uppercase tracking-tighter scale-y-150">RIDE</h1>
                </div>

                {/* Main Content */}
                <div className="relative z-10 pt-24">
                    <div className="border-t border-black pt-4 mb-2 flex justify-between items-start">
                        <span className="text-xs font-sans font-bold uppercase tracking-widest">Issue 04</span>
                        <span className="text-xs font-sans font-bold uppercase tracking-widest text-right">The <br />Collection</span>
                    </div>
                    <h1 className="text-6xl font-black italic tracking-tighter leading-[0.85] mb-6">
                        THE ART<br />
                        OF SPEED.
                    </h1>
                    <p className="font-sans text-sm max-w-[200px] leading-relaxed">
                        Curated motorcycles for the discerning rider. Experience the raw power of financing done right.
                    </p>
                </div>

                {/* Hero Image occupying middle space */}
                <div className="absolute inset-x-0 bottom-[15%] top-[25%] z-0">
                    <Image
                        src="/images/templates/t3_night.png"
                        alt="Editorial Bike"
                        fill
                        className="object-contain scale-125 hover:scale-130 transition-transform duration-[2s]"
                    />
                </div>

                {/* Bottom CTA */}
                <div className="relative z-10 flex justify-between items-end border-b border-black pb-4">
                    <div>
                        <p className="font-sans text-[10px] font-bold uppercase tracking-widest mb-1">Featured Model</p>
                        <p className="text-2xl font-black italic">HONDA CB300R</p>
                    </div>
                    <button className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 transition-transform">
                        <ArrowRight size={24} />
                    </button>
                </div>
            </div>

            {/* Content "Article" Section */}
            <div className="px-6 py-12 bg-white">
                <div className="flex gap-4 mb-8">
                    <span className="text-4xl font-black font-sans text-[#E11B22]">01</span>
                    <p className="font-sans text-sm leading-relaxed text-zinc-600 pt-2">
                        <strong className="text-black block mb-2">PERFORMANCE MEETS STYLE.</strong>
                        We believe that buying a bike should be as exhilarating as riding one. Our digital showroom brings the dealership to your pocket, minus the hassle.
                    </p>
                </div>

                <div className="aspect-[4/5] bg-zinc-100 mb-8 relative group cursor-pointer">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-sans text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Discover Collection</span>
                    </div>
                    <Image
                        src="/images/templates/t3_night.png"
                        alt="Collection"
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                </div>
            </div>
        </div>
    );
};
