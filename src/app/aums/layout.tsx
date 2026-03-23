import { redirect } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import TenantHydrator from '@/components/tenant/TenantHydrator';
import { TenantType, TenantProvider, TenantConfig } from '@/lib/tenant/tenantContext';
import { CelebrationProvider } from '@/components/providers/CelebrationProvider';
import { getAuthUser } from '@/lib/auth/resolver';
import { createClient } from '@/lib/supabase/server';

/**
 * Shared layout for all /aums/* routes.
 * Authenticates the user and wraps content in the standard AUMS ShellLayout
 * (header + sidebar), matching the /app/[slug]/ experience.
 */
export default async function AumsLayout({ children }: { children: React.ReactNode }) {
    const user = await getAuthUser();
    if (!user) redirect('/login?next=/aums/campaigns');

    const supabase = await createClient();

    // Fetch AUMS membership
    const { data: membership } = await supabase
        .from('id_team')
        .select('id, role, tenant_id, status, id_tenants!inner(id, name, slug, type, config)')
        .eq('user_id', user.id)
        .eq('id_tenants.slug', 'aums')
        .eq('status', 'ACTIVE')
        .maybeSingle();

    const role = (membership?.role ?? '').toUpperCase();
    if (!['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(role)) redirect('/403');

    const { data: profile } = await supabase.from('id_members').select('full_name').eq('id', user.id).maybeSingle();

    const resolvedName = profile?.full_name || user.email?.split('@')[0] || 'User';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenant = Array.isArray((membership as any)?.id_tenants)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (membership as any).id_tenants[0]
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (membership as any)?.id_tenants;

    return (
        <TenantProvider>
            <TenantHydrator
                userName={resolvedName}
                role={role}
                tenantId={tenant?.id ?? null}
                tenantName={tenant?.name ?? 'AUMS'}
                tenantSlug={tenant?.slug ?? 'aums'}
                tenantType={'AUMS' as TenantType}
                tenantConfig={(tenant?.config as TenantConfig) ?? null}
                memberships={[]}
            />
            <CelebrationProvider>
                <ShellLayout>{children}</ShellLayout>
            </CelebrationProvider>
        </TenantProvider>
    );
}
