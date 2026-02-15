import React from 'react';
import { motion } from 'framer-motion';

interface TFTClusterProps {
    children: React.ReactNode;
    title?: string;
    status?: string;
}

export const TFTCluster = ({ children, title = 'SYSTEM READY', status = 'CONNECTED' }: TFTClusterProps) => {
    return (
        <div className="tft-viewport flex items-center justify-center p-4">
            <div className="w-full max-w-[1400px]">
                {/* Physical Cluster Frame Surround */}
                <div className="tft-cluster-frame p-1 shadow-2xl">
                    {/* Digital Screen Area */}
                    <div className="relative min-h-[700px] tft-lcd-grid flex flex-col p-10 overflow-hidden">
                        {/* Status Header Bar */}
                        <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-3 w-3 rounded-full bg-[#FFD700] tft-indicator-glow" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFD700]">
                                    {status}
                                </span>
                            </div>
                            <h1 className="text-xl font-black italic tracking-widest text-[#555] opacity-50 uppercase">
                                {title}
                            </h1>
                            <div className="text-[10px] font-black text-slate-500 tft-number">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 relative z-10">{children}</div>

                        {/* Bottom Utility Bar */}
                        <div className="mt-auto pt-8 border-t border-white/5 flex justify-between items-end">
                            <div className="flex gap-1 border-l border-tft-orange pl-3">
                                <span className="text-[12px] font-black text-white italic tracking-tighter racing-italic">
                                    BMB
                                </span>
                                <span className="text-[12px] font-black text-tft-orange italic tracking-tighter racing-italic">
                                    TFT.OS_v2.0
                                </span>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full w-2/3 bg-tft-cyan animate-pulse" />
                                </div>
                            </div>
                        </div>

                        {/* LCD Glare Overlay (Subtle) */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
                    </div>
                </div>
            </div>
        </div>
    );
};
