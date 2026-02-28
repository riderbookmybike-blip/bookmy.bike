/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    darkMode: 'class', // Enables class-based toggling (.dark)
    theme: {
        screens: {
            sm: '640px',
            md: '768px',
            lg: '900px', // Desktop threshold for TVs (960x540)
            xl: '1280px',
            '2xl': '1536px',
            'h-sm': { raw: '(max-height: 820px)' },
            'h-md': { raw: '(max-height: 900px)' },
            'wide-short': { raw: '(min-width: 1536px) and (max-height: 900px)' },
        },
        extend: {
            // [AUMS] Inject Design Tokens
            colors: {
                ...require('./src/config/design-tokens').colors, // eslint-disable-line @typescript-eslint/no-require-imports
            },
            fontFamily: {
                'bruno-ace': ['var(--font-bruno-ace)'],
            },
            animation: {
                'pulse-slower': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'gradient-x': 'gradient-x 15s ease infinite',
                'bounce-slow': 'bounce 3s infinite',
                scan: 'scan 3s linear infinite',
                marquee: 'marquee 120s linear infinite',
                'marquee-reverse': 'marquee-reverse 120s linear infinite',
            },
            keyframes: {
                scan: {
                    '0%': { top: '0%' },
                    '100%': { top: '100%' },
                },
                'gradient-x': {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center',
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center',
                    },
                },
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
                'marquee-reverse': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0%)' },
                },
            },
        },
    },
    plugins: [],
};
