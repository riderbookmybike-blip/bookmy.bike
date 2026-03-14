'use client';

// Refined Modern Footer - Optimized SSR

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    Plus,
    Minus,
    MapPin,
    MessageCircle,
    Bike,
    LayoutGrid,
    Tags,
    Gauge,
    Wallet,
    ShieldCheck,
    FileText,
    HelpCircle,
    Info,
    BookOpen,
    Compass,
    Image as ImageIcon,
    Shield,
    Lock,
    Scale,
    Link2,
    Calculator,
    GitCompareArrows,
    Navigation,
    Fuel,
    Bike as BikeIcon,
    Star,
    Download,
    UserPlus,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { OCircleLogo } from '@/components/common/OCircleLogo';

export const ModernFooter = () => {
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [openNested, setOpenNested] = useState<string | null>(null);

    const toggleSection = (title: string) => setOpenSection(openSection === title ? null : title);
    const toggleNested = (brand: string) => setOpenNested(openNested === brand ? null : brand);

    const footerSections = [
        {
            title: 'Inventory',
            links: [
                {
                    label: 'All Inventory',
                    href: '/store/catalog',
                    icon: <LayoutGrid size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
                {
                    label: 'Scooters',
                    href: '/store/catalog?category=SCOOTER',
                    icon: <Bike size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
                {
                    label: 'Motorcycles',
                    href: '/store/catalog?category=MOTORCYCLE',
                    icon: <Bike size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
                {
                    label: 'Lowest Price',
                    href: '/store/catalog?sort=price_asc',
                    icon: <Tags size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
                {
                    label: 'Highest Mileage',
                    href: '/store/catalog?sort=mileage',
                    icon: <Gauge size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
            ],
        },
        {
            title: 'Brands',
            nested: [
                {
                    brand: 'Honda',
                    icon: <ShieldCheck size={14} className="text-white/40 group-hover:text-brand-primary" />,
                    links: [
                        { label: 'Activa 6G', href: '/store/honda/activa-6g' },
                        { label: 'Activa 125', href: '/store/honda/activa-125' },
                        { label: 'Dio 125', href: '/store/honda/dio-125' },
                        { label: 'Shine 125', href: '/store/honda/shine-125' },
                        { label: 'SP 125', href: '/store/honda/sp-125' },
                    ],
                },
                {
                    brand: 'TVS',
                    icon: <ShieldCheck size={14} className="text-white/40 group-hover:text-brand-primary" />,
                    links: [
                        { label: 'Jupiter 110', href: '/store/tvs/jupiter' },
                        { label: 'Ntorq 125', href: '/store/tvs/ntorq' },
                        { label: 'Raider 125', href: '/store/tvs/raider' },
                        { label: 'Apache RTR', href: '/store/tvs/apache-rtr-160' },
                    ],
                },
                {
                    brand: 'Hero',
                    icon: <ShieldCheck size={14} className="text-white/40 group-hover:text-brand-primary" />,
                    links: [
                        { label: 'Splendor+', href: '/store/hero/splendor-plus' },
                        { label: 'Xtreme 125R', href: '/store/hero/xtreme-125r' },
                        { label: 'Destini 125', href: '/store/hero/destini-125' },
                    ],
                },

                {
                    brand: 'Suzuki',
                    icon: <ShieldCheck size={14} className="text-white/40 group-hover:text-brand-primary" />,
                    links: [
                        { label: 'Access 125', href: '/store/suzuki/access-125' },
                        { label: 'Burgman St', href: '/store/suzuki/burgman-street' },
                        { label: 'Avenis 125', href: '/store/suzuki/avenis' },
                        { label: 'Gixxer SF', href: '/store/suzuki/gixxer-sf' },
                    ],
                },
                {
                    brand: 'Yamaha',
                    icon: <ShieldCheck size={14} className="text-white/40 group-hover:text-brand-primary" />,
                    links: [
                        { label: 'R15 V4', href: '/store/yamaha/r15' },
                        { label: 'MT-15 V2', href: '/store/yamaha/mt-15' },
                        { label: 'RayZR 125', href: '/store/yamaha/ray-zr' },
                        { label: 'Fascino 125', href: '/store/yamaha/fascino' },
                    ],
                },
            ],
        },
        {
            title: 'Support',
            links: [
                {
                    label: 'Useful Apps',
                    href: '/store/apps',
                    icon: <Download size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
                {
                    label: 'Track your RC',
                    href: 'https://vahan.parivahan.gov.in/vahanservice/vahan/ui/usermgmt/login.xhtml',
                    icon: <Info size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
                {
                    label: 'Team Onboarding',
                    href: '/welcome',
                    icon: <UserPlus size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
            ],
        },

        {
            title: 'Company',
            links: [
                {
                    label: 'About Us',
                    href: '/about',
                    icon: <Info size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
                {
                    label: 'Our Blog',
                    href: '/blog',
                    icon: <BookOpen size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
                {
                    label: "O' Circle",
                    href: '/store/ocircle',
                    icon: <Compass size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
                {
                    label: 'Media Kit',
                    href: '/mediakit',
                    icon: <ImageIcon size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
                {
                    label: 'Safety',
                    href: '#',
                    icon: <Shield size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
                {
                    label: 'Privacy Policy',
                    href: '/privacy',
                    icon: <Lock size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
                {
                    label: 'Terms of Service',
                    href: '#',
                    icon: <Scale size={14} className="text-white/40 group-hover:text-brand-primary" />,
                },
            ],
        },
        {
            title: 'Serving Now',
            links: [
                {
                    label: 'Mumbai',
                    href: '/store/catalog',
                    icon: <MapPin size={12} className="text-emerald-500/60" />,
                },
                {
                    label: 'Pune',
                    href: '/store/catalog',
                    icon: <MapPin size={12} className="text-emerald-500/60" />,
                },
                {
                    label: 'Thane',
                    href: '/store/catalog',
                    icon: <MapPin size={12} className="text-emerald-500/60" />,
                },
                {
                    label: 'Kalyan',
                    href: '/store/catalog',
                    icon: <MapPin size={12} className="text-emerald-500/60" />,
                },
                {
                    label: 'Palghar',
                    href: '/store/catalog',
                    icon: <MapPin size={12} className="text-emerald-500/60" />,
                },
                {
                    label: 'Navi Mumbai',
                    href: '/store/catalog',
                    icon: <MapPin size={12} className="text-emerald-500/60" />,
                },
                {
                    label: 'Panvel',
                    href: '/store/catalog',
                    icon: <MapPin size={12} className="text-emerald-500/60" />,
                },
            ],
        },
        {
            title: 'Connect',
            links: [
                {
                    label: 'WhatsApp',
                    href: 'https://wa.me/917447403491',
                    icon: <MessageCircle size={14} style={{ color: '#25D366' }} />,
                    forceWhite: true,
                },
                {
                    label: 'Instagram',
                    href: 'https://www.instagram.com/bookmy.bike/',
                    icon: <Instagram size={14} style={{ color: '#E4405F' }} />,
                    forceWhite: true,
                },
                {
                    label: 'Twitter / X',
                    href: 'https://twitter.com/bookmybike',
                    icon: <Twitter size={14} style={{ color: '#1DA1F2' }} />,
                    forceWhite: true,
                },
                {
                    label: 'Facebook',
                    href: 'https://www.facebook.com/rider.bookmybike',
                    icon: <Facebook size={14} style={{ color: '#1877F2' }} />,
                    forceWhite: true,
                },
                {
                    label: 'LinkedIn',
                    href: 'https://www.linkedin.com/company/bookmybike',
                    icon: <Linkedin size={14} style={{ color: '#0A66C2' }} />,
                    forceWhite: true,
                },
            ],
        },
    ];

    return (
        <footer
            className="flex flex-col justify-between selection:bg-brand-primary/20 relative text-white lg:flex-grow bg-[#0a0904] lg:min-h-[calc(100vh-var(--header-h,80px))] pb-[60px] lg:pb-0"
            style={{
                scrollMarginTop: 'var(--header-h, 80px)',
            }}
        >
            {/* 1. Dynamic Mesh Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
                <div className="absolute -top-[20%] -left-[10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.05)_0%,transparent_60%)]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Ambient Background Glow removed */}

            {/* 2. Main Navigation Block (6 Column Cards) */}
            <div className="flex-1 flex flex-col justify-center py-5 lg:py-10 relative z-10">
                <div className="page-container w-full">
                    {/* Redesigned Minimalist Intro Section */}
                    <div className="mb-4 lg:mb-8 flex flex-col items-center text-center gap-4 lg:gap-6">
                        <div className="px-5 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-[0_0_20px_rgba(255,215,0,0.05)] flex items-center gap-3">
                            <OCircleLogo size={12} color="#FFD700" strokeWidth={14} />
                            <span className="text-[10px] font-bold tracking-[0.4em] text-brand-primary">
                                Powered by The O&apos; Circle
                            </span>
                        </div>
                        <h2 className="text-4xl lg:text-7xl font-light tracking-tighter text-white leading-[0.9]">
                            India&apos;s{' '}
                            <span className="text-brand-primary font-black drop-shadow-[0_0_20px_rgba(255,215,0,0.15)]">
                                Smartest
                            </span>{' '}
                            <br />
                            <span className="text-brand-primary font-black tracking-tighter italic drop-shadow-[0_0_30px_rgba(255,215,0,0.2)]">
                                Motorcycle
                            </span>{' '}
                            Marketplace.
                        </h2>
                        <div className="text-[12px] font-bold tracking-[0.2em] text-white/70 text-center lg:whitespace-nowrap">
                            Everything You Need To Discover, Compare & Book Your Next Ride.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 lg:gap-6 items-stretch">
                        {footerSections.map((section, idx) => {
                            const isOpen = openSection === section.title;

                            return (
                                <div
                                    key={section.title}
                                    className="flex flex-col rounded-[24px] lg:rounded-[32px] bg-white/[0.02] border border-[#FFD700]/50 hover:bg-white/[0.04] hover:border-[#FFD700]/80 transition-all duration-300 overflow-hidden group/card shadow-2xl shadow-black/80 relative"
                                >
                                    {/* Card Inner Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/[0.02] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <button
                                        onClick={() => toggleSection(section.title)}
                                        className="w-full flex items-center justify-between p-3 lg:p-7 lg:pb-4 lg:cursor-default text-left group"
                                    >
                                        <div className="flex flex-col gap-1 lg:gap-3">
                                            <span className="text-[13px] font-bold tracking-[0.2em] text-white/90 group-hover/card:text-white group-hover:text-brand-primary transition-colors uppercase">
                                                {section.title}
                                            </span>
                                        </div>
                                        <div className="lg:hidden w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50">
                                            {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                                        </div>
                                    </button>

                                    {/* Desktop Content */}
                                    <div className="hidden lg:block px-8 pb-8">
                                        <ul className="flex flex-col gap-5 group/list">
                                            {section.links?.map((link: any, i) => {
                                                const colorClasses: Record<string, string> = {
                                                    emerald: 'text-emerald-500 hover:text-emerald-400',
                                                    rose: 'text-rose-500 hover:text-rose-400',
                                                    sky: 'text-sky-400 hover:text-sky-300',
                                                    blue: 'text-blue-600 hover:text-blue-500',
                                                    indigo: 'text-indigo-600 hover:text-indigo-500',
                                                    default: 'text-white hover:opacity-80 group-hover/list:opacity-30',
                                                };

                                                const isForceWhite = link.forceWhite;
                                                const hoverClass = isForceWhite
                                                    ? 'text-white hover:opacity-80 transition-opacity'
                                                    : link.color
                                                      ? colorClasses[link.color]
                                                      : colorClasses.default;

                                                return (
                                                    <li key={i}>
                                                        {'onClick' in link ? (
                                                            <button
                                                                type="button"
                                                                onClick={link.onClick}
                                                                className={`flex items-center gap-3 text-[12px] font-semibold tracking-wide transition-all duration-300 ${hoverClass}`}
                                                            >
                                                                {link.icon && (
                                                                    <span className="shrink-0">{link.icon}</span>
                                                                )}
                                                                <span>{link.label}</span>
                                                            </button>
                                                        ) : (
                                                            <Link
                                                                href={link.href}
                                                                className={`flex items-center gap-3 text-[12px] font-semibold tracking-wide transition-all duration-300 ${hoverClass}`}
                                                            >
                                                                {link.icon && (
                                                                    <span className="shrink-0">{link.icon}</span>
                                                                )}
                                                                <span>{link.label}</span>
                                                            </Link>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                            {section.nested?.map((brandObj, i) => (
                                                <li key={i} className="flex flex-col gap-3">
                                                    <button
                                                        onClick={() => toggleNested(brandObj.brand)}
                                                        className="text-left text-[12px] font-bold tracking-wide text-white hover:text-brand-primary flex items-center justify-between group/nested transition-colors w-full"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {brandObj.icon}
                                                            <span>{brandObj.brand}</span>
                                                        </div>
                                                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center group-hover/nested:bg-white/10 transition-colors pointer-events-none">
                                                            {openNested === brandObj.brand ? (
                                                                <Minus size={10} />
                                                            ) : (
                                                                <Plus size={10} />
                                                            )}
                                                        </div>
                                                    </button>
                                                    {openNested === brandObj.brand && (
                                                        <ul className="pl-3 flex flex-col gap-3 mt-1 border-l border-white/10">
                                                            {brandObj.links.map(bLink => (
                                                                <li key={bLink.label}>
                                                                    <Link
                                                                        href={bLink.href}
                                                                        className="text-[10px] font-semibold tracking-wide text-white hover:text-brand-primary transition-colors"
                                                                    >
                                                                        {bLink.label}
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Mobile Content */}
                                    {isOpen && (
                                        <div className="lg:hidden">
                                            <ul className="px-5 pb-4 flex flex-col gap-3">
                                                {section.links?.map((link: any, i) => (
                                                    <li key={i}>
                                                        {'onClick' in link ? (
                                                            <button
                                                                type="button"
                                                                onClick={link.onClick}
                                                                className="flex items-center gap-3 text-xs font-semibold text-white/70 active:text-brand-primary"
                                                            >
                                                                {link.icon && (
                                                                    <span className="shrink-0">{link.icon}</span>
                                                                )}
                                                                <span>{link.label}</span>
                                                            </button>
                                                        ) : (
                                                            <Link
                                                                href={link.href}
                                                                className="flex items-center gap-3 text-xs font-semibold text-white/70 active:text-brand-primary"
                                                            >
                                                                {link.icon && (
                                                                    <span className="shrink-0">{link.icon}</span>
                                                                )}
                                                                <span>{link.label}</span>
                                                            </Link>
                                                        )}
                                                    </li>
                                                ))}
                                                {section.nested?.map((brandObj, i) => (
                                                    <li key={i} className="flex flex-col gap-4">
                                                        <button
                                                            onClick={() => toggleNested(brandObj.brand)}
                                                            className="text-left text-[11px] font-bold tracking-wide text-white hover:text-brand-primary flex items-center justify-between group w-full"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {brandObj.icon}
                                                                <span>{brandObj.brand}</span>
                                                            </div>
                                                            {openNested === brandObj.brand ? (
                                                                <Minus size={12} />
                                                            ) : (
                                                                <Plus size={12} />
                                                            )}
                                                        </button>

                                                        {openNested === brandObj.brand && (
                                                            <ul className="pl-3 flex flex-col gap-4 mt-1 border-l border-white/10">
                                                                {brandObj.links.map(bLink => (
                                                                    <li key={bLink.label}>
                                                                        <Link
                                                                            href={bLink.href}
                                                                            className="text-[10px] font-semibold tracking-wide text-white hover:text-brand-primary"
                                                                        >
                                                                            {bLink.label}
                                                                        </Link>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 2. Unified Legal & Social Rail */}
            <div className="py-6 lg:py-14 relative z-10 bg-[#0a0904]">
                <div className="page-container flex flex-col items-center gap-4 lg:gap-10">
                    <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-12">
                        {/* Legal Cluster - Logo + Copyright + Links */}
                        <div className="flex flex-col md:flex-row items-center gap-8 lg:gap-16">
                            <div className="flex flex-col items-center lg:items-start gap-3">
                                <Link href="/" className="inline-block group relative">
                                    <Logo
                                        size={30}
                                        variant="full"
                                        customColors={{ icon: '#FFD700', bookmy: '#FFFFFF', bike: '#FFD700' }}
                                        className="opacity-100 group-hover:scale-105 transition-all duration-300"
                                    />
                                </Link>
                                <p className="text-[10px] font-bold tracking-[0.2em] text-white/80">© 2011-2026</p>
                            </div>
                        </div>

                        {/* Credit Cluster - Positioned at bottom with high visibility and safe margin */}
                        <div className="flex flex-col items-center lg:items-end gap-1">
                            <div className="flex items-center gap-2 group transition-all duration-300">
                                <OCircleLogo
                                    size={30}
                                    color="#7EB4E2"
                                    strokeWidth={16}
                                    className="group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="text-[24px] font-bold tracking-[-0.03em] flex items-center">
                                    <span className="text-[#7EB4E2]">O&apos;</span>
                                    <span className="text-white">Circle</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider text-white/70 opacity-80">
                                Powered by
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
