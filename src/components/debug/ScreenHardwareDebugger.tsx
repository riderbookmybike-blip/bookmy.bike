'use client';

import React, { useState, useEffect } from 'react';
import { isTvUserAgent, isHandheldPhoneUserAgent } from '@/lib/utils/deviceUserAgent';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { X, Monitor, Smartphone, Tv } from 'lucide-react';

export const ScreenHardwareDebugger = ({ onClose }: { onClose: () => void }) => {
    const [info, setInfo] = useState<any>(null);
    const { device } = useBreakpoint();

    useEffect(() => {
        const updateInfo = () => {
            const ua = navigator.userAgent;
            const isTv = isTvUserAgent(ua);
            const isPhoneUA = isHandheldPhoneUserAgent(ua);

            const isCoarse = window.matchMedia('(pointer: coarse)').matches;
            const isHover = window.matchMedia('(hover: hover)').matches;

            setInfo({
                window: `${window.innerWidth} x ${window.innerHeight}`,
                screen: `${window.screen.width} x ${window.screen.height}`,
                dpr: window.devicePixelRatio,
                ua,
                isTv,
                isPhoneUA,
                device, // from useBreakpoint
                pointer: isCoarse ? 'COARSE (Touch/Remote)' : 'FINE (Mouse)',
                hover: isHover ? 'HOVER supported' : 'NO HOVER',
            });
        };

        updateInfo();
        window.addEventListener('resize', updateInfo);
        return () => window.removeEventListener('resize', updateInfo);
    }, [device]);

    if (!info) return null;

    return (
        <div className="fixed inset-x-4 bottom-24 z-[100] md:left-auto md:right-6 md:w-96 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 text-white font-mono text-[10px] relative overflow-hidden">
                {/* Background Accent */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-cyan-500/20 blur-3xl rounded-full" />

                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2 text-cyan-400">
                        {info.isTv ? (
                            <Tv size={14} />
                        ) : info.device === 'phone' ? (
                            <Smartphone size={14} />
                        ) : (
                            <Monitor size={14} />
                        )}
                        <span className="font-black uppercase tracking-widest text-[11px]">Hardware Diagnostics</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <DebugItem label="LOGICAL VIEWPORT" value={info.window} />
                        <DebugItem label="PHYSICAL SCREEN" value={info.screen} />
                        <DebugItem label="PIXEL RATIO (DPR)" value={info.dpr} />
                        <DebugItem label="RESOLVED DEVICE" value={info.device.toUpperCase()} highlight />
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/5">
                        <DebugItem label="POINTER TYPE" value={info.pointer} />
                        <DebugItem label="HOVER ABILITY" value={info.hover} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <DebugItem label="TV DETECTED" value={info.isTv ? 'YES ✅' : 'NO'} success={info.isTv} />
                        <DebugItem label="PHONE UA" value={info.isPhoneUA ? 'YES 📱' : 'NO'} />
                    </div>

                    <div className="pt-2 border-t border-white/5">
                        <p className="text-[8px] text-slate-500 uppercase font-black mb-1">User Agent</p>
                        <div className="bg-black/40 p-2 rounded-lg text-[9px] text-slate-300 break-all leading-tight border border-white/5">
                            {info.ua}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex justify-between items-center text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                    <span>BOOKMYBIKE CORE ENGINE</span>
                    <span className="text-cyan-500/50 italic">v2.1-stable</span>
                </div>
            </div>
        </div>
    );
};

const DebugItem = ({
    label,
    value,
    highlight,
    success,
}: {
    label: string;
    value: any;
    highlight?: boolean;
    success?: boolean;
}) => (
    <div>
        <p className="text-[8px] text-slate-500 uppercase font-black mb-0.5">{label}</p>
        <p className={`font-bold ${highlight ? 'text-cyan-400' : success ? 'text-green-400' : 'text-slate-200'}`}>
            {value}
        </p>
    </div>
);
