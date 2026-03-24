import type { Metadata } from 'next';
import AumsMembersPage from '@/components/modules/members/AumsMembersPage';

export const metadata: Metadata = {
    title: 'Members — AUMS',
};

export default function AumsMembersRoute() {
    return <AumsMembersPage />;
}
