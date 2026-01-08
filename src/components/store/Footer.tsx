import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ShieldCheck, Award, CreditCard, Facebook, Twitter, Linkedin, Instagram, Youtube, Heart } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 pt-16 pb-12 transition-colors duration-300">
            <div className="max-w-[1400px] mx-auto px-6">

                {/* Top Section: Trust & Brand */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Logo className="text-slate-900 dark:text-white" variant="blue" showTagline={false} />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs font-medium">
                            India's most trusted two-wheeler marketplace. We simplify buying with verified dealers, instant finance, and doorstep delivery.
                        </p>
                        <div className="flex gap-4">
                            <SocialIcon icon={<Facebook size={18} />} href="#" />
                            <SocialIcon icon={<Twitter size={18} />} href="#" />
                            <SocialIcon icon={<Instagram size={18} />} href="#" />
                            <SocialIcon icon={<Linkedin size={18} />} href="#" />
                            <SocialIcon icon={<Youtube size={18} />} href="#" />
                        </div>
                    </div>

                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <FooterHeading>Shop</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="/store/catalog?category=SCOOTER">Scooters</FooterLink>
                                <FooterLink href="/store/catalog?category=MOTORCYCLE">Motorcycles</FooterLink>
                                <FooterLink href="/store/catalog?category=MOPED">Mopeds</FooterLink>
                                <FooterLink href="/store/catalog?category=ELECTRIC">Electric Bikes</FooterLink>
                                <FooterLink href="/store/accessories">Helmets & Accessories</FooterLink>
                            </FooterLinkList>
                        </div>

                        <div>
                            <FooterHeading>Company</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="#">About Us</FooterLink>
                                <FooterLink href="/members">Members Club</FooterLink>
                                <FooterLink href="/login">Partner with Us</FooterLink>
                                <FooterLink href="#">Careers</FooterLink>
                                <FooterLink href="#">Press & Media</FooterLink>
                                <FooterLink href="#">Privacy Policy</FooterLink>
                                <FooterLink href="#">Terms of Service</FooterLink>
                            </FooterLinkList>
                        </div>

                        <div>
                            <FooterHeading>Support</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="#">Help Center</FooterLink>
                                <FooterLink href="#">Track Order</FooterLink>
                                <FooterLink href="#">Contact Support</FooterLink>
                                <FooterLink href="#">Cancellation & Returns</FooterLink>
                                <FooterLink href="#">Buying Guide</FooterLink>
                            </FooterLinkList>
                        </div>

                        <div>
                            <FooterHeading>Resources</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="#">RTO Rules</FooterLink>
                                <FooterLink href="#">Traffic Challan</FooterLink>
                                <FooterLink href="#">Bike Insurance</FooterLink>
                                <FooterLink href="#">EMI Calculator</FooterLink>
                                <FooterLink href="#">Electric Vehicle Subsidy</FooterLink>
                            </FooterLinkList>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Legal & Copyright Addressed */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200 dark:border-white/5 gap-6">
                    <p className="text-xs text-slate-500 font-bold">
                        © 2026 BookMyBike Technologies Pvt. Ltd. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-600 font-medium">
                        <span>Made with</span>
                        <Heart size={10} className="text-red-500 fill-red-500" />
                        <span>in India</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Sub-components for consistency
const FooterHeading = ({ children }: { children: React.ReactNode }) => (
    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-6">
        {children}
    </h4>
);

const FooterLinkList = ({ children }: { children: React.ReactNode }) => (
    <ul className="space-y-3">
        {children}
    </ul>
);

const FooterLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <li>
        <Link href={href} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors">
            {children}
        </Link>
    </li>
);

const SocialIcon = ({ icon, href }: { icon: React.ReactNode, href: string }) => (
    <a href={href} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all">
        {icon}
    </a>
);

const TrustBadge = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
        <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
            {icon}
        </div>
        <div>
            <h5 className="text-sm font-black text-slate-900 dark:text-slate-200 mb-1">{title}</h5>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
        </div>
    </div>
);

const LegalLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link href={href} className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors">
        {children}
    </Link>
);
