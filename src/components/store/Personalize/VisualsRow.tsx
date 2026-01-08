import React from 'react';
import ChromelessVideo from '@/components/ui/ChromelessVideo';

interface ColorOption {
    id: string;
    name: string;
    hex: string;
    class: string;
}

interface VisualsRowProps {
    colors: ColorOption[];
    selectedColor: string;
    onColorSelect: (id: string) => void;
    productImage: string;
    videoSource: string;
    className?: string;
}

export default function VisualsRow({
    colors,
    selectedColor,
    onColorSelect,
    productImage,
    videoSource,
    className = ''
}: VisualsRowProps) {
    const activeColorName = colors.find(c => c.id === selectedColor)?.name;

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 h-auto md:h-[500px] ${className}`}>

            {/* LEFT: Image + Color Selector */}
            <div className="relative h-[480px] md:h-full bg-white dark:bg-[#050505] rounded-[3.5rem] ring-1 ring-slate-100 dark:ring-white/10 overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:shadow-2xl flex flex-col justify-between transition-all duration-700">
                {/* 1. Atmospheric Spotlight (Dynamic Glow) */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)] opacity-50 animate-pulse-slow" />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-500/5 dark:to-purple-500/5" />
                </div>

                {/* 2. Enhanced Image Blending */}
                <div className="absolute inset-0 z-10 p-12 flex items-center justify-center">
                    <img
                        src={productImage || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop"}
                        alt="Vehicle Mockup"
                        className="w-full h-auto object-contain brightness-[1.05] contrast-[1.05] drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_30px_60px_rgba(0,0,0,0.8)] group-hover:scale-[1.03] transition-transform duration-[2000ms] cubic-bezier(0.2, 0, 0, 1)"
                    />
                    {/* Floor Reflection/Shadow */}
                    <div className="absolute bottom-[20%] w-[80%] h-4 bg-black/10 dark:bg-black/40 blur-[30px] dark:blur-[40px] rounded-full scale-x-125" />
                </div>

                {/* 3. Luxury Floating Badge */}
                <div className="relative z-20 p-10">
                    <span className="font-black text-[9px] bg-slate-100 dark:bg-white/5 backdrop-blur-2xl px-5 py-2.5 rounded-full uppercase tracking-[0.3em] text-slate-500 dark:text-white/50 border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl">
                        Studio Edition
                    </span>
                </div>

                {/* 4. Bottom Glass Panel: Paint & Selector */}
                <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-white dark:from-black via-white/90 dark:via-black/90 to-transparent pointer-events-none" />

                <div className="relative flex items-center justify-between gap-6 px-8 pb-8 z-30">
                    <div className="max-w-[65%]">
                        <h2 className="text-lg md:text-2xl font-black uppercase italic text-slate-900 dark:text-white tracking-tighter leading-[0.9] break-words line-clamp-3">
                            {activeColorName}
                        </h2>
                    </div>

                    {/* Minimized Color Selector (Underline Style) */}
                    <div className="flex gap-4">
                        {colors.map(color => {
                            const isSelected = selectedColor === color.id;
                            return (
                                <button
                                    key={color.id}
                                    onClick={() => onColorSelect(color.id)}
                                    className="group relative flex flex-col items-center justify-center"
                                >
                                    {/* Color Circle - Height matched to text (approx 24px-28px) */}
                                    <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full shadow-inner border border-black/10 dark:border-white/10 ${color.class}`} />

                                    {/* Selection Indicator (Underline - Absolute to not affecting positioning) */}
                                    <div className={`absolute -bottom-2 h-0.5 rounded-full transition-all duration-300 ${isSelected
                                        ? 'w-full bg-slate-900 dark:bg-white'
                                        : 'w-0 bg-transparent'
                                        }`}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* RIGHT: Cinematic Performance Hub */}
            <div className="relative h-[350px] md:h-full bg-slate-100 dark:bg-black rounded-[3.5rem] overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <ChromelessVideo videoId={videoSource} />

                {/* Luxury Live Overlay */}
                <div className="absolute top-10 right-10 z-20">
                    <span className="font-black text-[9px] bg-red-600/10 backdrop-blur-3xl px-5 py-2.5 rounded-full uppercase tracking-[0.3em] text-red-600 dark:text-red-500 border border-red-500/20 flex items-center gap-3 shadow-2xl">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full absolute" />
                        Live Feed
                    </span>
                </div>

                {/* Cinematic Vignette - Adaptive */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(241,245,249,0.5)_90%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,black_80%)] pointer-events-none opacity-40" />
            </div>

        </div >
    );
}
