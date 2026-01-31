import React, { useMemo } from 'react';
import { ICON_PATHS, TAGLINE_PATHS, BRAND_GOLD } from './paths';
import { useTheme } from '@/components/providers/ThemeProvider';

interface LogoProps {
    className?: string;
    iconClassName?: string;
    mode?: 'auto' | 'light' | 'dark';
    variant?: 'full' | 'icon' | 'wordmark';
    monochrome?: 'none' | 'white' | 'black' | 'gold' | 'silver';
    size?: 'sm' | 'md' | 'lg' | number;
    customColor?: string;
    customColors?: {
        icon?: string;
        bookmy?: string;
        bike?: string;
    };
    style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({
    className = '',
    iconClassName = '',
    mode = 'auto',
    variant = 'full',
    monochrome = 'none',
    customColor,
    customColors,
    size = 'md',
    style = {},
}) => {
    const [mounted, setMounted] = React.useState(false);
    const { theme } = useTheme();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const heights = useMemo(() => {
        let h: number;
        if (typeof size === 'number') {
            h = size;
        } else {
            switch (size) {
                case 'sm':
                    h = 28;
                    break;
                case 'lg':
                    h = 48;
                    break;
                case 'md':
                default:
                    h = 36;
                    break;
            }
        }

        return {
            iconH: `${h * 1.1}px`, // Icon at 110% of base height for presence
            iconW: `${h * 1.1 * (80 / 109)}px`,
            textH: `${h * 0.82}px`, // Text at 82% of base height to align with Icon's optically center
        };
    }, [size]);

    // Determine target mode (handle auto)
    const activeMode = useMemo(() => {
        if (!mounted) return mode === 'auto' ? 'light' : mode;
        if (mode !== 'auto') return mode;
        if (theme === 'dark') return 'dark';
        if (theme === 'system') {
            return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    }, [mode, theme, mounted]);

    // Color Logic based on Variants and Monochrome overrides
    const colors = useMemo(() => {
        // Granular overrides if provided
        if (customColors) {
            return {
                icon: customColors.icon || (activeMode === 'dark' ? BRAND_GOLD : BRAND_GOLD),
                bookmy: customColors.bookmy || (activeMode === 'dark' ? '#FFFFFF' : '#000000'),
                bike: customColors.bike || (activeMode === 'dark' ? BRAND_GOLD : BRAND_GOLD),
            };
        }

        // Legacy single custom color fallback (can be deprecated or kept for simple usage)
        if (customColor) {
            return { icon: customColor, bookmy: customColor, bike: customColor };
        }

        if (monochrome === 'white') {
            return { icon: '#FFFFFF', bookmy: '#FFFFFF', bike: '#FFFFFF' };
        }
        if (monochrome === 'black') {
            return { icon: '#000000', bookmy: '#000000', bike: '#000000' };
        }
        if (monochrome === 'gold') {
            return { icon: 'url(#gold-gradient)', bookmy: 'url(#gold-gradient)', bike: 'url(#gold-gradient)' };
        }
        if (monochrome === 'silver') {
            return { icon: 'url(#silver-gradient)', bookmy: 'url(#silver-gradient)', bike: 'url(#silver-gradient)' };
        }

        // Standard Themed Variants
        if (activeMode === 'dark') {
            return {
                icon: BRAND_GOLD,
                bookmy: '#FFFFFF',
                bike: BRAND_GOLD,
            };
        }

        // Default Light Mode
        return {
            icon: BRAND_GOLD,
            bookmy: '#000000',
            bike: BRAND_GOLD,
        };
    }, [activeMode, monochrome, customColor, customColors]);

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
            className={`${iconClassName} transition-transform group-hover:scale-105 duration-500 ${isMetallic ? 'animate-shimmer' : ''}`}
        >
            {renderGradients()}
            {ICON_PATHS.PRIMARY.map((d, i) => (
                <path key={i} d={d} fill={colors.icon} />
            ))}
        </svg>
    );

    // Re-implementing wordmark with SVG for gradient support on text
    const renderWordmarkSVG = () => (
        <div
            style={{ height: heights.textH }}
            className={`flex items-center font-sans font-bold tracking-[-0.03em] transition-all duration-300 ${isMetallic ? 'animate-shimmer' : ''}`}
        >
            <svg
                viewBox="0 0 215 40"
                style={{ height: heights.textH, width: 'auto', overflow: 'visible' }}
                preserveAspectRatio="xMinYMid meet"
            >
                {renderGradients()}
                <text
                    x="0"
                    y="32"
                    className="font-sans font-bold"
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
            className={`flex items-center justify-center gap-2 group transition-all duration-300 h-full ${className}`}
            style={style}
        >
            {(variant === 'full' || variant === 'icon') && renderIcon()}
            {(variant === 'full' || variant === 'wordmark') && renderWordmarkSVG()}

            <style jsx global>{`
                @keyframes shimmer {
                    0% {
                        filter: brightness(1) contrast(1);
                    }
                    15% {
                        filter: brightness(1.4) contrast(1.1);
                    }
                    30% {
                        filter: brightness(1) contrast(1);
                    }
                    100% {
                        filter: brightness(1) contrast(1);
                    }
                }
                .animate-shimmer {
                    animation: shimmer 4s infinite linear;
                }
            `}</style>
        </div>
    );
};
