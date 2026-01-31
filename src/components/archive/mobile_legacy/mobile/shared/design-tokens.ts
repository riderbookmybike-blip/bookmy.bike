export const MOBILE_DESIGN = {
    // Spacing
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },

    // Typography
    typography: {
        hero: { size: '32px', weight: 'bold', lineHeight: '1.2' },
        h1: { size: '24px', weight: 'bold', lineHeight: '1.3' },
        h2: { size: '20px', weight: '600', lineHeight: '1.4' },
        h3: { size: '16px', weight: '600', lineHeight: '1.4' },
        body: { size: '14px', weight: '400', lineHeight: '1.5' },
        caption: { size: '12px', weight: '400', lineHeight: '1.4' },
        micro: { size: '10px', weight: '700', lineHeight: '1.2' },
    },

    // Touch Targets
    touchTarget: {
        min: 48, // iOS/Android standard
        comfortable: 56,
    },

    // Layout
    layout: {
        headerHeight: 56,
        bottomNavHeight: 64,
        maxWidth: 768,
    },

    // Colors (Indian Flag + Brand)
    colors: {
        saffron: '#FF9933',
        white: '#FFFFFF',
        green: '#138808',
        primary: '#FF5F1F', // Brand orange
    },
};
