import React from 'react';
import { ICON_PATHS, TEXT_PATHS, TAGLINE_PATHS } from './paths';

interface LogoProps {
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    variant?: 'red' | 'blue' | 'light' | 'indigo';
    showText?: boolean;
    showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
    className = "",
    iconClassName = "w-10 h-auto",
    textClassName = "h-6 w-auto",
    variant = 'red',
    showText = true,
    showTagline = false
}) => {
    const isBlue = variant === 'blue';
    const isLight = variant === 'light';

    // Primary brand colors from SVG assets
    const RED_COLOR = "#EF1D26";
    const BLUE_COLOR = "#2B7FFF";
    const BLACK_COLOR = "#000000";
    const WHITE_COLOR = "#FFFFFF";

    const getColors = () => {
        if (isLight) {
            return {
                icon: WHITE_COLOR,
                bookmy: WHITE_COLOR,
                bike: WHITE_COLOR,
                tagline: WHITE_COLOR
            };
        }
        if (isBlue) {
            return {
                icon: BLUE_COLOR,
                bookmy: "currentColor",
                bike: BLUE_COLOR,
                tagline: "currentColor"
            };
        }
        if (variant === 'indigo') {
            return {
                icon: "#4F46E5", // Indigo-600
                bookmy: "currentColor",
                bike: "#4F46E5",
                tagline: "currentColor"
            };
        }
        return {
            icon: RED_COLOR,
            bookmy: "currentColor",
            bike: RED_COLOR,
            tagline: "currentColor"
        };
    };

    const colors = getColors();

    const getIcon = () => (
        <svg viewBox="0 0 80 109" fill="none" className={`${iconClassName} transition-transform group-hover:scale-105 duration-500`}>
            {ICON_PATHS.PRIMARY.map((d, i) => (
                <path key={i} d={d} fill={colors.icon} />
            ))}
        </svg>
    );

    const getText = () => (
        <div className={`font-sans font-semibold tracking-tighter leading-none flex items-baseline ${textClassName === "h-6 w-auto" ? "text-[32px]" : textClassName}`}>
            <span style={{ color: colors.bookmy }}>bookmy</span>
            <span style={{ color: colors.bike }}>.bike</span>
        </div>
    );

    const getTagline = () => (
        <svg viewBox="0 0 156 11" fill="none" className="w-full h-auto mt-1">
            {TAGLINE_PATHS.map((d, i) => (
                <path key={i} d={d} fill={colors.tagline} />
            ))}
        </svg>
    );

    return (
        <div className={`flex items-center gap-2 group ${className}`}>
            {getIcon()}
            {(showText || showTagline) && (
                <div className="flex flex-col justify-center">
                    {showText && getText()}
                    {showTagline && getTagline()}
                </div>
            )}
        </div>
    );
};
