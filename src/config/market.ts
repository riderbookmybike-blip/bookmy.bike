export const BRANDS = [
    'HONDA',
    'TVS',
    'ROYAL ENFIELD',
    'BAJAJ',
    'SUZUKI',
    'YAMAHA',
    'KTM',
    'HERO',
    'TRIUMPH',
    'APRILIA',
];

export interface CategoryMetadata {
    title: string;
    subtitle: string;
    desc: string;
    img: string;
    color: string;
    link: string;
    bodyType: string;
    features: string[];
}

export const CATEGORIES: CategoryMetadata[] = [
    {
        title: 'Scooters',
        subtitle: 'Urban.',
        desc: 'Daily commuting made easy with comfort and great mileage. See transparent on-road prices and get instant quotes. Book your scooter in minutes.',
        img: '/images/categories/scooter_nobg.png',
        color: 'from-cyan-500/20',
        link: '/store/catalog?category=SCOOTER',
        bodyType: 'SCOOTER',
        features: ['Most Popular'],
    },
    {
        title: 'Motorcycles',
        subtitle: 'Racing.',
        desc: 'Find the right bike—commuter, cruiser, or sport. Compare on-road prices from verified dealers instantly. Get a quote and book in minutes.',
        img: '/images/categories/motorcycle_nobg.png',
        color: 'from-rose-500/20',
        link: '/store/catalog?category=MOTORCYCLE',
        bodyType: 'MOTORCYCLE',
        features: ['Youth Love'],
    },
    {
        title: 'Mopeds',
        subtitle: 'Utility.',
        desc: 'Work-ready utility rides built for heavy daily use. Low running cost with transparent on-road pricing. Get instant quotes and book fast.',
        img: '/images/categories/moped_nobg.png',
        color: 'from-amber-500/20',
        link: '/store/catalog?category=MOPED',
        bodyType: 'MOPED',
        features: ['Utility Hero'],
    },
];

export const MARKET_METRICS = {
    avgSavings: '₹12k+',
    deliveryTime: '48h',
    // totalModels is calculated dynamically in the component
};
