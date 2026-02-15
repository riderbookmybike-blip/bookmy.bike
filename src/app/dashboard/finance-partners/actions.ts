'use server';

import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { generateDisplayId } from '@/lib/displayId';
import { FinanceRoutingTable } from '@/types/bankPartner';

export async function onboardBank(formData: { bankName: string; website: string; adminPhone: string; slug?: string }) {
    console.log('[OnboardBank] Starting onboarding for:', formData.bankName);

    try {
        // 1. Generate unique slug or use provided one
        let slug = (formData.slug || formData.bankName)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        const { data: existingTenant } = await adminClient
            .from('id_tenants')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

        if (existingTenant) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        console.log('[OnboardBank] Created slug:', slug);

        // 2. Create Tenant
        const { data: tenant, error: tenantError } = await adminClient
            .from('id_tenants')
            .insert({
                name: formData.bankName,
                slug,
                display_id: generateDisplayId(),
                type: 'BANK',
                status: 'ACTIVE',
                config: {
                    website: formData.website,
                },
                location: 'Headquarters', // Default
            })
            .select()
            .single();

        if (tenantError) {
            console.error('[OnboardBank] Tenant Error:', tenantError);
            throw tenantError;
        }

        console.log('[OnboardBank] Tenant created:', tenant.id);

        // 3. Normalize Phone
        const rawPhone = formData.adminPhone.replace(/\D/g, '');
        let formattedPhone = rawPhone;
        if (rawPhone.length === 10) {
            formattedPhone = `91${rawPhone}`;
        }

        // 4. Resolve Existing Member
        const { data: existingMember } = await adminClient
            .from('id_members')
            .select('id')
            .or(`primary_phone.eq.${rawPhone},primary_phone.eq.${formattedPhone},primary_phone.eq.+${formattedPhone}`)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        let memberId = existingMember?.id;

        if (!memberId) {
            console.log('[OnboardBank] User not found with this mobile number');
            throw new Error('This mobile number is not registered. Please signup on BookMyBike first.');
        }

        console.log('[OnboardBank] Member ID resolved:', memberId);

        // 5. Link Member to Tenant in id_team
        const { error: teamError } = await adminClient.from('id_team').insert({
            tenant_id: tenant.id,
            user_id: memberId,
            role: 'OWNER',
            status: 'ACTIVE',
        });

        if (teamError) {
            console.error('[OnboardBank] Team Error:', teamError);
            if (!teamError.message.includes('unique constraint')) {
                throw teamError;
            }
        }

        revalidatePath('/app/[slug]/dashboard/finance-partners', 'layout');
        revalidatePath('/dashboard/finance-partners', 'page');

        return { success: true, tenant };
    } catch (error: any) {
        console.error('[OnboardBank] Fatal Error:', error);
        return { success: false, error: error.message || 'Check server logs' };
    }
}

