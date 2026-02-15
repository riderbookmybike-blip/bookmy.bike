import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface TFTIndicatorProps {
    icon: LucideIcon;
    active: boolean;
    color?: string;
    label: string;
}

export const TFTIndicator = ({ icon: Icon, active, color = 'var(--tft-cyan)', label }: TFTIndicatorProps) => {
    return (
        <div className="flex flex-col items-center gap-2 group cursor-help" title={label}>
            <div
                className={`
                    p-3 rounded-xl border-2 transition-all duration-300
                    ${
                        active
                            ? 'bg-transparent border-white/20'
                            : 'bg-black/40 border-white/5 opacity-20 filter grayscale'
                    }
                `}
                style={{
                    color: active ? color : 'rgba(255,255,255,0.1)',
                    boxShadow: active ? `0 0 20px ${color}20` : 'none',
                }}
            >
                <Icon size={18} strokeWidth={active ? 3 : 2} className={active ? 'tft-indicator-glow' : ''} />
            </div>
            <span
                className={`text-[8px] font-black uppercase tracking-[0.2em] transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
            >
                {label}
            </span>
        </div>
    );
};

export const TFTIndicatorBank = ({ indicators }: { indicators: TFTIndicatorProps[] }) => {
    return (
        <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
            {indicators.map((ind, i) => (
                <TFTIndicator key={i} {...ind} />
            ))}
        </div>
    );
};
