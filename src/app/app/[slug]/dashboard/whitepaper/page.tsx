'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layout,
    Box,
    Zap,
    Phone,
    Layers,
    Copy,
    ChevronRight,
    ChevronDown,
    Maximize2,
    Search,
    CreditCard,
    RotateCcw,
    CheckCircle2,
    Info,
} from 'lucide-react';

interface ComponentBlueprint {
    id: string;
    label: string;
    description: string;
    specs: {
        dimensions?: string;
        behavior?: string;
        typography?: string;
        colors?: string[];
        tokens?: string[];
    };
    children?: ComponentBlueprint[];
}

const BLUEPRINTS: Record<string, ComponentBlueprint[]> = {
    marketplace_home: [
        {
            id: 'bmb-home-header',
            label: 'Cinematic Global Header',
            description: 'The master navigation interface. Transparent at rest, glass-morphic on scroll.',
            specs: {
                dimensions: 'h-[var(--header-h)] / standard 80px',
                behavior: 'Scroll-triggered visibility, language-aware (i18n), JWT-based profile resolution.',
                tokens: ['header-glass', 'backdrop-blur-md', 'z-50'],
            },
            children: [
                {
                    id: 'header-logo',
                    label: 'Dynamic Logo',
                    description: 'Identity vessel with mode-switching support (light/dark/transparent).',
                    specs: { dimensions: 'h-[40px]' },
                },
                {
                    id: 'header-actions',
                    label: 'Action Cluster',
                    description: 'Home, Catalog, Wishlist (with Animator count), and Profile Dropdown.',
                    specs: { behavior: 'Framer Motion AnimatePresence for previews.' },
                },
            ],
        },
        {
            id: 'bmb-home-hero',
            label: 'Hyper-Aperture Hero (Section 01)',
            description: 'Kinetic entry section with liquid-metal typography and immersive tunnel depth.',
            specs: {
                dimensions: 'min-h-[100svh] / full-viewport',
                behavior: 'Parallax mouse-tracking (delta 30px), Smooth auto-scroll snap to next section.',
                typography: 'Bruno Ace SC (Headings), Inter (Support)',
                colors: ['bg-[#0b0d10]', 'text-white'],
            },
            children: [
                {
                    id: 'home-telemetry-chip',
                    label: 'Telemetry Status Chip',
                    description: 'Interactive pill showing live status and "Lowest EMI" guarantee.',
                    specs: {
                        dimensions: 'h-[44px], px-10',
                        behavior: 'Shimmer gradient animation (6s loop).',
                        tokens: ['backdrop-blur-xl', 'border-white/10'],
                    },
                },
                {
                    id: 'home-main-title',
                    label: 'Liquid Metal Typography',
                    description: 'Verbatim: "The Highest Fidelity Marketplace. MOTORCYCLES."',
                    specs: {
                        typography: '9.5rem font-black, leading-none, tracking-tight',
                        behavior: 'Mouse-controlled background position.',
                        tokens: [
                            'bg-clip-text',
                            'bg-[linear-gradient(110deg,#fff_0%,#fff_40%,#ff9d00_50%,#fff_60%,#fff_100%)]',
                        ],
                    },
                },
            ],
        },
        {
            id: 'bmb-home-bento',
            label: 'Telemetry Bento Grid (Section 01 Bottom)',
            description: '4-column interactive grid for high-level marketplace metrics.',
            specs: {
                dimensions: 'max-w-1440px, gap-4',
                behavior: 'Hover expansion (layout-transition), filtering scale (1.02x).',
            },
            children: [
                {
                    id: 'bento-sku-scanner',
                    label: 'SKU Scanner Block',
                    description: 'Verbatim: "380+ SKU LIVE. India\'s largest curated collection."',
                    specs: {
                        dimensions: 'h-[220px]',
                        tokens: ['zinc-900/60', 'backdrop-blur-3xl', 'group-hover:border-brand-primary'],
                    },
                },
                {
                    id: 'bento-logistics-hub',
                    label: 'Logistics Hub',
                    description: 'Verbatim: "4 Hours. Hyper-local processing ensuring record time delivery."',
                    specs: { behavior: 'Real-time MARKET_METRICS hydration.' },
                },
                {
                    id: 'bento-finance-core',
                    label: 'Savings Calc',
                    description: 'Verbatim: "₹12,000 Avg Savings. Dealer rebate leverage."',
                    specs: { behavior: 'Expanded by default.' },
                },
            ],
        },
        {
            id: 'bmb-home-brands',
            label: 'Elite Makers Syndicate (Section 02)',
            description: 'Cylindrical 3D brand drum with 12 engineering giants.',
            specs: {
                dimensions: 'min-h-screen, grid-cols-12',
                behavior: 'Drum rotation (0.0045 speed), 360-degree interactive cards (radius 375px).',
            },
            children: [
                {
                    id: 'brand-drum-mechanism',
                    label: 'Rotation Engine',
                    description: 'State-driven drum rotation with hover snap-to-front behavior.',
                    specs: { behavior: 'RAF-based animation loop, smooth centering click-handler.' },
                },
                {
                    id: 'brand-card-roster',
                    label: 'Brand Roster',
                    description: 'Taglines: APRILIA (BE A RACER), ATHER (WARP SPEED), CHETAK (LEGEND REBORN), etc.',
                    specs: { tokens: ['preserve-3d', 'backface-hidden', 'glass-texture'] },
                },
            ],
        },
        {
            id: 'bmb-home-process',
            label: 'The Monolith Protocol (Section 03)',
            description: 'Verbatim: "Select. Quote. Ride. Experience the future of ownership."',
            specs: {
                behavior: 'Expanding vertical monolith panels (flex-[3] on hover).',
            },
            children: [
                {
                    id: 'process-selection',
                    label: '01 Selection',
                    description: 'Verbatim: "Live Inventory Feed. 3.8k+ units ready for immediate allocation."',
                    specs: { dimensions: 'rounded-[2rem]' },
                },
                {
                    id: 'process-quotation',
                    label: '02 Quotation',
                    description: 'Verbatim: "Algorithmic Pricing. Zero opacity. No hidden margins."',
                    specs: { behavior: 'Framer motion layout-transition.' },
                },
            ],
        },
        {
            id: 'bmb-home-vibe',
            label: 'The Vibe Selection (Section 04)',
            description: 'Curated collections: Scooters, Motorcycles, Mopeds.',
            specs: {
                behavior: 'Accordion-style category cards with hover image expansion.',
            },
            children: [
                {
                    id: 'vibe-card-scooters',
                    label: 'Scooters Collection',
                    description: 'Verbatim: "Daily commuting made easy with comfort and great mileage."',
                    specs: { tokens: ['bg-white/10', 'backdrop-blur-md', 'glass-morph'] },
                },
            ],
        },
        {
            id: 'bmb-home-reviews',
            label: 'Rider Pulse (Section 05)',
            description: 'Verbatim: "The Community Pulse. Rider Pulse. Real stories. Real roads."',
            specs: {
                behavior: 'Testimonial accordion with color-coded identity splashes.',
            },
        },
        {
            id: 'bmb-home-privilege',
            label: "The O' Circle (Section 06)",
            description: 'Verbatim: "Ownership, accelerated. Zero Downpayment. Zero Processing. Zero Documentation."',
            specs: {
                behavior: 'Privilege tier card expansion with membership card visualizer.',
            },
        },
        {
            id: 'bmb-home-footer',
            label: 'Global Footer (The Final Chapter)',
            description: 'Verbatim: "Redefining How India Rides. Collection, Brands, Ecosystem, Services."',
            specs: {
                dimensions: 'min-h-screen (Split Layout)',
                behavior: 'Section-based site map, social aggregation, diagnostic system portal.',
                tokens: ['carbon-gold-theme', 'snap-start'],
            },
        },
    ],
    marketplace_catalog: [
        {
            id: 'bmb-catalog-router',
            label: 'System Catalog Router',
            description: 'Deterministic navigational engine for Make/Model/Variant resolution.',
            specs: {
                behavior: 'URL-driven filtering, automatic query param hydration.',
            },
            children: [
                {
                    id: 'catalog-discovery-bar',
                    label: 'Discovery Ribbon',
                    description: 'Secondary sticky nav for category switching and global search.',
                    specs: {
                        dimensions: 'h-14 (56px), w-full',
                        behavior: 'Sticky scroll-lock at top-0.',
                    },
                },
                {
                    id: 'catalog-filter-rail',
                    label: 'Refinement Rail (Left)',
                    description: 'Multi-select filtering criteria for technical specs.',
                    specs: {
                        dimensions: 'w-[280px] fixed/static toggle',
                        behavior: 'Collapsible sections, reactive counts.',
                    },
                },
            ],
        },
    ],
    marketplace_pdp: [
        {
            id: 'bmb-pdp-gallery',
            label: 'Cinematic Visual Cockpit',
            description: 'Main product visualizer with 360 viewer fallback.',
            specs: {
                dimensions: 'aspect-[16/9] or square toggle',
                behavior: 'Hover zoom (2x), lazy loading localized assets.',
            },
            children: [
                {
                    id: 'pdp-360-viewer',
                    label: 'Sovereign 360 Rotator',
                    description: 'Frame-perfect 36 frame localized rotation engine.',
                    specs: {
                        behavior: '36-frame sequence, draggable rotation, inertia scroll.',
                        tokens: ['self-hosted-media'],
                    },
                },
            ],
        },
        {
            id: 'bmb-pdp-finance',
            label: 'Finance Personalization Suite',
            description: 'Real-time EMI and Scheme configurator.',
            specs: {
                behavior: 'Slider-driven EMI calculation, dynamic RTO/Insurance resolution.',
            },
            children: [
                {
                    id: 'pdp-emi-slider',
                    label: 'Tenure/Downpayment Slider',
                    description: 'Tactile range inputs for financing.',
                    specs: {
                        colors: ['brand-primary'],
                        behavior: 'Step-based snapping, instant breakdown update.',
                    },
                },
            ],
        },
    ],
};

