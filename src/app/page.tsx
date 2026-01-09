import { headers } from 'next/headers';
import StorePage from './store/page';
import LoginPage from './login/page';

export default async function RootPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';

  // Determine if Public Site
  const isPublic = host === rootDomain || host === `www.${rootDomain}`;

  // Public Site -> Show Store
  if (isPublic) {
    return <StorePage />;
  }

  // Subdomains (Partner/Internal) -> Show Branded Login/Landing
  // Note: Middleware protects sensitive routes, so reaching here on a subdomain
  // usually means "Landing Page" (unauth allowed) or "Dashboard Root" (auth allowed).
  // Since we haven't built a separate generic "PartnerLanding", we use the Login Terminal.
  return <LoginPage />;
}
