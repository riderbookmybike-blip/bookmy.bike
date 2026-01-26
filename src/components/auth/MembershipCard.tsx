'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ICON_PATHS } from '@/components/brand/paths';

interface MembershipCardProps {
    name?: string;
    id?: string;
    isActive?: boolean;
    validity?: string;
    compact?: boolean;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({
    name = 'RAKESH KUMAR',
    id = 'XP3-84E-JH7',
    isActive = false,
    validity = '13/03/3030',
    compact = false,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);

    // Mouse tracking for 3D tilt
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['15deg', '-15deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-15deg', '15deg']);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <div
            className={`perspective-2000 ${compact ? 'py-2' : 'py-20'} w-full flex items-center justify-center pointer-events-auto`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                ref={cardRef}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                initial={{ rotateZ: -2 }}
                animate={{
                    scale: isActive ? 0.8 : 1,
                    opacity: isActive ? 0.4 : 1,
                    filter: isActive ? 'blur(10px)' : 'blur(0px)',
                    rotateZ: -2,
                }}
                whileHover={{
                    boxShadow: '0 0 100px 30px rgba(244, 176, 0, 0.3)',
                    scale: 1.05,
                }}
                transition={{
                    scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.8 },
                }}
                className={`relative w-full ${compact ? 'max-w-[620px]' : 'max-w-[540px]'} aspect-[1.586/1] rounded-[24px] shadow-[0_45px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden group cursor-pointer transition-shadow duration-500 border border-white/10`}
            >
                {/* BLACK METAL FINISH */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#121212] to-[#050505]" />

                {/* CARBON FIBRE TEXTURE */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                {/* LUXURY EDGE LIGHTING */}
                <div className="absolute inset-0 rounded-[24px] border-[1px] border-white/5 pointer-events-none" />
                <div className="absolute inset-[1px] rounded-[23px] border-[1px] border-[#F4B000]/10 pointer-events-none" />

                {/* DYNAMIC AMBIENT GLOW */}
                <motion.div
                    style={{
                        background:
                            'radial-gradient(circle at var(--x) var(--y), rgba(244, 176, 0, 0.2) 0%, transparent 60%)',
                    }}
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                />

                {/* CONTENT LAYER */}
                <div
                    className="relative h-full w-full p-8 md:p-12 flex flex-col justify-between"
                    style={{ transform: 'translateZ(60px)' }}
                >
                    {/* TOP SECTION: OFFICIAL LOGO & BRANDING */}
                    <div className="flex justify-between items-start">
                        {/* LEFT: THE ELITE CIRCLE BRANDING */}
                        <div className="mt-2 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-[#F4B000]" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#F4B000]">
                                    The Elite Circle
                                </span>
                            </div>
                            <div className="w-8 h-[1px] bg-gradient-to-r from-[#F4B000]/50 to-transparent" />
                        </div>

                        {/* RIGHT: HIGH-DETAIL BMB LOGO */}
                        <div className="w-20 h-20 transform -translate-y-4">
                            <svg
                                viewBox="0 0 80 109"
                                fill="none"
                                className="w-full h-full drop-shadow-[0_10px_20px_rgba(244,176,0,0.4)]"
                            >
                                {ICON_PATHS.PRIMARY.map((d, i) => (
                                    <path key={i} d={d} fill="#F4B000" className="mix-blend-normal" />
                                ))}
                            </svg>
                        </div>
                    </div>

                    {/* QUANTUM CHIP - HIGH-FIDELITY VECTOR */}
                    <div className="w-16 h-12 relative rounded-[4px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                        <svg viewBox="0 0 56 44" fill="none" className="w-full h-full block">
                            <defs>
                                <linearGradient
                                    id="chip-base"
                                    x1="0"
                                    y1="0"
                                    x2="56"
                                    y2="44"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop offset="0%" stopColor="#FCD34D" />
                                    <stop offset="40%" stopColor="#F59E0B" />
                                    <stop offset="70%" stopColor="#D97706" />
                                    <stop offset="100%" stopColor="#B45309" />
                                </linearGradient>
                                <linearGradient
                                    id="chip-highlight"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="44"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Base Fill */}
                            <rect width="56" height="44" fill="url(#chip-base)" />
                            {/* Grid Contacts */}
                            <rect
                                x="4"
                                y="8"
                                width="18"
                                height="28"
                                rx="2"
                                fill="none"
                                stroke="#78350f"
                                strokeWidth="1.5"
                            />
                            <rect
                                x="34"
                                y="8"
                                width="18"
                                height="28"
                                rx="2"
                                fill="none"
                                stroke="#78350f"
                                strokeWidth="1.5"
                            />
                            <line x1="10" y1="8" x2="10" y2="36" stroke="#92400e" strokeWidth="0.5" />
                            <line x1="16" y1="8" x2="16" y2="36" stroke="#92400e" strokeWidth="0.5" />
                            <line x1="40" y1="8" x2="40" y2="36" stroke="#92400e" strokeWidth="0.5" />
                            <line x1="46" y1="8" x2="46" y2="36" stroke="#92400e" strokeWidth="0.5" />
                            <line x1="4" y1="16" x2="22" y2="16" stroke="#92400e" strokeWidth="0.5" />
                            <line x1="4" y1="22" x2="22" y2="22" stroke="#92400e" strokeWidth="0.5" />
                            <line x1="4" y1="28" x2="22" y2="28" stroke="#92400e" strokeWidth="0.5" />
                            <line x1="34" y1="16" x2="52" y2="16" stroke="#92400e" strokeWidth="0.5" />
                            <line x1="34" y1="22" x2="52" y2="22" stroke="#92400e" strokeWidth="0.5" />
                            <line x1="34" y1="28" x2="52" y2="28" stroke="#92400e" strokeWidth="0.5" />
                            {/* Central Bridge */}
                            <rect
                                x="22"
                                y="18"
                                width="12"
                                height="8"
                                rx="1"
                                fill="none"
                                stroke="#78350f"
                                strokeWidth="1"
                            />
                            {/* Sheen */}
                            <rect width="56" height="44" fill="url(#chip-highlight)" />
                        </svg>
                    </div>

                    <div className="space-y-4 border-t border-white/5 pt-6">
                        <div className="flex justify-between items-center">
                            <div className="font-mono text-xl md:text-2xl tracking-[0.2em] font-medium text-white group-hover:text-[#F4B000] transition-colors duration-500 drop-shadow-lg">
                                {id}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/40">
                                    EXP
                                </span>
                                <div className="text-sm font-mono tracking-widest text-[#F4B000]">{validity}</div>
                            </div>
                        </div>

                        {/* MEMBER NAME */}
                        <div className="flex justify-between items-end">
                            <div className="text-lg font-bold tracking-[0.1em] text-white/90 uppercase italic">
                                {name}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-tighter text-white/10 italic">
                                Official <span className="text-[#F4B000]/30">Privilege</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* REAR ATMOSPHERIC BLOOM */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            </motion.div>
        </div>
    );
};
