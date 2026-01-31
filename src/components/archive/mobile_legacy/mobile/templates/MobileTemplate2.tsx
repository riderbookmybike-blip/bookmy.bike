'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Settings, Power, ChevronRight, Fuel, Gauge, Disc } from 'lucide-react';
import Image from 'next/image';

const GarageHeader = () => {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-[#111] border-b border-[#333] pt-12">
            <div className="flex gap-2 items-center">
                <div className="w-8 h-8 bg-[#222] rounded border border-[#444] flex items-center justify-center">
                    <span className="font-mono text-xs text-[#666]">GAR-1</span>
                </div>
                <span className="text-[#888] text-xs font-mono uppercase tracking-widest">Virtual Hangar</span>
            </div>
            <button className="text-[#666] hover:text-white transition-colors">
                <Settings size={20} />
            </button>
        </div>
    );
};

const GarageFooter = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A] border-t border-[#222] pb-8">
            <div className="grid grid-cols-4 divide-x divide-[#222]">
                {['Specs', 'Parts', 'Finance', 'Trade'].map((item) => (
                    <button key={item} className="py-4 text-[10px] text-[#555] font-mono uppercase hover:bg-[#111] hover:text-white transition-colors">
                        {item}
                    </button>
                ))}
            </div>
            <button className="w-full bg-[#E11B22] text-white py-5 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                <Power size={18} /> Ignite Engine
            </button>
        </div>
    );
};

// Mock Data for Garage
const bikes = [
    { name: 'DUKE 390', brand: 'KTM', power: '43 BHP', type: 'Streetfighter' },
    { name: 'APACHE RR310', brand: 'TVS', power: '34 BHP', type: 'Sport' },
    { name: 'HIMALAYAN', brand: 'RE', power: '24 BHP', type: 'Adventure' },
];

export const MobileTemplate2 = () => {
    return (
        <div className="bg-[#050505] min-h-screen text-zinc-300 font-mono selection:bg-red-900 pb-32">
            <GarageHeader />

            {/* Main Stage */}
            <div className="pt-32 px-6">
                <div className="flex items-center gap-2 mb-8 opacity-50">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-red-600">Live Access</span>
                </div>

                {/* Horizontal Scroll Area */}
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 -mx-6 px-6 scrollbar-hide">
                    {bikes.map((bike, index) => (
                        <div key={index} className="flex-shrink-0 w-[85vw] snap-center relative aspect-[3/4] bg-[#111] rounded border border-[#222] overflow-hidden group">
                            {/* Industrial Background Grid */}
                            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_16px]" />

                            {/* Bike Content */}
                            <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-4xl font-black text-[#333] group-hover:text-white transition-colors duration-500 italic uppercase leading-none">
                                        {bike.brand}<br />{bike.name}
                                    </h2>
                                    <div className="w-12 h-12 rounded border border-[#333] flex items-center justify-center">
                                        <ChevronRight size={20} className="text-[#444]" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-3 bg-[#080808] border border-[#222]">
                                            <Fuel size={14} className="text-[#444] mb-2" />
                                            <p className="text-xs font-bold text-white">{bike.power}</p>
                                        </div>
                                        <div className="flex-1 p-3 bg-[#080808] border border-[#222]">
                                            <Gauge size={14} className="text-[#444] mb-2" />
                                            <p className="text-xs font-bold text-white">0-60: 3s</p>
                                        </div>
                                        <div className="flex-1 p-3 bg-[#080808] border border-[#222]">
                                            <Disc size={14} className="text-[#444] mb-2" />
                                            <p className="text-xs font-bold text-white">ABS</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-[#555] uppercase tracking-wider">{bike.type} Class // Stock: Available</p>
                                </div>
                            </div>

                            {/* Place holder for actual image logic */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] opacity-80 group-hover:scale-105 transition-transform duration-500">
                                <Image src="/images/templates/t3_night.png" alt={bike.name} width={400} height={300} className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Tech Specs */}
                <div className="border border-[#222] p-6 bg-[#0A0A0A]">
                    <h3 className="text-xs font-bold uppercase text-[#444] mb-4">Diagnostics</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-[#666]">SYSTEM STATUS</span>
                            <span className="text-green-500">OPTIMAL</span>
                        </div>
                        <div className="w-full h-0.5 bg-[#222] rounded-full overflow-hidden">
                            <div className="w-[80%] h-full bg-red-900" />
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-[#666]">MARKET SYNC</span>
                            <span className="text-[#888]">CONNECTED</span>
                        </div>
                    </div>
                </div>
            </div>

            <GarageFooter />
        </div>
    );
};
