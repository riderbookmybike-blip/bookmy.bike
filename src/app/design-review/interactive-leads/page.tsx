'use client';

import React, { useState } from 'react';
import {
    LayoutGrid,
    Layers,
    Type,
    Zap,
    Monitor,
    ChevronLeft,
    Search,
    Filter,
    MoreVertical,
    Phone,
    MessageSquare,
    Calendar,
    ArrowUpRight
} from 'lucide-react';

// Import template components (we will create these next)
import { ExecutivePulse } from '@/components/modules/leads/templates/ExecutivePulse';
import { GlassmorphicFlow } from '@/components/modules/leads/templates/GlassmorphicFlow';
import { MinimalistSlate } from '@/components/modules/leads/templates/MinimalistSlate';
import { BrutalistPunch } from '@/components/modules/leads/templates/BrutalistPunch';
import { SaaSUnified } from '@/components/modules/leads/templates/SaaSUnified';

type TemplateType = 'executive' | 'glass' | 'minimalist' | 'brutalist' | 'saas';

const templates = [
    { id: 'executive', name: 'Executive Pulse', icon: LayoutGrid, desc: 'Data-Dense & Analytical' },
    { id: 'glass', name: 'Glassmorphic Flow', icon: Layers, desc: 'Depth & Visual Hierarchy' },
    { id: 'minimalist', name: 'Minimalist Slate', icon: Type, desc: 'Editorial & Content-First' },
    { id: 'brutalist', name: 'Brutalist Punch', icon: Zap, desc: 'Impact & Recognition' },
    { id: 'saas', name: 'SaaS Unified', icon: Monitor, desc: 'Actionable & Balanced' },
];

const mockLead = {
    id: 'lead_1',
    name: 'Marcus Thorne',
    company: 'Aeon Industries',
    role: 'Chief Technology Officer',
    status: 'Qualified',
    intent_score: 92,
    phone: '+91 98765 43210',
    email: 'marcus@aeon.com',
    source: 'Direct Referral',
    location: 'Mumbai, MH',
    last_active: '12 mins ago',
    tags: ['High Value', 'Tier 1', 'Strategic'],
    stats: {
        emails_sent: 24,
        calls_made: 8,
        meetings_held: 3,
        deal_value: '₹12.5L'
    }
};

export default function InteractiveLeadsReview() {
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('executive');

    const renderTemplate = () => {
        switch (selectedTemplate) {
            case 'executive': return <ExecutivePulse lead={mockLead} />;
            case 'glass': return <GlassmorphicFlow lead={mockLead} />;
            case 'minimalist': return <MinimalistSlate lead={mockLead} />;
            case 'brutalist': return <BrutalistPunch lead={mockLead} />;
            case 'saas': return <SaaSUnified lead={mockLead} />;
            default: return <ExecutivePulse lead={mockLead} />;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
            {/* Template Selection Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl z-50">
                <div className="flex items-center gap-6">
                    <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-zinc-500" />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold tracking-tighter uppercase italic text-zinc-400">Layout Experimentation</h1>
                        <p className="text-[10px] text-zinc-600 font-mono">/DESIGN-REVIEW/INTERACTIVE-LEADS</p>
                    </div>
                </div>

                <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
                    {templates.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedTemplate(t.id as TemplateType)}
                            className={`flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all duration-300 ${selectedTemplate === t.id
                                ? 'bg-white text-black shadow-lg shadow-white/10 scale-105'
                                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                                }`}
                        >
                            <t.icon className={`w-4 h-4 ${selectedTemplate === t.id ? 'text-black' : 'text-zinc-500'}`} />
                            <span className="text-xs font-black uppercase tracking-widest">{t.name}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dynamic Template Viewport */}
            <div className="flex-1 overflow-hidden">
                {renderTemplate()}
            </div>
        </div>
    );
}

function Plus({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )
}
