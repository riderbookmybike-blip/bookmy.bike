import { CreditCard, Building2, ShieldCheck } from 'lucide-react';

export const usefulApps = [
    {
        id: 'mparivahan',
        name: 'NextGen mParivahan',
        company: 'Govt. of India',
        description: 'Access your digital RC and Driving License. Check vehicle details and e-Challan status.',
        icon: ShieldCheck,
        logoUrl: '/media/Bank Logo/Mparivhan.png',
        iconColor: '#1A237E',
        category: 'Government Services',
        links: {
            android: 'https://play.google.com/store/apps/details?id=com.nic.mparivahan&hl=en_IN',
            ios: 'https://apps.apple.com/in/app/nextgen-mparivahan/id1450914131',
        },
    },
    {
        id: 'lt-finance',
        name: 'L&T Finance Planet',
        company: 'L&T Finance',
        description: 'Manage your bike loans, view EMI schedules, and apply for new financing instantly.',
        icon: CreditCard,
        logoUrl: '/media/Bank Logo/lnt%20fiance.jpg',
        iconColor: '#005596',
        category: 'Financing',
        links: {
            android: 'https://play.google.com/store/apps/details?id=com.ltfs.d2c&hl=en_IN',
            ios: 'https://apps.apple.com/in/app/l-t-finance-planet-loan-app/id1612832519',
        },
    },
    {
        id: 'shriram-one',
        name: 'Shriram One',
        company: 'Shriram Finance',
        description: 'A comprehensive app for loans, fixed deposits, and insurance payments tailored for riders.',
        icon: Building2,
        logoUrl: '/media/Bank Logo/shriram.jpg',
        iconColor: '#DA251D',
        category: 'Financing',
        links: {
            android: 'https://play.google.com/store/apps/details?id=com.shriram.one&hl=en_IN',
            ios: 'https://apps.apple.com/in/app/shriram-one-fd-upi-loans/id6446923754',
        },
    },
    {
        id: 'hdfc-loans',
        name: 'HDFC Bank Loans',
        company: 'HDFC Bank',
        description: 'Quick access to your HDFC bike loan account and payment portals for easy management.',
        icon: Building2,
        logoUrl: '/media/Bank Logo/hdfc%20bank.png',
        iconColor: '#1D4F91',
        category: 'Financing',
        links: {
            android: 'https://play.google.com/store/apps/details?id=com.indigo.hdfcloans&hl=en_IN',
            ios: '#',
        },
    },
];
