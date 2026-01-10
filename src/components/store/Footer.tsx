import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ShieldCheck, Award, CreditCard, Facebook, Twitter, Linkedin, Instagram, Youtube, Heart } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-white/10 pt-24 pb-12 transition-colors duration-500">
            <div className="max-w-[1400px] mx-auto px-6">

                {/* Top Section: Trust & Brand */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 mb-24">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center gap-2">
                            {/* Always Blue variant, but in Dark mode it pops against black */}
                            <Logo className="text-slate-900 dark:text-white scale-125 origin-left" variant="blue" showTagline={false} />
                        </div>
                        <p className="text-base text-slate-500 dark:text-slate-400 leading-loose max-w-sm font-medium tracking-wide">
                            BookMyBike is India's first premium two-wheeler procurement platform. We blend technology with automotive passion to deliver an uncompromised buying experience.
                        </p>

                        <div className="flex flex-col gap-4 pt-4">
                            <div className="flex gap-3">
                                <SocialIcon icon={<Instagram size={20} />} href="#" />
                                <SocialIcon icon={<Twitter size={20} />} href="#" />
                                <SocialIcon icon={<Youtube size={20} />} href="#" />
                                <SocialIcon icon={<Linkedin size={20} />} href="#" />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connect With Us</p>
                        </div>
                    </div>

                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-12">
                        <div>
                            <FooterHeading>The Collection</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="/store/catalog?category=SCOOTER">Urban Scooters</FooterLink>
                                <FooterLink href="/store/catalog?category=MOTORCYCLE">Performance Motorcycles</FooterLink>
                                <FooterLink href="/store/catalog?category=ELECTRIC">Electric Future</FooterLink>
                                <FooterLink href="/store/accessories">Riding Gear</FooterLink>
                                <FooterLink href="/store/accessories">Genuine Parts</FooterLink>
                            </FooterLinkList>
                        </div>

                        <div>
                            <FooterHeading>Services</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="#">Instant Finance</FooterLink>
                                <FooterLink href="#">Insurance Claims</FooterLink>
                                <FooterLink href="#">RTO Assistance</FooterLink>
                                <FooterLink href="#">Bike Servicing</FooterLink>
                                <FooterLink href="#">Roadside Assist</FooterLink>
                            </FooterLinkList>
                        </div>

                        <div>
                            <FooterHeading>Company</FooterHeading>
                            <FooterLinkList>
                                <FooterLink href="#">Our Story</FooterLink>
                                <FooterLink href="/members">Members Club</FooterLink>
                                <FooterLink href="/login" highlight>Partner With Us</FooterLink>
                                <FooterLink href="#">Press & Media</FooterLink>
                                <FooterLink href="#">Careers</FooterLink>
                            </FooterLinkList>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Legal & Copyright Addressed */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-slate-200 dark:border-white/5 gap-6">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        © 2026 BookMyBike Technologies. All rights reserved.
                    </p>

                    <div className="flex gap-8">
                        <LegalLink href="#">Privacy Policy</LegalLink>
                        <LegalLink href="#">Terms of Service</LegalLink>
                        <LegalLink href="#">Sitemap</LegalLink>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-full">
                        <span>Engineered in</span>
                        <span className="text-slate-900 dark:text-white">India</span>
                        <div className="w-2 h-2 rounded-full bg-orange-500 ml-1" />
                        <div className="w-2 h-2 rounded-full bg-white ml-[-4px] border border-slate-100 dark:border-slate-800" />
                        <div className="w-2 h-2 rounded-full bg-green-500 ml-[-4px]" />
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

const FooterLink = ({ href, children, highlight }: { href: string, children: React.ReactNode, highlight?: boolean }) => (
    <li>
        <Link href={href} className={`text-xs font-bold transition-colors ${highlight
            ? "text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
            : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white"
            }`}>
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
