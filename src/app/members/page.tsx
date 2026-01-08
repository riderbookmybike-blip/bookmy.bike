'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Star, Zap, ChevronRight, Moon, Sun } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Footer } from '@/components/store/Footer';
import LoginSidebar from '@/components/auth/LoginSidebar';
import { useState } from 'react';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';

export default function MembersHome() {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [loginVariant, setLoginVariant] = useState<'TERMINAL' | 'RETAIL'>('TERMINAL');

    const openLogin = (variant: 'TERMINAL' | 'RETAIL') => {
        setLoginVariant(variant);
        setIsLoginOpen(true);
    };
    return (
        <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white selection:bg-blue-500/30 font-sans transition-colors duration-300">
            <MarketplaceHeader onLoginClick={() => openLogin('RETAIL')} />

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-start text-center px-4 overflow-hidden pt-16">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/10 dark:bg-blue-600/20 blur-[150px] rounded-full pointer-events-none opacity-40 mix-blend-multiply dark:mix-blend-normal" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none opacity-30 mix-blend-multiply dark:mix-blend-normal" />

                <div className="relative z-10 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in duration-1000">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4 backdrop-blur-md">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black italic text-slate-500 dark:text-slate-400 uppercase tracking-widest">New 2026 Models In Stock</span>
                        </div>

                        <h1 className="text-6xl md:text-[10rem] font-black uppercase tracking-tighter leading-[0.8]">
                            Ride <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-400 to-slate-400">Better.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
                            The ultimate destination for two-wheelers. <br className="hidden md:block" />
                            Transparent pricing, instant finance, and door-step delivery.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                            <Link href="/store" className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95">
                                Browse Catalog <ArrowRight size={18} />
                            </Link>
                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="w-full sm:w-auto px-10 py-5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white transition-all backdrop-blur-md"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>

                    <LoginSidebar
                        isOpen={isLoginOpen}
                        onClose={() => setIsLoginOpen(false)}
                        variant={loginVariant}
                    />

                    {/* Stats Overlay in Hero */}
                    <div className="pt-8 flex flex-wrap justify-center gap-12 md:gap-24">
                        <div className="text-center">
                            <p className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-1">10,000+</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black italic">Happy Riders</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-1">₹50Cr+</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black italic">Bike Value</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-1">500+</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black italic">Verified Dealers</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Categories (Cloned from Store for Consistency) */}
            <section className="pt-24 md:pt-40 pb-12 md:pb-20 bg-white dark:bg-black transition-colors">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20 md:mb-32 space-y-6">
                        <p className="text-[12px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.5em] italic">The Collection</p>
                        <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white transition-colors">Engineered For Every Soul</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8">
                        {[
                            { title: 'Scooters', subtitle: 'Urban Mobility.', desc: 'Daily commute perfected.', img: '/images/categories/scooter_nobg.png', color: 'bg-emerald-500', link: '/store/catalog?category=SCOOTER' },
                            { title: 'Motorcycles', subtitle: 'Power & Performance.', desc: 'Engineered for the open road.', img: '/images/categories/motorcycle_nobg.png', color: 'bg-rose-500', link: '/store/catalog?category=MOTORCYCLE' },
                            { title: 'Mopeds', subtitle: 'Utility & Efficiency.', desc: 'Heavy-duty performance.', img: '/images/categories/moped_nobg.png', color: 'bg-amber-500', link: '/store/catalog?category=MOPED' },
                        ].map((cat, i) => (
                            <div key={i} className="group relative h-[600px] overflow-hidden rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col items-center justify-end p-8 md:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all">
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-slate-100/20 to-transparent dark:from-slate-950 dark:via-slate-950/20 dark:to-transparent z-10 transition-colors" />
                                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800 scale-100 group-hover:scale-110 transition-transform duration-1000 opacity-50" />

                                <div className="relative z-20 space-y-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-700 w-full text-center">
                                    <div className="space-y-4">
                                        <div className={`w-12 h-1.5 ${cat.color} rounded-full mx-auto`} />
                                        <h3 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white transition-colors">{cat.title}</h3>
                                        <div className="space-y-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <p className="text-sm text-slate-700 dark:text-white font-bold uppercase tracking-widest transition-colors">{cat.subtitle}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed transition-colors">{cat.desc}</p>
                                        </div>
                                    </div>

                                    <Link
                                        href={cat.link}
                                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white dark:hover:text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl"
                                    >
                                        View Collection
                                    </Link>
                                </div>

                                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center opacity-100 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                    <img
                                        src={cat.img}
                                        alt={cat.title}
                                        className="w-[95%] max-w-none h-auto object-contain filter contrast-110 drop-shadow-[0_40px_80px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_20px_100px_rgba(255,255,255,0.08)]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Grid */}
            <section className="py-24 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-white/5 relative">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
                    <Feature
                        icon={<ShieldCheck size={32} className="text-emerald-500" />}
                        title="Verified Dealerships"
                        desc="We partner exclusively with authorized showrooms. Zero scams, 100% genuine vehicles."
                    />
                    <Feature
                        icon={<Zap size={32} className="text-blue-500" />}
                        title="Instant Finance"
                        desc="Get pre-approved loans in minutes with our integrated banking partners."
                    />
                    <Feature
                        icon={<Star size={32} className="text-amber-500" />}
                        title="White Glove Delivery"
                        desc="Doorstep delivery with a dedicated technician to walk you through your new ride."
                    />
                </div>
            </section>

            {/* Why Join Section */}
            <section className="py-24 relative overflow-hidden bg-white dark:bg-black transition-colors">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Why Join The Club?</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Premium. Personalized. Privileged. Experience bike buying like never before.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="text-blue-500" />}
                            title="Preferred Rates"
                            desc="Access exclusively negotiated financing rates not available to the general public."
                        />
                        <FeatureCard
                            icon={<Star className="text-amber-500" />}
                            title="White Glove Delivery"
                            desc="Doorstep delivery with a dedicated technician to walk you through your new machine."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="text-emerald-500" />}
                            title="Verified Dealerships"
                            desc="We only work with top-tier authorized dealers. No haggling, no surprises."
                        />
                        <FeatureCard
                            icon={<ArrowRight className="text-purple-500" />}
                            title="Fast Track"
                            desc="Skip the waiting lists. Our members get priority allocation on high-demand models."
                        />
                        <FeatureCard
                            icon={<ChevronRight className="text-pink-500" />}
                            title="Premium Support"
                            desc="24/7 access to our rider support team for any queries or assistance."
                        />
                        <FeatureCard
                            icon={<Star className="text-yellow-400" />}
                            title="Welcome Kit"
                            desc="Exclusive merchandise and riding gear for new members."
                        />
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">The Member Experience</h2>
                        <p className="text-slate-500 dark:text-slate-400">Hear from the select few who have secured access.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Testimonial
                            quote="Booking my bike online should be as easy as ordering food. I want to see my on-road price, compare EMIs — without visiting five different showrooms."
                            author="Arjun Kapoor"
                            bike="TVS Jupiter"
                        />
                        <Testimonial
                            quote="The transparency is what I loved. No hidden costs, everything upfront. The delivery was right on time as promised."
                            author="Meera Reddy"
                            bike="Honda Activa"
                        />
                        <Testimonial
                            quote="Finally a platform that understands what riders need. The EMI comparison tool saved me so much time and money."
                            author="Karan Malhotra"
                            bike="Suzuki V Strom"
                        />
                    </div>
                </div>
            </section>

            {/* Unified Footer */}
            <MarketplaceFooter />
        </div>
    );
}

