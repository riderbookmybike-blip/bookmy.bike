'use client';

import React from 'react';
import StatusBadge, { Tone } from './StatusBadge';

interface TablePreviewProps {
    variant?: 'mobile' | 'desktop';
}

const rows: { id: string; name: string; status: string; stage: string; updated: string; tone: Tone }[] = [
    { id: 'LD-102', name: 'Kunal Shetty', status: 'HOT', stage: 'Follow Up', updated: '2h ago', tone: 'rose' },
    { id: 'LD-118', name: 'Ritu Singh', status: 'WARM', stage: 'Quote Sent', updated: '1d ago', tone: 'amber' },
    { id: 'LD-140', name: 'Arun Nair', status: 'NEW', stage: 'Assigned', updated: '3d ago', tone: 'indigo' },
];

export default function TablePreview({ variant = 'desktop' }: TablePreviewProps) {
    const isMobile = variant === 'mobile';
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900/40">
            <table className={`w-full text-left ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">
                    <tr>
                        <th className={`px-4 ${isMobile ? 'py-2' : 'py-3'}`}>Lead</th>
                        <th className={`px-4 ${isMobile ? 'py-2' : 'py-3'}`}>Status</th>
                        <th className={`px-4 ${isMobile ? 'py-2' : 'py-3'}`}>Stage</th>
                        <th className={`px-4 ${isMobile ? 'py-2' : 'py-3'}`}>Updated</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {rows.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className={`px-4 ${isMobile ? 'py-2' : 'py-3'} font-bold text-slate-700 dark:text-slate-200`}>
                                {row.name}
                                <div className="text-[9px] font-mono text-slate-400">{row.id}</div>
                            </td>
                            <td className={`px-4 ${isMobile ? 'py-2' : 'py-3'}`}>
                                <StatusBadge label={row.status} tone={row.tone} />
                            </td>
                            <td className={`px-4 ${isMobile ? 'py-2' : 'py-3'} text-slate-500 dark:text-slate-300`}>{row.stage}</td>
                            <td className={`px-4 ${isMobile ? 'py-2' : 'py-3'} text-slate-400`}>{row.updated}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
