export type WheelReward = {
    id: string;
    label: string;
    weight: number;
    value?: number;
    kind: 'VOUCHER' | 'SERVICE' | 'CASHBACK' | 'MERCH' | 'PRIORITY';
};

// Real reward catalog definitions
export const WHEEL_REWARDS: WheelReward[] = [
    { id: 'service-first-free', label: 'Free 1st Service', weight: 15, kind: 'SERVICE' },
    { id: 'voucher-acc-500', label: 'INR 500 Accessories Voucher', weight: 20, value: 500, kind: 'VOUCHER' },
    { id: 'cashback-booking-250', label: 'INR 250 Cashback on Booking', weight: 25, value: 250, kind: 'CASHBACK' },
    { id: 'merch-helmet-std', label: 'Standard Helmet Upgrade', weight: 10, kind: 'MERCH' },
    { id: 'priority-service-delivery', label: 'Priority Delivery Slot', weight: 8, kind: 'PRIORITY' },
    { id: 'voucher-mega-1500', label: 'INR 1500 Mega Voucher', weight: 2, value: 1500, kind: 'VOUCHER' },
    { id: 'amc-discount-50', label: '50% Off Annual Maintenance', weight: 12, kind: 'SERVICE' },
    { id: 'merch-rider-kit', label: 'Rider Essentials Pack', weight: 8, kind: 'MERCH' }
];
