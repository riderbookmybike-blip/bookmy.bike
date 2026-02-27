'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { OCircleMembershipCard } from '@/components/auth/OCircleMembershipCard';
import { Zap, Shield, Target } from 'lucide-react';
import { useI18n } from '@/components/providers/I18nProvider';

export function EliteCircle() {
    const [activeStep, setActiveStep] = useState(0);
    const [hasMounted, setHasMounted] = useState(false);
    const { t } = useI18n();

    React.useEffect(() => {
        setHasMounted(true);
    }, []);

    const benefits = [
        {
            step: '01',
            title: t('Zero Downpayment'),
            subtitle: t('INSTANT OWNERSHIP'),
            desc: t(
                'Acquire your machine with zero capital upfront. Leverage our institutional partnerships for 100% on-road financing.'
            ),
            icon: <Shield className="w-8 h-8 md:w-12 md:h-12" />,
            cardData: {
                name: 'RAKESH KUMAR',
                id: 'XJD-Y84-K8R',
                validity: '31/12/2026',
            },
        },
        {
            step: '02',
            title: t('Zero Processing Fee'),
            subtitle: t('EFFICIENCY LAYER'),
            desc: t(
                'Eliminate all administrative friction. No hidden processing fees, no management surcharges. Pure value transfer.'
            ),
            icon: <Target className="w-8 h-8 md:w-12 md:h-12" />,
            cardData: {
                name: 'SARAH JANE',
                id: 'TR7-P9Q-W2M',
                validity: '15/06/2027',
            },
        },
        {
            step: '03',
            title: t('Zero Documentation'),
            subtitle: t('DIGITAL ONBOARDING'),
            desc: t(
                'Fully paperless execution via sovereign digital identity. Verified and authorized in under 60 seconds.'
            ),
            icon: <Zap className="w-8 h-8 md:w-12 md:h-12" />,
            cardData: {
                name: 'VIKRAM SETH',
                id: 'H5K-L3N-9P1',
                validity: '22/09/2026',
            },
        },
    ];

    return (
        <section
            id="o-circle"
            className="relative min-h-screen lg:h-screen ebook-section bg-white flex flex-col items-center justify-center overflow-hidden transition-colors duration-1000"
        >
            {/* VIBRANT ATMOSPHERIC BACKGROUND */}
            <div className="absolute inset-0 z-0 pointer-events-none transition-colors duration-1000">
                <div className="absolute inset-0 bg-white opacity-100 transition-colors duration-1000" />
                {/* Standardized 'Bottom-Up' Ruby Soft Tint (Light Theme) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[80%] bg-[radial-gradient(circle_at_50%_100%,rgba(153,27,27,0.06),transparent_75%)] transition-all duration-1000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-black/5 transition-colors duration-1000" />
            </div>

            <div
                className="relative z-10 w-full max-w-[1440px] px-6 mx-auto flex flex-col justify-center items-center py-20 lg:py-0"
                style={{ minHeight: 'calc(100vh - var(--header-h, 0px))' }}
            >
                <div className="grid grid-cols-12 gap-8 lg:gap-16 items-center w-full">
                    {/* Left Column: Vertical Identity */}
                    <div className="col-span-12 lg:col-span-4 space-y-8 relative z-30 mb-12 lg:mb-0 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-4 justify-center lg:justify-start">
                                <div className="h-px w-10 bg-[#F4B000]/40" />
                                <h2 className="text-[#F4B000]/80 font-black uppercase tracking-[0.5em] text-[10px]">
                                    {t('The Privilege Tier')}
                                </h2>
                            </div>
                            <h1 className="text-5xl md:text-7xl xl:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] text-slate-900 transition-colors">
                                {t("THE O'")}
                                <br />
                                <span className="text-emerald-600">{t('CIRCLE.')}</span>
                            </h1>
                            <div className="space-y-4 max-w-sm mx-auto lg:mx-0">
                                <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed transition-colors">
                                    {t('Exclusive financial engineering for the modern rider.')}
                                </p>
                                <div className="h-px w-24 bg-slate-200 transition-colors mx-auto lg:mx-0" />
                                <p className="text-sm font-bold text-slate-900 tracking-widest uppercase italic transition-colors">
                                    {t('Ownership, accelerated.')}
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Monolith Tiers */}
                    <div className="col-span-12 lg:col-span-8 lg:h-[75vh] flex flex-col lg:flex-row gap-5 w-full min-h-[700px] lg:min-h-0">
                        {hasMounted &&
                            benefits.map((item, i) => (
                                <motion.div
                                    key={i}
                                    layout
                                    onMouseEnter={() => {
                                        if (typeof window !== 'undefined' && window.innerWidth > 1024) {
                                            setActiveStep(i);
                                        }
                                    }}
                                    onClick={() => setActiveStep(i)}
                                    className={`relative rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden cursor-pointer border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                                        activeStep === i
                                            ? 'flex-[12] lg:flex-[5] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1),0_0_80px_rgba(0,0,0,0.05)] border-slate-200 ring-1 ring-black/5'
                                            : 'flex-[2] lg:flex-[1] bg-slate-50 border-slate-200 text-zinc-500 hover:bg-slate-100'
                                    }`}
                                >
                                    {/* INTERNAL CONTENT */}
                                    <div className="absolute inset-0 p-6 lg:p-10 flex flex-col overflow-hidden">
                                        {/* Header Info */}
                                        <div
                                            className={`flex items-start w-full transition-all duration-500 ${activeStep === i ? 'justify-between' : 'justify-center opacity-40'}`}
                                        >
                                            <div className={`${activeStep === i ? 'text-[#F4B000]' : 'text-zinc-600'}`}>
                                                {item.icon}
                                            </div>
                                            {activeStep === i && (
                                                <span className="text-2xl font-black tracking-[0.2em] text-black">
                                                    {item.step}
                                                </span>
                                            )}
                                        </div>

                                        {/* Vertical Placeholder for Inactive */}
                                        {activeStep !== i && (
                                            <div className="flex-1 relative">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:-rotate-90 whitespace-nowrap">
                                                    <span className="text-2xl lg:text-4xl font-black uppercase italic tracking-tighter text-slate-900/40">
                                                        {item.title}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* EXPANDED CONTENT: VERTICAL HIERARCHY */}
                                        {activeStep === i && (
                                            <div className="flex-1 flex flex-col mt-4">
                                                {/* TOP: FULL SIZE CARD */}
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                                    className="flex-1 flex items-center justify-center -mt-4 lg:-mt-8"
                                                >
                                                    <div className="w-full drop-shadow-[0_40px_80px_rgba(0,0,0,0.7)] group">
                                                        <OCircleMembershipCard
                                                            memberName={item.cardData.name}
                                                            memberCode={item.cardData.id}
                                                            validity={item.cardData.validity}
                                                            sizePreset="showcase"
                                                        />
                                                    </div>
                                                </motion.div>

                                                {/* BOTTOM: TEXT CONTENT */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.4, duration: 0.8 }}
                                                    className="mt-auto space-y-4 text-center max-w-2xl mx-auto"
                                                >
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">
                                                            {item.subtitle}
                                                        </p>
                                                        <h3 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-black">
                                                            {item.title}
                                                        </h3>
                                                    </div>
                                                    <p className="text-base font-medium text-zinc-600 max-w-xl mx-auto leading-relaxed">
                                                        {item.desc}
                                                    </p>
                                                    <div className="pt-4 flex items-center justify-center gap-4 text-[#F4B000] font-black uppercase tracking-[0.3em] text-[8px]">
                                                        <div className="h-px flex-1 bg-zinc-200" />
                                                        {t('Verified Authentication Protocol')}
                                                        <div className="h-px flex-1 bg-zinc-200" />
                                                    </div>
                                                </motion.div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
