import { redirect } from 'next/navigation';
import NotificationsClient from '@/app/notifications/NotificationsClient';
import { getAuthUser } from '@/lib/auth/resolver';

export default async function NotificationsPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect('/login');
    }

    return <NotificationsClient />;
}
