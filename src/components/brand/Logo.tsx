import React, { useMemo } from 'react';
import { ICON_PATHS, TAGLINE_PATHS, BRAND_BLUE } from './paths';
import { useTheme } from '@/components/providers/ThemeProvider';

interface LogoProps {
    className?: string;
    iconClassName?: string;
    mode?: 'auto' | 'light' | 'dark';
    variant?: 'full' | 'icon' | 'wordmark';
    monochrome?: 'none' | 'white' | 'black' | 'gold' | 'silver';
    size?: 'sm' | 'md' | 'lg' | number;
    style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({
    className = "",
    iconClassName = "",
    mode = 'auto',
    variant = 'full',
    monochrome = 'none',
    size = 'md',
    style = {}
}) => {
    const { theme } = useTheme();

    const heights = useMemo(() => {
        let h: number;
        if (typeof size === 'number') {
            h = size;
        } else {
            switch (size) {
                case 'sm': h = 28; break;
                case 'lg': h = 48; break;
                case 'md':
                default: h = 36; break;
            }
        }

        return {
            iconH: `${h * 1.1}px`, // Icon at 110% of base height for presence
            iconW: `${(h * 1.1) * (80 / 109)}px`,
            textH: `${h * 0.82}px` // Text at 82% of base height to align with Icon's optically center
        };
    }, [size]);

    // Determine target mode (handle auto)
    const activeMode = useMemo(() => {
        if (mode !== 'auto') return mode;
        return (theme === 'dark' || theme === 'system') ? 'dark' : 'light';
    }, [mode, theme]);

    // Color Logic based on Variants and Monochrome overrides
    const colors = useMemo(() => {
        if (monochrome === 'white') {
            return { icon: "#FFFFFF", bookmy: "#FFFFFF", bike: "#FFFFFF" };
        }
        if (monochrome === 'black') {
            return { icon: "#000000", bookmy: "#000000", bike: "#000000" };
        }
        if (monochrome === 'gold') {
            return { icon: "url(#gold-gradient)", bookmy: "url(#gold-gradient)", bike: "url(#gold-gradient)" };
        }
        if (monochrome === 'silver') {
            return { icon: "url(#silver-gradient)", bookmy: "url(#silver-gradient)", bike: "url(#silver-gradient)" };
        }

        // Standard Themed Variants
        if (activeMode === 'dark') {
            return {
                icon: BRAND_BLUE,
                bookmy: "#FFFFFF",
                bike: BRAND_BLUE
            };
        }

        // Default Light Mode
        return {
            icon: BRAND_BLUE,
            bookmy: "#000000",
            bike: BRAND_BLUE
        };
    }, [activeMode, monochrome]);

    const isMetallic = monochrome === 'gold' || monochrome === 'silver';

    const renderGradients = () => (
        <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#BF953F" />
                <stop offset="25%" stopColor="#FCF6BA" />
                <stop offset="50%" stopColor="#B38728" />
                <stop offset="75%" stopColor="#FBF5B7" />
                <stop offset="100%" stopColor="#AA771C" />
            </linearGradient>
            <linearGradient id="silver-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C0C0C0" />
                <stop offset="25%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#808080" />
                <stop offset="75%" stopColor="#D3D3D3" />
                <stop offset="100%" stopColor="#A9A9A9" />
            </linearGradient>
        </defs>
    );

    const renderIcon = () => (
        <svg
            viewBox="0 0 80 109"
            fill="none"
            style={{ height: heights.iconH, width: heights.iconW }}
            className={`${iconClassName} transition-transform group-hover:scale-105 duration-500 shrink-0 ${isMetallic ? 'animate-shimmer' : ''}`}
        >
            {renderGradients()}
            {ICON_PATHS.PRIMARY.map((d, i) => (
                <path key={i} d={d} fill={colors.icon} />
            ))}
        </svg>
    );

    const renderWordmark = () => (
        <div
            style={{ height: heights.textH, fontSize: heights.textH, lineHeight: 1 }}
            className={`flex items-center font-sans font-semibold tracking-[-0.03em] shrink-0 transition-all duration-300 ${isMetallic ? 'animate-shimmer' : ''}`}
        >
            <svg style={{ height: heights.textH, width: 'auto', overflow: 'visible' }}>
                {renderGradients()}
                <text
                    y="80%"
                    fill={colors.bookmy}
                    style={{ font: 'inherit' }}
                >
                    bookmy
                </text>
                {/* Manual offset for .bike */}
                <text
                    x="250"
                    y="80%"
                    fill={colors.bike}
                    style={{ font: 'inherit' }}
                >
                    .bike
                </text>
            </svg>
        </div>
    );

    // Re-implementing wordmark with SVG for gradient support on text
    const renderWordmarkSVG = () => (
        <div
            style={{ height: heights.textH }}
            className={`flex items-center font-sans font-semibold tracking-[-0.03em] shrink-0 transition-all duration-300 ${isMetallic ? 'animate-shimmer' : ''}`}
        >
            <svg
                viewBox="0 0 350 40"
                style={{ height: heights.textH, width: 'auto', overflow: 'visible' }}
                preserveAspectRatio="xMinYMid meet"
            >
                {renderGradients()}
                <text
                    x="0"
                    y="32"
                    className="font-sans font-semibold"
                    style={{ fontSize: '38px', letterSpacing: '-0.03em' }}
                >
                    <tspan fill={colors.bookmy}>bookmy</tspan>
                    <tspan fill={colors.bike}>.bike</tspan>
                </text>
            </svg>
        </div>
    );

    return (
        <div
            className={`flex items-center gap-2 group transition-all duration-300 ${className}`}
            style={style}
        >
            {(variant === 'full' || variant === 'icon') && renderIcon()}
            {(variant === 'full' || variant === 'wordmark') && renderWordmarkSVG()}

            <style jsx global>{`
                @keyframes shimmer {
                    0% { filter: brightness(1); }
                    50% { filter: brightness(1.3); }
                    100% { filter: brightness(1); }
                }
                .animate-shimmer {
                    animation: shimmer 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};


