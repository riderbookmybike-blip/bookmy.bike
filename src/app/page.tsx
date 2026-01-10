import { headers } from 'next/headers';
import StorePage from './store/page';
import LoginPage from './login/page';
import PartnerLandingPage from '@/components/brand/PartnerLandingPage';
import { adminClient } from '@/lib/supabase/admin';

export default async function RootPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';

  // 1. Public Site -> Show Store
  const isPublic = host === rootDomain || host === `www.${rootDomain}`;
  if (isPublic) {
    return <StorePage />;
  }

  // 2. Parse Subdomain
  let subdomain = host.replace(`.${rootDomain}`, '');
  if (subdomain === host) subdomain = ''; // Failed to parse or localhost

  // 3. Internal/Restricted Subdomains -> Force Login Immedately
  const FORCE_LOGIN_SUBDOMAINS = ['aums', 'we', 'team', 'me'];
  if (FORCE_LOGIN_SUBDOMAINS.includes(subdomain)) {
    return <LoginPage />;
  }

  // 4. Partner/Dealer Subdomains -> Check Config
  // Use Admin Client to bypass RLS for public landing page capability
  // Note: We only fetch config and name, explicitly safe public info.
  try {
    const { data: tenant } = await adminClient
      .from('tenants')
      .select('name, config')
      .eq('subdomain', subdomain)
      .single();

    if (tenant && tenant.config) {
      const config = tenant.config as any;
      // Check if landing page is enabled logic
      // Defaults: If config.landing exists, show it.
      // Or we can add an explicit flag `showLanding`.
      // User Requirement: "Landing content driven by tenants.config... / renders tenant branded landing"

      // Let's assume if 'brand' is set, we might show landing, BUT user said:
      // "Partners... / = public landing... we/aums = login"
      // So for all others, we prefer landing if possible.

      // Refined: If we have a tenant, we show the landing page component 
      // which has a "Login" CTA. 
      // Previous behavior was 'Login Terminal' which is also a kind of landing.
      // But PartnerLandingPage is the "Marketing" style.

      if (config.landing) {
        return <PartnerLandingPage config={config} name={tenant.name} />;
      }
    }
  } catch (err) {
    console.error('Error fetching tenant for landing:', err);
  }

  // 5. Fallback -> Login Terminal
  return <LoginPage />;
}