export default function WhitepaperPage() {
    const [selectedPage, setSelectedPage] = useState('marketplace_home');
    const [expandedIds, setExpandedIds] = useState<string[]>([
        'bmb-home-hero',
        'bmb-catalog-router',
        'bmb-pdp-gallery',
    ]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
    };

    const copyToClipboard = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const BlueprintNode = ({ node, level = 0 }: { node: ComponentBlueprint; level?: number }) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedIds.includes(node.id);

        return (
            <div className={`flex flex-col ${level > 0 ? 'ml-8 mt-4' : 'mb-6'}`}>
                <div className="flex items-start gap-3 group">
                    <div className="mt-1">
                        {hasChildren ? (
                            <button
                                onClick={() => toggleExpand(node.id)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 dark:text-zinc-500 transition-colors"
                            >
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                        ) : (
                            <div className="w-6 h-6 flex items-center justify-center">
                                <Box size={14} className="text-slate-300 dark:text-zinc-700" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 transition-all hover:border-brand-primary/30 relative shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {node.label}
                                <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-zinc-800 text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-widest border border-slate-100 dark:border-zinc-700">
                                    {node.id}
                                </span>
                            </h4>
                            <button
                                onClick={() => copyToClipboard(node.id)}
                                className="p-2 hover:bg-brand-primary/10 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-brand-primary transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                            >
                                {copiedId === node.id ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                {copiedId === node.id ? 'Copied' : 'Copy ID'}
                            </button>
                        </div>

                        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4 pr-12">{node.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {node.specs.dimensions && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-tighter flex items-center gap-1">
                                        <Maximize2 size={10} /> Dimensions
                                    </span>
                                    <p className="text-xs font-mono text-brand-primary/80">{node.specs.dimensions}</p>
                                </div>
                            )}
                            {node.specs.behavior && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-tighter flex items-center gap-1">
                                        <Zap size={10} /> Behavior
                                    </span>
                                    <p className="text-xs text-slate-600 dark:text-zinc-300">{node.specs.behavior}</p>
                                </div>
                            )}
                            {node.specs.typography && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-tighter flex items-center gap-1">
                                        <Layers size={10} /> Typography
                                    </span>
                                    <p className="text-xs text-slate-600 dark:text-zinc-300 italic">
                                        {node.specs.typography}
                                    </p>
                                </div>
                            )}
                            {node.specs.tokens && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-tighter flex items-center gap-1">
                                        <Info size={10} /> Tokens
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {node.specs.tokens.map(token => (
                                            <span
                                                key={token}
                                                className="px-1.5 py-0.5 rounded bg-brand-primary/5 text-brand-primary text-[10px] font-mono border border-brand-primary/10"
                                            >
                                                {token}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && node.children && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden border-l border-slate-200 dark:border-zinc-800/50"
                        >
                            {node.children.map(child => (
                                <BlueprintNode key={child.id} node={child} level={level + 1} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d10] text-slate-900 dark:text-zinc-100 p-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-200 dark:border-zinc-800 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-brand-primary font-bold tracking-widest uppercase text-xs">
                            <Layout size={14} /> System Architecture
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">
                            Marketplace <span className="text-brand-primary">Blueprint</span>
                        </h1>
                        <p className="text-slate-500 dark:text-zinc-500 max-w-2xl">
                            High-fidelity technical documentation for recreating the BookMyBike marketplace experience.
                            Copy identifiers to address specific components in the workspace.
                        </p>
                    </div>

                    <div className="flex gap-2 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                        {Object.keys(BLUEPRINTS).map(key => (
                            <button
                                key={key}
                                onClick={() => setSelectedPage(key)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                    selectedPage === key
                                        ? 'bg-brand-primary text-black'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white dark:hover:bg-zinc-800'
                                }`}
                            >
                                {key.replace('marketplace_', '').replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Rail: Tree View */}
                    <div className="lg:col-span-8">
                        <div className="space-y-4">
                            {BLUEPRINTS[selectedPage].map(node => (
                                <BlueprintNode key={node.id} node={node} />
                            ))}
                        </div>
                    </div>

                    {/* Right Rail: Meta Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Search size={16} className="text-brand-primary" /> How to use
                            </h3>
                            <ul className="space-y-4 text-xs text-slate-500 dark:text-zinc-400">
                                <li className="flex gap-3">
                                    <div className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-none font-bold">
                                        1
                                    </div>
                                    Explore the visual tree to find the exact component or behavior.
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-none font-bold">
                                        2
                                    </div>
                                    Click <b>Copy ID</b> to capture the unique system identifier.
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-none font-bold">
                                        3
                                    </div>
                                    Provide the ID in your request (e.g., "Change the background of{' '}
                                    <code>home-telemetry-chip</code>").
                                </li>
                            </ul>
                        </div>

                        <div className="p-6 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl relative overflow-hidden shadow-sm">
                            <motion.div
                                animate={{ opacity: [0.1, 0.2, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute -top-12 -right-12 w-32 h-32 bg-brand-primary rounded-full blur-[60px]"
                            />
                            <h3 className="text-sm font-bold text-brand-primary uppercase tracking-widest mb-4">
                                Replica Ready
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-4">
                                This blueprint is derived directly from the Production codebase. Dimensions and tokens
                                are 1:1 with the current marketplace build.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black">
                                        Audit Confidence
                                    </span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white italic">
                                        98.5%
                                    </span>
                                </div>
                                <div className="h-8 w-[1px] bg-slate-200 dark:bg-zinc-800" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black">
                                        Tokens
                                    </span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white italic">
                                        42+
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
