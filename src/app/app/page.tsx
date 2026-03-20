import { redirect } from 'next/navigation';

/**
 * /app without a tenant slug — redirect to legacy dashboard resolver.
 *
 * /dashboard is already mapped by proxy to the user's first active tenant
 * (`/app/{slug}/dashboard`) and sends unauthenticated users to /login.
 *
 * This eliminates the high-volume 404 bucket recorded in Clarity sessions
 * where users clicked "Open CRM Lead Flow" before the tenant slug was known.
 */
export default function AppIndexPage() {
    redirect('/dashboard');
}
