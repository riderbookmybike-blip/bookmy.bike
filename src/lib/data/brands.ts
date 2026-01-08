export interface Brand {
    id: string;
    name: string;
    tagline: string;
    description: string;
    heroImage: string;
    flagshipModel: string;
    accentColor: string;
}

export const BRANDS: Record<string, Brand> = {
    honda: {
        id: 'honda',
        name: 'Honda',
        tagline: 'The Power of Dreams.',
        description: 'World-renowned for reliability, performance, and cutting-edge engineering. From the legendary Activa to high-performance superbikes.',
        heroImage: '/images/brands/honda-hero.png',
        flagshipModel: 'ACTIVA 6G',
        accentColor: 'text-red-500',
    },
    tvs: {
        id: 'tvs',
        name: 'TVS',
        tagline: 'Inspiring Motion.',
        description: 'A champion of innovation and racing heritage. Delivering exceptional performance and style across India.',
        heroImage: '/images/brands/tvs-hero.png',
        flagshipModel: 'APACHE RTR',
        accentColor: 'text-blue-500',
    },
    'royal enfield': {
        id: 'royal-enfield',
        name: 'Royal Enfield',
        tagline: 'Made Like A Gun.',
        description: 'The oldest motorcycle brand in continuous production. A legacy of pure motorcycling and timeless design.',
        heroImage: '/images/brands/re-hero.png',
        flagshipModel: 'CLASSIC 350',
        accentColor: 'text-amber-700',
    },
    bajaj: {
        id: 'bajaj',
        name: 'Bajaj',
        tagline: 'The World\'s Favorite Indian.',
        description: 'Pioneering performance motorcycles and robust commuters. Dominating the streets with Pulsar power.',
        heroImage: '/images/brands/bajaj-hero.png',
        flagshipModel: 'PULSAR NS200',
        accentColor: 'text-blue-800',
    },
    suzuki: {
        id: 'suzuki',
        name: 'Suzuki',
        tagline: 'Way of Life.',
        description: 'Japanese engineering excellence. Delivering a perfect blend of power, style, and everyday usability.',
        heroImage: '/images/brands/suzuki-hero.png',
        flagshipModel: 'ACCESS 125',
        accentColor: 'text-blue-400',
    },
    yamaha: {
        id: 'yamaha',
        name: 'Yamaha',
        tagline: 'Revs Your Heart.',
        description: 'Engineered for excitement. Precision handling and aggressive styling inspired by the world of MotoGP.',
        heroImage: '/images/brands/yamaha-hero.png',
        flagshipModel: 'R15 V4',
        accentColor: 'text-blue-600',
    }
};
