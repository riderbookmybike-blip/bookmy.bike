/**
 * AUMS Design System - Single Source of Truth
 * 
 * This file contains all the "DNA" of the brand.
 * Any change here automatically updates the entire application.
 */

module.exports = {
    // 1. BRAND COLORS (The "Rang")
    colors: {
        // Primary Brand Identity (The "Gold")
        aums: {
            gold: '#FFD700',        // Main Brand Color (Cyber Yellow)
            blue: '#000000',        // Replaced Blue with Black for primary actions
            dark: '#020617',        // Deep Background (Slate-950)
            light: '#FFFFFF',       // Pure White
            slate: '#64748B',       // Neutral Text (Slate-500)
            success: '#10B981',     // Success Green (Emerald-500)
            warning: '#F59E0B',     // Warning Amber
            error: '#EF4444',       // Error Red
        },
        // Semantic Roles (How we use them - Aliases)
        brand: {
            primary: '#FFD700',     // Use for Logo, Icon Color (Cyber Yellow)
            accent: '#FFD700',      // Use for Buttons, Links, Highlights (Yellow)
            secondary: '#020617',   // Use for Secondary actions (Black)
            surface: '#FFFFFF',     // Card backgrounds
            muted: '#F1F5F9',       // Muted backgrounds (Slate-100)
        }
    },

    // 2. ASSETS (Logos & Icons)
    assets: {
        logo: {
            // Primary B Icon
            path: "M19.8104 12.3688C19.8104 12.3688 27.5471 10.8887 25.5022 16.0936C24.8351 17.7928 4.76066 76.5214 2.72546 83.1042C0.690261 89.6869 -0.122845 92.3016 6.01197 92.3016C7.67226 92.3016 10.394 90.9869 11.7037 87.9195C13.1157 84.6282 31.6857 37.2002 37.762 16.3078C40.8538 5.67898 33.1999 5.58648 28.1265 6.67225C22.0014 7.98685 19.8104 12.3688 19.8104 12.3688Z",
            path2: "M62.6811 60.0012C57.8365 52.9023 51.2002 53.4379 47.9721 52.9023C58.7324 47.6147 80.0095 33.0956 79.0016 17.2961C79.0065 -1.52709 63.8155 -0.217357 60.826 0.181892C51.8916 1.37964 40.3669 7.71409 40.6152 12.3639C40.8343 16.5268 48.498 16.3077 48.498 16.3077C51.3463 11.4875 56.1568 8.89236 59.0099 9.30134C61.2642 9.62269 62.4522 11.2002 62.6811 11.5751C67.8811 20.159 56.4245 36.7181 47.9721 43.6319C37.4894 53.2918 26.9239 59.8454 26.9872 60.0012C34.6995 56.9873 50.1729 54.4847 50.3628 68.5899C50.6013 86.2202 24.5333 93.6599 17.6584 95.0913C10.7835 96.5228 -0.51721 101.445 0.0183686 105.223C0.553947 109.002 12.4535 109.289 17.6584 108.427C22.8584 107.57 43.4879 97.6085 53.3523 90.2809C61.2448 84.4187 73.4608 71.6573 77.7454 66.9832C74.6975 68.8723 68.2608 72.6506 66.9219 72.6506C65.2519 72.6506 66.8537 66.1165 62.6811 60.0012Z",
            viewBox: "0 0 80 109"
        },
        images: {
            hero_placeholder: "/images/hero/lifestyle_1.png",
            placeholder_scooter: "/images/categories/scooter_nobg.png"
        }
    },

    // 3. COMPANY META (The "Pahchan")
    meta: {
        name: "BookMyBike",
        shortName: "BMB",
        tagline: "India's Lowest EMI Guarantee",
        supportEmail: "help@bookmy.bike",
        website: "https://bookmy.bike",
        socials: {
            instagram: "https://instagram.com/bookmybike",
            twitter: "https://twitter.com/bookmybike",
            linkedin: "https://linkedin.com/company/bookmybike",
            facebook: "https://facebook.com/bookmybike"
        }
    },

    // 4. THEME & FEEL (The "Vibe")
    theme: {
        // Radius: Defines how "sharp" or "round" the app feels
        radius: {
            DEFAULT: "0.5rem", // Standard button roundness (Rounded-md/lg)
            card: "1rem",      // Card roundness (2xl/3xl)
            pill: "9999px"     // Fully rounded (Full)
        },
        // Animation: Defines how "fast" the app feels
        animation: {
            fast: "150ms",
            normal: "300ms",
            slow: "500ms"
        }
    }
};
