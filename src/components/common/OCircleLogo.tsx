'use client';

import React from 'react';

interface OCircleLogoProps {
    size?: number;
    className?: string;
    strokeWidth?: number;
    color?: string;
}

export const OCircleLogo: React.FC<OCircleLogoProps> = ({
    size = 32,
    className = '',
    strokeWidth = 12,
    color = 'currentColor',
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* The 'C' Arc - Sliced O */}
            <path d="M84.4 34 A 38 38 0 1 0 84.4 66" stroke={color} strokeWidth={26} strokeLinecap="butt" fill="none" />

            {/* The Completion Piece - Sliced Segment */}
            <path
                d="M89.4 43.1 A 38 38 0 0 1 89.4 56.9"
                stroke={color}
                strokeWidth={26}
                strokeLinecap="butt"
                fill="none"
            />
        </svg>
    );
};
