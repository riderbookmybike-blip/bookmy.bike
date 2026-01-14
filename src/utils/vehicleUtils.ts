import { VEHICLE_REVIEW_DATA } from '@/data/vehicleReviewData';

/**
 * Generates a stable, time-growing review count for a vehicle.
 * Uses a researched baseline + daily growth factor to simulate realistic popularity.
 */
export const getStableReviewCount = (vehicle: { id: string; make: string; model: string; variant?: string; category?: string }) => {
    const key = `${vehicle.make.trim()} ${vehicle.model.trim()}`.toLowerCase();
    const variantText = (vehicle.variant || '').toLowerCase();

    let count = 0;

    // 1. Check if we have "Researched Information" for this model
    if (VEHICLE_REVIEW_DATA[key]) {
        const data = VEHICLE_REVIEW_DATA[key];

        // Calculate Growth since the 'lastUpdated' anchor date
        // providing a sense of "Live" data that grows over time
        const anchorDate = new Date(data.lastUpdated).getTime();
        const now = Date.now();
        const daysElapsed = Math.max(0, Math.floor((now - anchorDate) / (1000 * 60 * 60 * 24)));

        count = data.baseCount + (daysElapsed * data.growthRatePerDay);
    } else {
        // Fallback: Deterministic Algorithm if not in our database
        // Start between 100k and 250k
        const seedStr = vehicle.id.slice(-4);
        const seed = seedStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random = (seed % 100) / 100;
        count = 100000 + Math.floor(random * 150000);

        // Basic keywords fallbacks
        if (key.includes('scooter') || vehicle.category === 'SCOOTER') count += 50000;
        if (key.includes('sport') || vehicle.category === 'MOTORCYCLE') count += 80000;
        if (key.includes('commuter')) count += 150000;
    }

    // 2. Variant Level Differentiators
    // Add noise based on variant so they don't look identical
    const variantHash = variantText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    count += (variantHash % 5000); // Small jitter per variant name

    if (variantText.includes('disc')) count += 15000;
    if (variantText.includes('smart') || variantText.includes('h-smart')) count += 25000;
    if (variantText.includes('abs')) count += 30000;
    if (variantText.includes('pro')) count += 10000;
    if (variantText.includes('racing') || variantText.includes('rr')) count += 20000;

    // 3. Cap Max to realistic constraints
    if (count > 999000) count = 995000 + (count % 4000);

    // 4. Format
    if (count > 1000) {
        return `${Math.floor(count / 1000)}k+`;
    }
    return `${count}`;
};

// USP Data based on market perception
export const getVehicleUSP = (make: string, model: string) => {
    const key = `${make.trim()} ${model.trim()}`.toLowerCase();

    if (key.includes('activa')) return 'Highest Resale Value';
    if (key.includes('jupiter')) return 'Largest Leg Space';
    if (key.includes('ntorq')) return 'Gen-Z Favorite';
    if (key.includes('splendor')) return 'India\'s No.1 Seller';
    if (key.includes('classic') || key.includes('bullet')) return 'Legendary Thump';
    if (key.includes('shine')) return 'Super Silent Start';
    if (key.includes('access')) return 'Suzuki Eco Tech';
    if (key.includes('ola')) return 'Hyper Mode Ready';
    if (key.includes('chetak')) return 'Metal Body';
    if (key.includes('apache')) return 'Race Tuned FI';
    if (key.includes('pulsar')) return 'Street Fighter';
    if (key.includes('hf deluxe')) return 'Mileage Leader';
    if (key.includes('mt 15')) return 'The Dark Side';
    if (key.includes('r15')) return 'Track Monster';

    return null;
};
