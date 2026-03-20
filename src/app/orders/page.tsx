import { redirect } from 'next/navigation';

export default async function OrdersPage() {
    redirect('/store/ocircle?tab=BOOKINGS');
}