const Feature = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="flex flex-col items-center text-center space-y-6 p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-all group shadow-sm dark:shadow-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white mb-3">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
        </div>
    </div>
);

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="p-8 rounded-3xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 hover:bg-white dark:hover:bg-white/10 transition-all group shadow-sm dark:shadow-none">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-black flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-lg font-black uppercase italic text-slate-900 dark:text-white mb-3">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
    </div>
);

const Testimonial = ({ quote, author, bike }: { quote: string, author: string, bike: string }) => (
    <div className="p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 relative shadow-lg dark:shadow-none">
        <div className="text-blue-500 mb-4 opacity-50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.896 14.325 16.034 15.011 15.225C15.766 14.343 16.942 13.901 18.528 13.901L20.001 13.901L20.001 9L18.423 9C17.042 9 15.939 9.388 15.143 10.151C14.394 10.871 14.017 11.95 14.017 13.387L14.017 21zM5 21L5 18C5 16.896 5.308 16.034 5.994 15.225C6.75 14.343 7.925 13.901 9.512 13.901L10.985 13.901L10.985 9L9.406 9C8.025 9 6.923 9.388 6.126 10.151C5.378 10.871 5 11.95 5 13.387L5 21z"></path></svg>
        </div>
        <p className="text-slate-700 dark:text-slate-300 font-medium italic mb-6 leading-relaxed">"{quote}"</p>
        <div className="border-t border-slate-100 dark:border-white/5 pt-4">
            <p className="text-slate-900 dark:text-white font-bold uppercase text-sm">{author}</p>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{bike}</p>
        </div>
    </div>
);