export async function updateBankSchemes(bankId: string, schemes: any[]) {
    console.log('[UpdateBankSchemes] Updating schemes for:', bankId);

    try {
        // 1. Fetch current config
        const { data: tenant, error: fetchError } = await adminClient
            .from('id_tenants')
            .select('config')
            .eq('id', bankId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Update config with new schemes
        const newConfig = {
            ...((tenant.config as any) || {}),
            schemes,
        };

        const { error: updateError } = await adminClient
            .from('id_tenants')
            .update({ config: newConfig })
            .eq('id', bankId);

        if (updateError) throw updateError;

        console.log('[UpdateBankSchemes] Schemes updated successfully');
        return { success: true };
    } catch (error: any) {
        console.error('[UpdateBankSchemes] Fatal Error:', error);
        return { success: false, error: error.message || 'Check server logs' };
    }
}

export async function updateBankIdentity(
    bankId: string,
    updates: {
        fullLogo?: string;
        iconLogo?: string;
        description?: string;
        website?: string;
        whatsapp?: string;
        customerCare?: string;
        helpline?: string;
        appLinks?: { android?: string; ios?: string };
    }
) {
    console.log('[UpdateBankIdentity] Updating identity for:', bankId);

    try {
        const { data: tenant, error: fetchError } = await adminClient
            .from('id_tenants')
            .select('config')
            .eq('id', bankId)
            .single();

        if (fetchError) throw fetchError;

        const cfg = (tenant?.config as any) || {};
        const newConfig = {
            ...cfg,
            fullLogo: updates.fullLogo || cfg.fullLogo,
            iconLogo: updates.iconLogo || cfg.iconLogo,
            overview: {
                ...(cfg.overview || {}),
                description: updates.description || cfg.overview?.description,
                website: updates.website || cfg.overview?.website || cfg.website,
                whatsapp: updates.whatsapp || cfg.overview?.whatsapp,
                customerCare: updates.customerCare || cfg.overview?.customerCare,
                helpline: updates.helpline || cfg.overview?.helpline,
                appLinks: {
                    ...(cfg.overview?.appLinks || {}),
                    ...(updates.appLinks || {}),
                },
            },
        };

        const { error: updateError } = await adminClient
            .from('id_tenants')
            .update({ config: newConfig })
            .eq('id', bankId);

        if (updateError) throw updateError;

        revalidatePath('/dashboard/finance-partners', 'layout');
        return { success: true };
    } catch (error: any) {
        console.error('[UpdateBankIdentity] Fatal Error:', error);
        return { success: false, error: error.message || 'Check server logs' };
    }
}

export async function getBankPartners() {
    try {
        const { data, error } = await adminClient
            .from('id_tenants')
            .select('id, name, display_id, status')
            .eq('type', 'BANK');

        if (error) throw error;
        return { success: true, partners: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getFinanceRouting() {
    try {
        const { data, error } = await adminClient
            .from('id_tenants')
            .select('config')
            .eq('type', 'AUMS')
            .eq('status', 'ACTIVE')
            .single();

        if (error) throw error;
        return { success: true, routing: (data.config as any)?.financeRouting as FinanceRoutingTable | undefined };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function saveFinanceRouting(routing: FinanceRoutingTable) {
    try {
        // Fetch AUMS Tenant ID dynamically
        const { data: tenant, error: fetchError } = await adminClient
            .from('id_tenants')
            .select('id, config')
            .eq('type', 'AUMS')
            .eq('status', 'ACTIVE')
            .single();

        if (fetchError) throw fetchError;

        const newConfig = {
            ...((tenant.config as any) || {}),
            financeRouting: routing,
        };

        const { error: updateError } = await adminClient
            .from('id_tenants')
            .update({ config: newConfig })
            .eq('id', tenant.id);

        if (updateError) throw updateError;

        revalidatePath('/dashboard/finance-partners', 'page');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
export async function getBankActivityLog(bankId: string, limit = 10) {
    try {
        // 1. Fetch recent finance attempts for this bank
        const { data: attempts, error } = await adminClient
            .from('crm_quote_finance_attempts')
            .select('id, quote_id, status, scheme_code, loan_amount, emi, created_at, updated_at, bank_name')
            .eq('bank_id', bankId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // 2. Build activity items from attempts
        const activities = (attempts || []).map((a: any) => {
            const statusLabels: Record<string, string> = {
                IN_PROCESS: 'Application In Process',
                UNDERWRITING: 'Underwriting Review',
                DOC_PENDING: 'Documents Pending',
                APPROVED: 'Loan Approved',
                REJECTED: 'Application Rejected',
            };

            const statusColors: Record<string, string> = {
                IN_PROCESS: 'blue',
                UNDERWRITING: 'amber',
                DOC_PENDING: 'orange',
                APPROVED: 'emerald',
                REJECTED: 'rose',
            };

            const detail =
                [
                    a.scheme_code ? `Scheme: ${a.scheme_code}` : null,
                    a.loan_amount ? `Loan: ₹${Number(a.loan_amount).toLocaleString('en-IN')}` : null,
                    a.emi ? `EMI: ₹${Number(a.emi).toLocaleString('en-IN')}` : null,
                ]
                    .filter(Boolean)
                    .join(' · ') || 'Finance attempt created';

            return {
                id: a.id,
                title: statusLabels[a.status] || a.status,
                detail,
                time: a.updated_at || a.created_at,
                color: statusColors[a.status] || 'blue',
                quoteId: a.quote_id,
            };
        });

        return { success: true, activities };
    } catch (error: any) {
        console.error('[getBankActivityLog] Error:', error);
        return { success: false, error: error.message, activities: [] };
    }
}

export async function updateBankChargesMaster(bankId: string, chargesMaster: any[]) {
    console.log('[UpdateBankChargesMaster] Updating charges master for:', bankId);

    try {
        const { data: tenant, error: fetchError } = await adminClient
            .from('id_tenants')
            .select('config')
            .eq('id', bankId)
            .single();

        if (fetchError) throw fetchError;

        const newConfig = {
            ...((tenant.config as any) || {}),
            chargesMaster,
        };

        const { error: updateError } = await adminClient
            .from('id_tenants')
            .update({ config: newConfig })
            .eq('id', bankId);

        if (updateError) throw updateError;

        console.log('[UpdateBankChargesMaster] Charges master updated successfully');
        return { success: true };
    } catch (error: any) {
        console.error('[UpdateBankChargesMaster] Fatal Error:', error);
        return { success: false, error: error.message || 'Check server logs' };
    }
}
