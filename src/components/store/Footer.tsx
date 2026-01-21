'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Facebook, Twitter, Linkedin, Instagram, Heart, Newspaper } from 'lucide-react';
import { useBrands } from '@/hooks/useBrands';
import { slugify } from '@/utils/slugs';

export const Footer = () => {
    const { brands } = useBrands();
    return (
        <footer className="bg-white dark:bg-[#0b0d10] border-t border-slate-100 dark:border-white/5 pt-16 pb-10 transition-colors duration-500 overflow-hidden relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />

            <div className="max-w-[1600px] mx-auto px-4 md:px-12 lg:px-20 relative z-10">
                {/* Top Section: Trust & Brand */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
                    <div className="lg:col-span-4 space-y-6">
                        <Logo mode="auto" size={32} className="justify-start" />
                        <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm font-medium italic">
                            Redefining the era of mobility. India&apos;s premier marketplace for the next generation of
                            riders.
                        </p>
                        <div className="flex gap-2">
                            <SocialIcon icon={<Newspaper size={18} />} href="/blog" />
                            <SocialIcon icon={<Instagram size={18} />} href="https://instagram.com" />
                            <SocialIcon icon={<Twitter size={18} />} href="https://twitter.com" />
                            <SocialIcon icon={<Linkedin size={18} />} href="https://linkedin.com" />
                            <SocialIcon icon={<Facebook size={18} />} href="https://facebook.com" />
                        </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-5 gap-6">
                        <div className="space-y-6">
                            <FooterHeading>Collection</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="/store/catalog">All Inventory</FooterLink>
                                <FooterLink href="/store/catalog?category=SCOOTER">Scooters</FooterLink>
                                <FooterLink href="/store/catalog?category=MOTORCYCLE">Motorcycles</FooterLink>
                                <FooterLink href="/store/catalog?category=MOPED">Moped</FooterLink>
                                <FooterLink href="/store/catalog?sort=price_asc">Low to High</FooterLink>
                                <FooterLink href="/store/catalog?sort=price_desc">High to Low</FooterLink>
                                <FooterLink href="/store/catalog?sort=mileage">Best Mileage</FooterLink>
                            </FooterLinkList>
                        </div>

                        <div id="footer-brands" className="space-y-6 scroll-mt-28">
                            <FooterHeading>Brands</FooterHeading>
                            <FooterLinkList>
                                {brands.map(brand => (
                                    <FooterLink key={brand.id} href={`/store/${brand.slug || slugify(brand.name)}`}>
                                        {brand.name}
                                    </FooterLink>
                                ))}
                            </FooterLinkList>
                        </div>

                        <div className="space-y-6">
                            <FooterHeading>Ecosystem</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="#">About</FooterLink>
                                <FooterLink href="/blog">Blog</FooterLink>
                                <FooterLink href="/login">Partners</FooterLink>
                                <FooterLink href="/mediakit">Media Kit</FooterLink>
                                <FooterLink href="#">Careers</FooterLink>
                            </FooterLinkList>
                        </div>

                        <div className="space-y-6">
                            <FooterHeading>Concierge</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="#">Help Center</FooterLink>
                                <FooterLink href="#">RTO Rules</FooterLink>
                                <FooterLink href="#">Insurance</FooterLink>
                                <FooterLink href="#">EMI Config</FooterLink>
                            </FooterLinkList>
                        </div>

                        <div className="space-y-6">
                            <FooterHeading>Legal</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="#">Privacy</FooterLink>
                                <FooterLink href="#">Terms</FooterLink>
                                <FooterLink href="#">Compliance</FooterLink>
                            </FooterLinkList>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Legal & Copyright Addressed */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-100 dark:border-white/5 gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                            © 2026 BookMyBike Technologies. Built for Excellence.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <ViewportDebug />
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Internal Debug Component for Production Verification
const ViewportDebug = () => {
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
    const [mounted, setMounted] = React.useState(false);
    const [time] = React.useState(new Date().toLocaleTimeString());
    const [forceShow, setForceShow] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!mounted) return null;

    const { width, height } = dimensions;
    const screenWidth = typeof window !== 'undefined' ? window.screen.width : 0;
    const screenHeight = typeof window !== 'undefined' ? window.screen.height : 0;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

    // Aspect Ratio Calculation
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const common = gcd(width, height);
    const aspect = `${width / common}:${height / common}`;

    // Improved Mode Logic (Must match DeviceLayout.tsx)
    let mode = 'MOBILE';
    const isTvActual =
        width >= 2000 ||
        (width === 960 && height === 540 && dpr >= 2) ||
        (width === 1280 && height === 720 && dpr >= 2) ||
        (width === 1129 && height === 635);

    if (isTvActual) mode = 'ULTRA-WIDE / TV';
    else if (width >= 1024) mode = 'DESKTOP';
    else if (width >= 768) mode = 'TABLET';

    // Simple Device Info
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const device = ua.includes('Macintosh')
        ? 'MacBook'
        : ua.includes('iPhone')
            ? 'iPhone'
            : ua.includes('Android')
                ? 'Android'
                : 'Device';

    const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'DEV';

    return (
        <div className="group relative cursor-help" onDoubleClick={() => setForceShow(!forceShow)}>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-600 font-medium uppercase tracking-widest hover:text-brand-primary transition-colors select-none">
                <span>Engineered with</span>
                <Heart size={10} className="text-brand-primary fill-brand-primary animate-pulse" />
                <span>in India</span>
            </div>

            <div
                className={`absolute bottom-full right-0 mb-3 w-72 p-3 bg-slate-900/95 text-white text-[10px] font-mono rounded-lg border border-white/10 shadow-xl transition-all pointer-events-none z-50 backdrop-blur-md ${forceShow
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                    }`}
            >
                <div className="space-y-1.5">
                    <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-slate-400">Viewport</span>
                        <span className="font-bold text-brand-primary">
                            {width}x{height} <span className="text-[8px] opacity-60">({aspect})</span>
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-slate-400">Screen</span>
                        <span className="font-bold">
                            {screenWidth}x{screenHeight} <span className="text-[8px] opacity-60">@{dpr}x</span>
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-slate-400">Device/Mode</span>
                        <span className="font-bold">
                            {device} | {mode}
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-slate-400">Build Info</span>
                        <span className="font-mono text-xs">{commitSha.slice(0, 7)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Local Time</span>
                        <span>{time}</span>
                    </div>
                </div>
                <div className="absolute -bottom-1 right-8 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-white/10"></div>
            </div>
        </div>
    );
};

// Sub-components for consistency
const FooterHeading = ({ children }: { children: React.ReactNode }) => (
    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-6">
        {children}
    </h4>
);

const FooterLinkList = ({ children }: { children: React.ReactNode }) => <ul className="space-y-5">{children}</ul>;

const FooterLink = ({
    href,
    children,
    highlight,
}: {
    href: string;
    children: React.ReactNode;
    highlight?: boolean;
}) => (
    <li>
        <Link
            href={href}
            className={`text-xs font-bold transition-colors ${highlight
                    ? 'text-brand-primary dark:text-brand-primary hover:text-yellow-600 dark:hover:text-yellow-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-primary'
                }`}
        >
            {children}
        </Link>
    </li>
);

const SocialIcon = ({ icon, href }: { icon: React.ReactNode; href: string }) => (
    <a
        href={href}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-brand-primary hover:text-black dark:hover:bg-brand-primary dark:hover:text-black transition-all"
    >
        {icon}
    </a>
);
