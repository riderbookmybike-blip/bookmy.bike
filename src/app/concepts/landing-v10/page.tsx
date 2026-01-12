'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, CreditCard } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { createClient } from '@/lib/supabase/client';

const GOLD = '#F4B000';

export default function LandingV10Page() {
    const [userName, setUserName] = React.useState<string>('Hritik Roshan');

    React.useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            // Priority: Supabase metadata > localStorage > Fallback
            if (user?.user_metadata?.full_name) {
                setUserName(user.user_metadata.full_name);
            } else if (user?.user_metadata?.name) {
                setUserName(user.user_metadata.name);
            } else {
                const storedName = localStorage.getItem('user_name');
                if (storedName) setUserName(storedName);
            }
        };
        fetchUser();
    }, []);

    return (
        <div className="bg-black text-white min-h-screen font-sans selection:bg-[#F4B000] selection:text-black overflow-x-hidden">

            {/* ════════════ THE BLADE HEADER ════════════ */}
            <nav className="fixed top-0 w-full z-50 px-6 md:px-10 py-6 md:py-8 flex justify-between items-center transition-all">
                <Logo mode="dark" size={28} variant="full" />
                <div className="flex gap-4 md:gap-10 items-center">
                    <Link href="/login" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] hover:text-[#F4B000] transition-colors">
                        Member Portal
                    </Link>
                    <Link href="/store/catalog" className="px-5 md:px-8 py-2 md:py-3 bg-[#F4B000] text-black text-[10px] md:text-xs font-black uppercase tracking-[0.2em] rounded-sm hover:skew-x-[-10deg] transition-transform">
                        Explore
                    </Link>
                </div>
            </nav>


            {/* ════════════ HERO: THE SLASH ════════════ */}
            <section className="relative h-screen flex items-center overflow-hidden">

                {/* Diagonal Background Slashes */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-10" />
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-[#111] skew-x-[-15deg] translate-x-32 hidden lg:block" />
                    <div className="absolute top-0 right-[-10%] w-[120%] h-full bg-[#080808] skew-x-[-15deg] translate-x-32 block lg:hidden" />

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        className="absolute inset-0"
                    >
                        <img
                            src="/images/hero/blurred_bike_hero.png"
                            alt=""
                            className="w-full h-full object-cover grayscale contrast-150"
                        />
                    </motion.div>
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 pt-20 lg:pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                        <motion.div
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic tracking-tighter leading-[0.85] mb-8">
                                <span className="text-white">SHARP.</span><br />
                                <span className="text-[#F4B000]">SWIFT.</span><br />
                                <span className="text-white/20">SILENT.</span>
                            </h1>

                            <p className="text-lg md:text-xl text-white/50 max-w-md mb-12 border-l-4 border-[#F4B000] pl-6 italic">
                                The ultimate fintech engine for the modern rider.
                                Approval at the speed of thought.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                                <button className="group flex items-center justify-center gap-4 px-10 py-5 bg-white text-black text-sm md:text-base font-black uppercase tracking-widest hover:bg-[#F4B000] transition-colors relative transition-all active:scale-95">
                                    Instant Approval
                                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                                <div className="p-5 border border-white/10 backdrop-blur-md flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-4 sm:gap-0">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Starts @</span>
                                    <span className="text-xl font-bold font-mono text-[#F4B000]">₹1,999/mo</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ x: 100, opacity: 0, rotate: 5 }}
                            animate={{ x: 0, opacity: 1, rotate: -5 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative group"
                        >
                            {/* Card Glow */}
                            <div className="absolute inset-0 bg-[#F4B000] blur-[120px] opacity-20" />

                            {/* The Card Body */}
                            <div className="relative aspect-[1.586/1] w-full max-w-sm lg:max-w-none mx-auto lg:mx-0 bg-[#111] border border-white/10 p-8 md:p-10 rounded-2xl shadow-2xl skew-y-3 overflow-hidden">

                                {/* Header: Chip + Logo */}
                                <div className="flex justify-between items-start mb-16">
                                    <div className="w-12 h-9 bg-gradient-to-br from-yellow-200/80 to-[#F4B000] rounded-md relative opacity-80 backdrop-blur-sm">
                                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 gap-px p-1">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="border-[0.5px] border-black/20" />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Logo mode="dark" variant="icon" size={24} />
                                        <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] mt-1">Blade Edition</p>
                                    </div>
                                </div>

                                {/* Body: Limit + Number */}
                                <div className="mb-10">
                                    <p className="text-[10px] text-[#F4B000] font-black tracking-[0.3em] uppercase mb-1">Flash Credit Limit</p>
                                    <h3 className="text-4xl md:text-5xl font-black tracking-tighter italic">₹5,00,000</h3>
                                    <div className="mt-4 flex gap-4 text-white/20 font-mono text-sm tracking-[0.2em]">
                                        <span>4500</span>
                                        <span>8800</span>
                                        <span>0092</span>
                                        <span>2026</span>
                                    </div>
                                </div>

                                {/* Footer: Name + Network */}
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Authorized Member</p>
                                        <p className="text-[10px] md:text-xs font-black tracking-widest uppercase">{userName}</p>
                                    </div>
                                    <div className="flex -space-x-3 opacity-40">
                                        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10" />
                                        <div className="w-8 h-8 rounded-full bg-[#F4B000]/20 backdrop-blur-md border border-[#F4B000]/20" />
                                    </div>
                                </div>

                                {/* Subtle Texture Overlay */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>


            {/* ════════════ THE SPEED STRIP ════════════ */}
            <div className="h-auto md:h-64 flex items-center bg-[#F4B000] text-black overflow-hidden select-none relative z-20 py-12 md:py-0">
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 flex items-center whitespace-nowrap gap-20 pointer-events-none opacity-10"
                >
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="text-[12vw] font-black italic tracking-tighter">SPEED SPEED SPEED SPEED</span>
                    ))}
                </motion.div>
                <div className="relative w-full px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4 z-10">
                    <div className="bg-black text-white px-6 py-3 text-lg md:text-xl font-black italic w-full md:w-auto text-center">LOWEST ROI: 9.5%</div>
                    <div className="bg-black text-white px-6 py-3 text-lg md:text-xl font-black italic w-full md:w-auto text-center uppercase tracking-tight">10 Mins Approval</div>
                    <div className="bg-black text-white px-6 py-3 text-lg md:text-xl font-black italic w-full md:w-auto text-center">ZERO PROCESSING</div>
                </div>
            </div>


            {/* ════════════ THE ARSENAL: FEATURES ════════════ */}
            <section className="py-24 md:py-40 relative bg-black">
                <div className="max-w-7xl mx-auto px-6 md:px-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-32 gap-6">
                        <h2 className="text-6xl sm:text-7xl md:text-9xl font-black italic leading-none tracking-tighter">
                            THE <br /> <span className="text-[#F4B000]">ARSENAL.</span>
                        </h2>
                        <p className="text-white/40 text-[10px] md:text-sm font-black uppercase tracking-[0.5em] md:text-right">Precision Built Tools</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
                        {[
                            {
                                title: "PULSE ENGINE",
                                val: "9.5%",
                                desc: "Automated risk assessment that rewards good riders with sub-10% interest rates instantly.",
                                sub: "Interest Rate"
                            },
                            {
                                title: "VAULT SECURITY",
                                val: "256 BIT",
                                desc: "Your sensitive financial data is fragmented and encrypted across our secure node network.",
                                sub: "Data Encryption"
                            },
                            {
                                title: "FLASH LIMIT",
                                val: "₹5L",
                                desc: "Pre-approved limits up to 5 Lakhs for premium superbikes, accessible without manual intervention.",
                                sub: "Maximum Credit"
                            }
                        ].map((item, i) => (
                            <div key={i} className="bg-black p-8 md:p-12 hover:bg-[#F4B000] hover:text-black transition-all duration-500 group">
                                <h4 className="text-[10px] md:text-xs font-black tracking-[0.3em] mb-8 md:mb-12 opacity-50 group-hover:opacity-100 uppercase">{item.title}</h4>
                                <div className="text-5xl md:text-7xl font-black italic mb-4">{item.val}</div>
                                <p className="text-[10px] font-black tracking-widest mb-8 md:mb-12 uppercase">{item.sub}</p>
                                <p className="text-sm opacity-40 group-hover:opacity-100 leading-relaxed font-medium">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ════════════ THE STRIKE: HOW IT WORKS ════════════ */}
            <section className="py-24 md:py-40 relative overflow-hidden bg-[#050505]">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-[#111] -skew-x-[20deg] translate-x-32 hidden lg:block" />

                <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
                    <div className="mb-20 md:mb-32">
                        <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none">THE STRIKE.</h2>
                        <p className="text-[#F4B000] text-xs md:text-sm font-black tracking-widest mt-4 uppercase">3 Steps. 10 Minutes. Zero Friction.</p>
                    </div>

                    <div className="space-y-24 md:space-y-40">
                        {[
                            {
                                step: "01",
                                name: "IDENTIFY",
                                desc: "Input your PAN and Aadhaar. Our Pulse Engine clears your identity in milliseconds."
                            },
                            {
                                step: "02",
                                name: "QUANTIFY",
                                desc: "The system runs 200+ checks to calculate your Flash Limit and personalized ROI."
                            },
                            {
                                step: "03",
                                name: "AMPLIFY",
                                desc: "Sign digitally and get your delivery order sent to the nearest dealership instantly."
                            }
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-baseline">
                                <span className="text-7xl md:text-9xl font-black text-white/5 italic leading-none">{s.step}</span>
                                <div className="max-w-xl">
                                    <h4 className="text-4xl md:text-5xl font-black italic mb-4 md:mb-6">{s.name}</h4>
                                    <p className="text-lg md:text-xl text-white/40 font-medium leading-relaxed">{s.desc}</p>
                                </div>
                                <div className="hidden md:block flex-grow h-[1px] bg-white/10 self-center" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ════════════ THE FINAL CUT: CTA ════════════ */}
            <section className="py-24 md:py-40 bg-black">
                <div className="max-w-5xl mx-auto px-6 md:px-10 text-center">
                    <div className="inline-block p-1 bg-[#F4B000] -rotate-1 mb-8 md:mb-12">
                        <div className="bg-black text-white px-4 md:px-8 py-2 text-[10px] md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] rotate-1">
                            Limited Period Offer
                        </div>
                    </div>
                    <h2 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter mb-12 leading-none">
                        SHARPEN YOUR <br className="hidden sm:block" /> <span className="text-[#F4B000]">LIFESTYLE.</span>
                    </h2>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
                        <button className="px-10 md:px-16 py-6 md:py-8 bg-white text-black text-xl md:text-2xl font-black italic hover:bg-[#F4B000] transition-colors skew-x-[-10deg]">
                            <span className="block skew-x-[10deg]">APPLY NOW</span>
                        </button>
                        <button className="px-10 md:px-16 py-6 md:py-8 border-2 md:border-4 border-white/20 text-xl md:text-2xl font-black italic hover:bg-white hover:text-black transition-all skew-x-[-10deg]">
                            <span className="block skew-x-[10deg]">BROWSE GAZA</span>
                        </button>
                    </div>
                </div>
            </section>


            {/* ════════════ THE VOID: FOOTER ════════════ */}
            <footer className="bg-[#050505] border-t border-white/5 py-24 md:py-32 px-6 md:px-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-16 md:gap-20">
                    <div className="col-span-1 sm:col-span-2">
                        <Logo mode="dark" size={32} variant="full" />
                        <p className="mt-6 md:mt-8 text-white/30 max-w-sm leading-relaxed text-xs md:text-sm font-medium italic">
                            BMB is India's first high-frequency motorcycle financing platform. Built for the swift, by the sharp.
                        </p>
                        <div className="mt-10 md:mt-12 flex gap-4 md:gap-6">
                            {['TW', 'IG', 'LI'].map(s => (
                                <span key={s} className="w-10 h-10 border border-white/10 flex items-center justify-center text-[10px] font-black hover:border-[#F4B000] hover:text-[#F4B000] cursor-pointer transition-colors transition-all active:scale-90">{s}</span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h5 className="text-[10px] font-black tracking-[0.3em] mb-8 md:mb-10 text-white/40 uppercase">Navigation</h5>
                        <ul className="space-y-3 md:space-y-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-white/60">
                            {['The Blade', 'The Strike', 'The Arsenal', 'Garage'].map(l => (
                                <li key={l} className="hover:text-[#F4B000] cursor-pointer transition-colors">{l}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-[10px] font-black tracking-[0.3em] mb-8 md:mb-10 text-white/40 uppercase">Support</h5>
                        <ul className="space-y-3 md:space-y-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-white/60">
                            {['Help Deck', 'API Status', 'Security', 'Privacy'].map(l => (
                                <li key={l} className="hover:text-[#F4B000] cursor-pointer transition-colors">{l}</li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 md:mt-32 pt-8 md:pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[8px] md:text-[10px] font-black tracking-widest text-white/20 gap-6 md:gap-0">
                    <span>© 2026 BOOKMYBIKE ARSENAL v10.0</span>
                    <span className="flex gap-4">
                        <span>EST. 2024</span>
                        <div className="w-[1px] h-3 bg-white/10" />
                        <span>BORN IN INDIA</span>
                    </span>
                </div>
            </footer>

        </div>
    );
}
