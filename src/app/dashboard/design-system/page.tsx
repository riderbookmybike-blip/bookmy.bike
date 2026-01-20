'use client';

import React from 'react';
import { Copy, Check, Palette, Moon, Sun, RefreshCw, Bike, Search, User, ChevronRight, ArrowRight, X, Menu, Shield, Zap, Star, Heart, Package, Tag, Clock, Activity, MoreHorizontal, Filter, Download, FileJson, FileType, FileText } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import tokens from '@/config/design-tokens';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { Footer } from '@/components/store/Footer';

/**
 * AUMS Brand Guidelines "Vault"
 * 
 * Accessible only to SuperAdmins via Dashboard.
 * Reference for all Brand Assets.
 */
export default function BrandGuidelinesPage() {
    const [copied, setCopied] = React.useState<string | null>(null);
    const [iconColor, setIconColor] = React.useState('#F4B000');
    const [bikeColor, setBikeColor] = React.useState('#F4B000');
    const [bookmyColor, setBookmyColor] = React.useState('#000000');
    const [playgroundBg, setPlaygroundBg] = React.useState<'light' | 'dark' | 'transparent'>('light');
    const [activeTableTab, setActiveTableTab] = React.useState<'ops' | 'market' | 'audit' | 'specs'>('ops');
    const [previewTheme, setPreviewTheme] = React.useState<'light' | 'dark'>('dark');

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
    };

    // Auto-update contrast text color when bg changes if not manually set
    React.useEffect(() => {
        if (playgroundBg === 'dark') {
            setBookmyColor('#FFFFFF');
        } else {
            setBookmyColor('#000000');
        }
    }, [playgroundBg]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans p-8 md:p-12 space-y-16 pb-40">

            {/* Header */}
            <header className="space-y-4 border-b border-slate-200 dark:border-white/10 pb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest">
                    AUMS Internal
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    Brand Guidelines
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
                    The single source of truth for the {tokens.meta.name} brand.
                    Use these tokens to ensure consistency across the entire ecosystem.
                </p>
            </header>

            {/* 1. Logo Showcase */}
            <section className="space-y-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">01</span>
                        Logo Variants
                    </h2>
                    <p className="text-slate-500">Official logomarks for different contexts and backgrounds.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Standard Full - Light */}
                    <LogoCard title="Standard Full (Light Mode)" bg="bg-white">
                        <Logo mode="light" variant="full" size="lg" />
                    </LogoCard>

                    {/* Standard Full - Dark */}
                    <LogoCard title="Standard Full (Dark Mode)" bg="bg-slate-900">
                        <Logo mode="dark" variant="full" size="lg" />
                    </LogoCard>

                    {/* Icon Only */}
                    <LogoCard title="Icon Only" bg="bg-slate-50">
                        <Logo variant="icon" size="lg" />
                    </LogoCard>

                    {/* Wordmark Only */}
                    <LogoCard title="Wordmark Only" bg="bg-white">
                        <Logo variant="wordmark" size="lg" />
                    </LogoCard>

                    {/* Monochrome Black */}
                    <LogoCard title="Monochrome Black" bg="bg-white">
                        <Logo monochrome="black" variant="full" size="lg" />
                    </LogoCard>

                    {/* Monochrome White */}
                    <LogoCard title="Monochrome White" bg="bg-slate-900">
                        <Logo monochrome="white" variant="full" size="lg" />
                    </LogoCard>

                    {/* Gold Edition */}
                    <LogoCard title="Gold Edition (Premium)" bg="bg-black">
                        <Logo monochrome="gold" variant="full" size={60} />
                    </LogoCard>

                    {/* Silver Edition */}
                    <LogoCard title="Silver Edition (Platinum)" bg="bg-black">
                        <Logo monochrome="silver" variant="full" size={60} />
                    </LogoCard>

                    {/* Custom Color Placeholder for Grid */}
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-white/10 space-y-4">
                        <Palette className="text-slate-400" size={32} />
                        <p className="text-sm font-bold text-slate-500 uppercase">Test Custom Colors Below</p>
                    </div>
                </div>
            </section>

            {/* 2. Live Color Playground */}
            <section className="space-y-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs">02</span>
                        Live Logo Tester
                    </h2>
                    <p className="text-slate-500">Separately customize the icon and the .bike suffix.</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/5 shadow-2xl">
                    <div className="flex flex-col md:flex-row h-[500px]">
                        {/* Controls Panel */}
                        <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-900/50 p-8 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 flex flex-col gap-6 overflow-y-auto">

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-slate-400"></span> Icon Color
                                </label>
                                <div className="flex items-center gap-3 bg-white dark:bg-black/20 p-2 rounded-xl border border-slate-200 dark:border-white/5">
                                    <input
                                        type="color"
                                        value={iconColor}
                                        onChange={(e) => setIconColor(e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={iconColor}
                                        onChange={(e) => setIconColor(e.target.value)}
                                        className="bg-transparent border-none p-0 text-sm font-mono font-bold text-slate-600 dark:text-slate-300 focus:ring-0 w-24 uppercase"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-slate-400"></span> .Bike Suffix Color
                                </label>
                                <div className="flex items-center gap-3 bg-white dark:bg-black/20 p-2 rounded-xl border border-slate-200 dark:border-white/5">
                                    <input
                                        type="color"
                                        value={bikeColor}
                                        onChange={(e) => setBikeColor(e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={bikeColor}
                                        onChange={(e) => setBikeColor(e.target.value)}
                                        className="bg-transparent border-none p-0 text-sm font-mono font-bold text-slate-600 dark:text-slate-300 focus:ring-0 w-24 uppercase"
                                    />
                                </div>
                            </div>

                            {/* Hidden control for 'bookmy', synced with theme generally but exposing just in case they want total control? 
                                User asked for icon and .bike. I added bookmyColor state but auto-syncing it. 
                                Let's add a small toggle or just leave it auto. I will add it as a smaller control. 
                            */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full border border-slate-400"></span> 'bookmy' Text
                                </label>
                                <div className="flex items-center gap-3 bg-white dark:bg-black/20 p-2 rounded-xl border border-slate-200 dark:border-white/5">
                                    <input
                                        type="color"
                                        value={bookmyColor}
                                        onChange={(e) => setBookmyColor(e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={bookmyColor}
                                        onChange={(e) => setBookmyColor(e.target.value)}
                                        className="bg-transparent border-none p-0 text-sm font-mono font-bold text-slate-600 dark:text-slate-300 focus:ring-0 w-24 uppercase"
                                    />
                                </div>
                            </div>


                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Background</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPlaygroundBg('light')}
                                        className={`flex-1 py-2 rounded-lg border font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 ${playgroundBg === 'light' ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'bg-transparent border-slate-200 text-slate-400 hover:bg-white'}`}
                                    >
                                        <Sun size={12} /> Light
                                    </button>
                                    <button
                                        onClick={() => setPlaygroundBg('dark')}
                                        className={`flex-1 py-2 rounded-lg border font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 ${playgroundBg === 'dark' ? 'bg-slate-900 border-blue-500 text-white shadow-sm' : 'bg-transparent border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                                    >
                                        <Moon size={12} /> Dark
                                    </button>
                                </div>
                            </div>

                            <div className="mt-auto pt-4">
                                <button
                                    onClick={() => {
                                        setIconColor('#4F46E5');
                                        setBikeColor('#4F46E5');
                                        setBookmyColor(playgroundBg === 'dark' ? '#FFFFFF' : '#000000');
                                    }}
                                    className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-white hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={14} /> Reset Defaults
                                </button>
                            </div>
                        </div>

                        {/* Preview Panel */}
                        <div className={`w-full md:w-2/3 relative flex items-center justify-center transition-colors duration-500 ${playgroundBg === 'light' ? 'bg-white' : playgroundBg === 'dark' ? 'bg-[#020617]' : 'bg-[url("/images/grid.png")]'
                            }`}>
                            <div className="scale-150 transform transition-all duration-300">
                                <Logo
                                    customColors={{
                                        icon: iconColor,
                                        bike: bikeColor,
                                        bookmy: bookmyColor
                                    }}
                                    variant="full"
                                    size={80}
                                />
                            </div>

                            <div className="absolute bottom-8 right-8 flex flex-col gap-2 text-right opacity-50">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${playgroundBg === 'dark' ? 'text-white' : 'text-slate-900'}`}>Live Preview</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Header & Footer Context Preview */}
            <section className="space-y-8">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">02b</span>
                            Live Context Preview
                        </h2>
                        <p className="text-slate-500">Your custom logo colors from above applied to actual Header & Footer.</p>
                    </div>

                    {/* Theme Toggle */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setPreviewTheme('light')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${previewTheme === 'light' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Sun size={14} /> Light
                        </button>
                        <button
                            onClick={() => setPreviewTheme('dark')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${previewTheme === 'dark' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Moon size={14} /> Dark
                        </button>
                    </div>
                </div>

                {/* Header Preview with Custom Colors */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Header Preview ({previewTheme === 'dark' ? 'Dark' : 'Light'} Mode)</span>
                        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">MarketplaceHeader.tsx</span>
                    </div>
                    <div className={`rounded-2xl border shadow-lg overflow-hidden transition-colors duration-300 ${previewTheme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-8">
                                <Logo
                                    customColors={{
                                        icon: iconColor,
                                        bike: bikeColor,
                                        bookmy: previewTheme === 'dark' ? '#FFFFFF' : bookmyColor
                                    }}
                                    variant="full"
                                    size={36}
                                />
                                <nav className="hidden md:flex items-center gap-6">
                                    {['Home', 'Compare', 'Zero'].map((item) => (
                                        <span key={item} className={`text-sm font-medium cursor-pointer transition-colors ${previewTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>{item}</span>
                                    ))}
                                </nav>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide ${previewTheme === 'dark' ? 'border-white/20 text-white bg-white/10' : 'border-slate-200 text-slate-700 bg-slate-50'}`}>
                                    <User size={14} /> Sign In
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Preview with Custom Colors */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Footer Preview ({previewTheme === 'dark' ? 'Dark' : 'Light'} Mode)</span>
                        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">Footer.tsx</span>
                    </div>
                    <div className={`rounded-2xl border shadow-lg overflow-hidden transition-colors duration-300 p-8 ${previewTheme === 'dark' ? 'bg-slate-950 border-white/5' : 'bg-white border-slate-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="space-y-4">
                                <Logo
                                    customColors={{
                                        icon: iconColor,
                                        bike: bikeColor,
                                        bookmy: previewTheme === 'dark' ? '#FFFFFF' : bookmyColor
                                    }}
                                    variant="full"
                                    size={40}
                                />
                                <p className={`text-xs leading-relaxed ${previewTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>India's premier marketplace for the next generation of riders.</p>
                            </div>
                            {['Portfolio', 'Brands', 'Legal'].map((section) => (
                                <div key={section} className="space-y-3">
                                    <h4 className={`text-xs font-black uppercase tracking-widest ${previewTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{section}</h4>
                                    <div className={`space-y-2 text-sm ${previewTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                        <p className="hover:opacity-70 cursor-pointer">Link One</p>
                                        <p className="hover:opacity-70 cursor-pointer">Link Two</p>
                                        <p className="hover:opacity-70 cursor-pointer">Link Three</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={`border-t mt-8 pt-6 flex items-center justify-between ${previewTheme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                            <p className={`text-xs ${previewTheme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>© 2026 BookMy.Bike Technologies. Built for Excellence.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Typography */}
            <section className="space-y-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center text-xs">03</span>
                        Typography
                    </h2>
                    <p className="text-slate-500">The primary typeface is <span className="font-bold text-slate-900 dark:text-white">Inter</span>, optimized for legibility and modern aesthetics.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Headings Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-200 dark:border-white/5 space-y-8">
                        <div className="border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Brand Headings</span>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-xs text-slate-400 font-mono">Display / 900 / Italic / Uppercase</p>
                                <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                                    The Future<br />of Mobility.
                                </h1>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs text-slate-400 font-mono">H1 / 900 / Uppercase</p>
                                <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                    Premium Selection
                                </h1>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs text-slate-400 font-mono">H2 / 800</p>
                                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                                    Member Privileges
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Body & Weights Card */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-200 dark:border-white/5 space-y-6">
                            <div className="border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Weights & Body</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="h-12 flex items-center"><span className="font-black text-2xl">Aa</span> <span className="ml-2 text-xs text-slate-400">900 Black</span></div>
                                    <div className="h-12 flex items-center"><span className="font-bold text-2xl">Aa</span> <span className="ml-2 text-xs text-slate-400">700 Bold</span></div>
                                    <div className="h-12 flex items-center"><span className="font-medium text-2xl">Aa</span> <span className="ml-2 text-xs text-slate-400">500 Medium</span></div>
                                    <div className="h-12 flex items-center"><span className="font-normal text-2xl">Aa</span> <span className="ml-2 text-xs text-slate-400">400 Regular</span></div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                        <strong className="text-slate-900 dark:text-white">Body Text (sm):</strong> The quick brown fox jumps over the lazy dog. AUMS uses standardized line heights for optimal readability.
                                    </p>
                                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                        <strong className="text-slate-900 dark:text-white">Caption (xs):</strong> Used for secondary information, timestamps, and metadata.
                                    </p>
                                    <div className="p-3 bg-slate-100 dark:bg-black/20 rounded-lg">
                                        <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                                            // Monospace (JetBrains Mono)<br />
                                            const futuristic = true;
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Iconography */}
            <section className="space-y-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs">04</span>
                        Iconography
                    </h2>
                    <p className="text-slate-500">We use <span className="font-bold text-slate-900 dark:text-white">Lucide React</span> for our icon system. Icons should be clear, consistent, and used to enhance navigation or comprehension.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {[
                        { name: 'Bike', Icon: Bike },
                        { name: 'Search', Icon: Search },
                        { name: 'User', Icon: User },
                        { name: 'ChevronRight', Icon: ChevronRight },
                        { name: 'ArrowRight', Icon: ArrowRight },
                        { name: 'Check', Icon: Check },
                        { name: 'X', Icon: X },
                        { name: 'Menu', Icon: Menu },
                        { name: 'Shield', Icon: Shield },
                        { name: 'Zap', Icon: Zap },
                        { name: 'Star', Icon: Star },
                        { name: 'Heart', Icon: Heart }
                    ].map(({ name, Icon }) => (
                        <div key={name} className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3 group hover:border-blue-500 hover:shadow-lg transition-all">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Icon size={20} />
                            </div>
                            <p className="text-xs font-mono text-slate-400">{name}</p>
                        </div>
                    ))}
                    <div className="col-span-full p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex items-center gap-4 text-sm text-blue-700 dark:text-blue-300">
                        <div className="font-bold">Usage Note:</div>
                        Use <code className="bg-white dark:bg-black/20 px-2 py-0.5 rounded">stroke-width={'{1.5}'}</code> for a refined look or <code className="bg-white dark:bg-black/20 px-2 py-0.5 rounded">stroke-width={'{2}'}</code> for active states.
                    </div>
                </div>
            </section>

            {/* 5. Data Tables */}
            <section className="space-y-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center text-xs">05</span>
                        Data Tables
                    </h2>
                    <p className="text-slate-500">Standardized table definitions for different application contexts.</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                    {/* Table Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-white/10">
                        <button
                            onClick={() => setActiveTableTab('ops')}
                            className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTableTab === 'ops' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-900/50' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            Operations (Admin)
                        </button>
                        <button
                            onClick={() => setActiveTableTab('market')}
                            className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTableTab === 'market' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-900/50' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            Marketplace (Catalog)
                        </button>
                        <button
                            onClick={() => setActiveTableTab('audit')}
                            className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTableTab === 'audit' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-900/50' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            Audit Logs (Dense)
                        </button>
                        <button
                            onClick={() => setActiveTableTab('specs')}
                            className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTableTab === 'specs' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-900/50' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            Specs & Pricing
                        </button>
                    </div>

                    {/* Table Content */}
                    <div className="p-0">
                        {activeTableTab === 'specs' && (
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 bg-slate-50/50 dark:bg-slate-900/20">
                                {/* Price Breakup Table - Adjusted to match Image 1 (Clean List) */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Price Breakdown</h3>
                                        <span className="text-xs font-bold text-slate-400">Bangalore</span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-white/5 space-y-4">
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Ex-Showroom Price</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">₹78,000</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">RTO Registration</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">₹9,360</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Insurance (Mandatory)</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">₹5,500</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Legal & Handling Charges</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">₹1,200</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Offers Applied</span>
                                            <span className="text-sm font-bold text-emerald-500 font-mono">-₹2,500</span>
                                        </div>
                                        <div className="h-px bg-slate-100 dark:bg-white/10 my-2" />
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">On-Road Price</span>
                                            <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">₹91,560</span>
                                        </div>
                                    </div>
                                </div>

                                {/* EMI Plans - Adjusted to match Image 2 (Selectable Rows) */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Finance Options</h3>
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Powered by HDFC</span>
                                    </div>
                                    <div className="space-y-3">
                                        {/* Option 1 */}
                                        <div className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md cursor-pointer transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-blue-500 transition-colors" />
                                                <div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-lg font-black text-slate-900 dark:text-white font-mono">₹1,615</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Per Month</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-200 italic">60 MONTHS</span>
                                            </div>
                                        </div>

                                        {/* Option 2 (Active) */}
                                        <div className="relative group flex items-center justify-between p-5 bg-blue-600 dark:bg-blue-600 rounded-xl border border-blue-600 shadow-xl shadow-blue-500/20 cursor-pointer transform scale-[1.02] transition-all">
                                            <div className="absolute -top-3 right-4 bg-blue-800 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Recommended</div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-5 h-5 rounded-full border-[5px] border-white bg-transparent" />
                                                <div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-2xl font-black text-white font-mono">₹2,463</span>
                                                        <span className="text-[10px] font-bold text-blue-200 uppercase">Per Month</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-black text-white italic">36 MONTHS</span>
                                            </div>
                                        </div>

                                        {/* Option 3 */}
                                        <div className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md cursor-pointer transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-blue-500 transition-colors" />
                                                <div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-lg font-black text-slate-900 dark:text-white font-mono">₹3,530</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Per Month</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-200 italic">24 MONTHS</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTableTab === 'ops' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 tracking-wider">User / Team</th>
                                            <th className="px-6 py-4 tracking-wider">Status</th>
                                            <th className="px-6 py-4 tracking-wider">Role</th>
                                            <th className="px-6 py-4 tracking-wider">Last Active</th>
                                            <th className="px-6 py-4 tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {[1, 2, 3].map((i) => (
                                            <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">JD</div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white">John Doe</div>
                                                            <div className="text-xs text-slate-500">john@example.com</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current" /> Active
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Admin</td>
                                                <td className="px-6 py-4 text-slate-500 text-xs">2 mins ago</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTableTab === 'market' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 tracking-wider">Product</th>
                                            <th className="px-6 py-4 tracking-wider">Price</th>
                                            <th className="px-6 py-4 tracking-wider">Stock</th>
                                            <th className="px-6 py-4 tracking-wider">Category</th>
                                            <th className="px-6 py-4 tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                                                        <Bike size={20} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white text-base">Royal Enfield Classic 350</div>
                                                        <div className="text-xs text-slate-500">SKU: RE-CLS-350</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-200">
                                                ₹1,95,000
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                        <div className="w-2/3 h-full bg-blue-500 rounded-full" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500">42</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-white/5">
                                                    <Tag size={10} /> Cruiser
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Manage</button>
                                            </td>
                                        </tr>
                                        {/* Duplicate row for effect */}
                                        <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                                                        <Bike size={20} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white text-base">Honda Activa 6G</div>
                                                        <div className="text-xs text-slate-500">SKU: HON-ACT-6G</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-200">
                                                ₹85,000
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                        <div className="w-1/4 h-full bg-amber-500 rounded-full" />
                                                    </div>
                                                    <span className="text-xs font-bold text-amber-500">8</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-white/5">
                                                    <Tag size={10} /> Scooter
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Manage</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTableTab === 'audit' && (
                            <div className="overflow-x-auto bg-slate-950 text-slate-400">
                                <table className="w-full text-xs text-left font-mono">
                                    <thead className="uppercase text-slate-500 border-b border-slate-800">
                                        <tr>
                                            <th className="px-6 py-3 tracking-wider">Timestamp</th>
                                            <th className="px-6 py-3 tracking-wider">Event ID</th>
                                            <th className="px-6 py-3 tracking-wider">Action</th>
                                            <th className="px-6 py-3 tracking-wider">Actor</th>
                                            <th className="px-6 py-3 tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-2">2024-03-15 10:30:22</td>
                                            <td className="px-6 py-2 text-slate-600">evt_83920</td>
                                            <td className="px-6 py-2 text-white">user.login_success</td>
                                            <td className="px-6 py-2">admin@aums</td>
                                            <td className="px-6 py-2 text-emerald-500">200 OK</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-2">2024-03-15 10:32:05</td>
                                            <td className="px-6 py-2 text-slate-600">evt_83921</td>
                                            <td className="px-6 py-2 text-white">inventory.update</td>
                                            <td className="px-6 py-2">system.worker</td>
                                            <td className="px-6 py-2 text-emerald-500">200 OK</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-2">2024-03-15 10:35:00</td>
                                            <td className="px-6 py-2 text-slate-600">evt_83922</td>
                                            <td className="px-6 py-2 text-amber-400">payment.failed</td>
                                            <td className="px-6 py-2">gateway.razorpay</td>
                                            <td className="px-6 py-2 text-red-500">402 PAY_REQ</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 6. Color Palette (Renamed) */}
            <section className="space-y-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-aums-red flex items-center justify-center text-white text-xs">06</span>
                        Color Palette
                    </h2>
                    <p className="text-slate-500">Click any swatch to copy its utility class or hex code.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(tokens.colors.aums).map(([name, hex]) => (
                        <div key={name} className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-white/5 hover:shadow-xl transition-all cursor-pointer" onClick={() => copyToClipboard(hex)}>
                            <div className="h-32 rounded-xl mb-4 relative overflow-hidden" style={{ backgroundColor: hex }}>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-white">
                                    {copied === hex ? <Check size={24} /> : <Copy size={24} />}
                                </div>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white capitalize">{name}</p>
                                    <p className="text-xs text-slate-400 uppercase font-mono">bg-aums-{name}</p>
                                </div>
                                <p className="font-mono text-sm text-slate-500">{hex}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

// Helper Component for Logo Grid
function LogoCard({ title, bg, children }: { title: string, bg: string, children: React.ReactNode }) {
    return (
        <div className={`rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col h-[300px] group relative`}>
            <div className={`flex-1 ${bg} flex items-center justify-center p-8 relative transition-all duration-500 overflow-hidden`}>
                <div className="group-hover:scale-110 transition-transform duration-500 group-hover:opacity-30 blur-0 group-hover:blur-sm">
                    {children}
                </div>

                {/* Download Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 gap-2">
                    <button className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform" title="Download SVG">
                        <FileJson size={20} className="text-blue-600" />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform" title="Download PNG">
                        <FileType size={20} className="text-emerald-600" />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform" title="Download PDF">
                        <FileText size={20} className="text-red-500" />
                    </button>
                </div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-white/5">
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider text-center">{title}</p>
                <div className="flex justify-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[10px] font-mono text-slate-400">SVG</span>
                    <span className="text-[10px] font-mono text-slate-400">PNG</span>
                    <span className="text-[10px] font-mono text-slate-400">PDF</span>
                </div>
            </div>
        </div>
    );
}
