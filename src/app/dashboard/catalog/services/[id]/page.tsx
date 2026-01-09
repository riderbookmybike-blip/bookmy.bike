'use client';

import React from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import RoleGuard from '@/components/auth/RoleGuard';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Sparkles, Settings } from 'lucide-react';

const SERVICES_DATA = [
    { id: 'SVC-RTO-01', name: 'RTO Handling', type: 'Handling', gst: '18%', price: 'Fixed', value: 1500 },
    { id: 'SVC-AMC-01', name: '1 Year AMC', type: 'AMC', gst: '18%', price: 'Fixed', value: 3500 },
    { id: 'SVC-FGM-01', name: 'Fastag', type: 'Other', gst: 'Exempt', price: 'Fixed', value: 500 },
];

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id ? decodeURIComponent(params.id as string) : null;
    const service = SERVICES_DATA.find(s => s.id === id);

    const handleClose = () => router.push('/catalog/services');

    return (
        <RoleGuard resource="catalog-services" action="view">
            <MasterListDetailLayout mode="detail-only">
                <div />
                <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-500">
                    {/* Header */}
                    <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <button className="p-2 -ml-2 text-slate-400 hover:text-blue-600 transition-colors" onClick={handleClose}>
                                <ChevronLeft size={24} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none mb-1">
                                    {service?.name || 'New Service'}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={10} className="text-blue-500" /> Service Configuration & Pricing
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Placeholder Content */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 dark:bg-slate-950/50">
                        <div className="w-24 h-24 bg-white dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl border border-slate-100 dark:border-white/5">
                            <Settings size={40} className="text-blue-600 animate-spin-slow" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-2">Service Editor under Construction</h3>
                        <p className="text-xs text-slate-500 font-bold max-w-[320px] leading-relaxed uppercase tracking-widest opacity-60">
                            The advanced service pricing engine is being calibrated. Please check back soon.
                        </p>
                    </div>
                </div>
            </MasterListDetailLayout>
        </RoleGuard>
    );
}
