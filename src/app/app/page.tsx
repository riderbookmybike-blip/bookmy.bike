import { redirect } from 'next/navigation';

/**
 * /app without a tenant slug — redirect to home.
 *
 * Logged-in staff users who arrive here directly (e.g. from bookmarks or
 * stale links) will land at the store root. Their tenant context will then
 * auto-resolve the correct dashboard URL via the shell layout.
 *
 * This eliminates the high-volume 404 bucket recorded in Clarity sessions
 * where users clicked "Open CRM Lead Flow" before the tenant slug was known.
 */
export default function AppIndexPage() {
    redirect('/');
}
