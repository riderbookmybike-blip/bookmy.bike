import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Facebook, Twitter, Linkedin, Instagram, Heart, Newspaper } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="bg-white dark:bg-[#020617] border-t border-slate-100 dark:border-white/5 pt-24 pb-12 transition-colors duration-500 overflow-hidden relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />

            <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-20 relative z-10">
                {/* Top Section: Trust & Brand */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
                    <div className="lg:col-span-4 space-y-8">
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

                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-5 gap-8">
                        <div className="space-y-8">
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

                        <div className="space-y-8">
                            <FooterHeading>Makes</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="/store/honda">Honda</FooterLink>
                                <FooterLink href="/store/tvs">TVS</FooterLink>
                                <FooterLink href="/store/royal-enfield">Royal Enfield</FooterLink>
                                <FooterLink href="/store/hero">Hero MotoCorp</FooterLink>
                                <FooterLink href="/store/bajaj">Bajaj Auto</FooterLink>
                                <FooterLink href="/store/ktm">KTM</FooterLink>
                                <FooterLink href="/store/suzuki">Suzuki</FooterLink>
                                <FooterLink href="/store/yamaha">Yamaha</FooterLink>
                            </FooterLinkList>
                        </div>

                        <div className="space-y-8">
                            <FooterHeading>Ecosystem</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="#">About</FooterLink>
                                <FooterLink href="/blog">Blog</FooterLink>
                                <FooterLink href="/login">Partners</FooterLink>
                                <FooterLink href="/mediakit">Media Kit</FooterLink>
                                <FooterLink href="#">Careers</FooterLink>
                            </FooterLinkList>
                        </div>

                        <div className="space-y-8">
                            <FooterHeading>Concierge</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="#">Help Center</FooterLink>
                                <FooterLink href="#">RTO Rules</FooterLink>
                                <FooterLink href="#">Insurance</FooterLink>
                                <FooterLink href="#">EMI Config</FooterLink>
                            </FooterLinkList>
                        </div>

                        <div className="space-y-8">
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
                <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-slate-100 dark:border-white/5 gap-8">
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

    React.useEffect(() => {
        setMounted(true);
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!mounted) return null;

    const { width } = dimensions;
    const mode = width >= 1536 ? 'TV (4K/2K)' : width >= 1024 ? 'DESKTOP' : width >= 768 ? 'TABLET' : 'MOBILE';
    const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'DEV';

    return (
        <div className="group relative cursor-help">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-600 font-medium uppercase tracking-widest hover:text-brand-primary transition-colors">
                <span>Engineered with</span>
                <Heart size={10} className="text-brand-primary fill-brand-primary animate-pulse" />
                <span>in India</span>
            </div>

            <div className="absolute bottom-full right-0 mb-3 w-64 p-3 bg-slate-900/95 text-white text-[10px] font-mono rounded-lg border border-white/10 shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none z-50 backdrop-blur-md">
                <div className="space-y-1.5">
                    <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-slate-400">Viewport</span>
                        <span className="font-bold text-brand-primary">
                            {width}x{dimensions.height}
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-slate-400">Mode</span>
                        <span className="font-bold">{mode}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-slate-400">Build</span>
                        <span className="font-mono text-xs">{commitSha.slice(0, 7)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Loaded</span>
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
            className={`text-xs font-bold transition-colors ${
                highlight
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
