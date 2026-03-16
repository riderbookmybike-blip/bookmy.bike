import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAuthPassword } from '@/lib/auth/password-utils';
import { isValidPhone, toAppStorageFormat } from '@/lib/utils/phoneUtils';

type JsonMap = Record<string, unknown>;

function normalizeIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value.map(item => String(item || '').trim()).filter(Boolean)));
}

async function verifyOtp(phone: string, otp: string, req: NextRequest) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const host = req.headers.get('host') || '';
    const hostName = host.split(':')[0]?.toLowerCase() || '';
    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalhost = hostName === 'localhost' || hostName === '127.0.0.1' || hostName === '0.0.0.0';

    // Local/dev bypass (same behavior family as existing auth endpoints)
    if (!isProduction && isLocalhost) return { success: true };
    if (!authKey) return { success: false, message: 'OTP service unavailable' };

    const mobile = `91${phone}`;
    const url = `https://control.msg91.com/api/v5/otp/verify?mobile=${mobile}&otp=${otp}&authkey=${authKey}`;
    const res = await fetch(url, { method: 'POST' });
    const data = await res.json().catch(() => ({}) as JsonMap);
    const isVerified = String((data as JsonMap).type || '').toLowerCase() === 'success';
    if (!isVerified) {
        return { success: false, message: String((data as JsonMap).message || 'Invalid OTP') };
    }
    return { success: true };
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            fullName?: string;
            phone?: string;
            otp?: string;
            email?: string;
            pincode?: string;
            financeTenantIds?: string[];
            dealershipTenantIds?: string[];
            requestedScopes?: string[];
        };

        const fullName = String(body.fullName || '').trim();
        const phone = toAppStorageFormat(body.phone || '');
        const otp = String(body.otp || '').trim();
        const emailInput = String(body.email || '')
            .trim()
            .toLowerCase();
        const pincode = String(body.pincode || '')
            .replace(/\D/g, '')
            .slice(0, 6);
        let resolvedLocation: {
            latitude: number | null;
            longitude: number | null;
            state: string | null;
            district: string | null;
            taluka: string | null;
        } | null = null;
        if (pincode.length === 6) {
            const { data: pinRow } = await adminClient
                .from('loc_pincodes')
                .select('latitude, longitude, state, district, taluka')
                .eq('pincode', pincode)
                .maybeSingle();
            if (pinRow) {
                resolvedLocation = {
                    latitude: Number.isFinite(Number((pinRow as any).latitude))
                        ? Number((pinRow as any).latitude)
                        : null,
                    longitude: Number.isFinite(Number((pinRow as any).longitude))
                        ? Number((pinRow as any).longitude)
                        : null,
                    state: ((pinRow as any).state as string) || null,
                    district: ((pinRow as any).district as string) || null,
                    taluka: ((pinRow as any).taluka as string) || null,
                };
            }
        }
        const financeTenantIds = normalizeIds(body.financeTenantIds);
        const dealershipTenantIds = normalizeIds(body.dealershipTenantIds);
        const requestedScopes = normalizeIds(body.requestedScopes);
        const scopeFinancer = requestedScopes.includes('FINANCER_TEAM');
        const scopeDealer = requestedScopes.includes('DEALERSHIP_TEAM');

        if (!fullName || !phone || !otp || !isValidPhone(phone)) {
            return NextResponse.json(
                { success: false, message: 'Name, valid phone and OTP are required.' },
                { status: 400 }
            );
        }
        if (!scopeFinancer && !scopeDealer) {
            return NextResponse.json({ success: false, message: 'Select at least one team role.' }, { status: 400 });
        }
        if (scopeFinancer && financeTenantIds.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Select at least one financer for financer team onboarding.',
                },
                { status: 400 }
            );
        }
        if (scopeFinancer && financeTenantIds.length > 1) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Only one financer can be selected.',
                },
                { status: 400 }
            );
        }
        if ((scopeDealer || scopeFinancer) && dealershipTenantIds.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Select at least one dealership.',
                },
                { status: 400 }
            );
        }

        const otpResult = await verifyOtp(phone, otp, req);
        if (!otpResult.success) {
            return NextResponse.json(
                { success: false, message: otpResult.message || 'OTP verification failed' },
                { status: 400 }
            );
        }

        const formattedPhone = `+91${phone}`;
        const fallbackEmail = `${phone}@bookmy.bike`;
        const loginEmail = emailInput || fallbackEmail;
        const password = getAuthPassword(phone);

        const { data: listedUsers, error: listError } = await adminClient.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
        });
        if (listError) {
            return NextResponse.json({ success: false, message: listError.message }, { status: 500 });
        }

        const existingAuthUser = (listedUsers?.users || []).find(u => {
            const userPhone = String(u.phone || '')
                .replace(/\D/g, '')
                .slice(-10);
            const metaPhone = String((u.user_metadata as JsonMap | undefined)?.phone || '')
                .replace(/\D/g, '')
                .slice(-10);
            return userPhone === phone || metaPhone === phone || (u.email || '').toLowerCase() === loginEmail;
        });

        let userId: string;
        if (existingAuthUser?.id) {
            userId = existingAuthUser.id;
            if (emailInput && (!existingAuthUser.email || existingAuthUser.email.endsWith('@bookmy.bike'))) {
                await adminClient.auth.admin.updateUserById(userId, {
                    email: emailInput,
                    email_confirm: true,
                    user_metadata: {
                        ...(existingAuthUser.user_metadata || {}),
                        full_name: fullName,
                        phone,
                    },
                });
            }
        } else {
            const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
                phone: formattedPhone,
                email: loginEmail,
                email_confirm: true,
                phone_confirm: true,
                password,
                user_metadata: { full_name: fullName, phone },
            });
            if (createUserError || !newUser?.user?.id) {
                return NextResponse.json(
                    { success: false, message: createUserError?.message || 'Unable to create member account' },
                    { status: 500 }
                );
            }
            userId = newUser.user.id;
        }

        const { data: existingMember } = await adminClient
            .from('id_members')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (existingMember?.id) {
            await adminClient
                .from('id_members')
                .update({
                    full_name: fullName,
                    phone,
                    primary_phone: phone,
                    ...(emailInput ? { email: emailInput, primary_email: emailInput } : {}),
                    ...(pincode ? { pincode } : {}),
                    ...(resolvedLocation?.state ? { state: resolvedLocation.state } : {}),
                    ...(resolvedLocation?.district ? { district: resolvedLocation.district } : {}),
                    ...(resolvedLocation?.taluka ? { taluka: resolvedLocation.taluka } : {}),
                    ...(resolvedLocation && resolvedLocation.latitude != null
                        ? { latitude: resolvedLocation.latitude }
                        : {}),
                    ...(resolvedLocation && resolvedLocation.longitude != null
                        ? { longitude: resolvedLocation.longitude }
                        : {}),
                })
                .eq('id', userId);
        } else {
            const { error: memberInsertError } = await adminClient.from('id_members').insert({
                id: userId,
                full_name: fullName,
                phone,
                primary_phone: phone,
                role: 'member',
                ...(emailInput ? { email: emailInput, primary_email: emailInput } : {}),
                ...(pincode ? { pincode } : {}),
                ...(resolvedLocation?.state ? { state: resolvedLocation.state } : {}),
                ...(resolvedLocation?.district ? { district: resolvedLocation.district } : {}),
                ...(resolvedLocation?.taluka ? { taluka: resolvedLocation.taluka } : {}),
                ...(resolvedLocation && resolvedLocation.latitude != null
                    ? { latitude: resolvedLocation.latitude }
                    : {}),
                ...(resolvedLocation && resolvedLocation.longitude != null
                    ? { longitude: resolvedLocation.longitude }
                    : {}),
            });
            if (memberInsertError) {
                return NextResponse.json({ success: false, message: memberInsertError.message }, { status: 500 });
            }
        }

        const requestId = crypto.randomUUID();

        const { error: requestInsertError } = await adminClient.from('catalog_audit_log').insert({
            table_name: 'team_access_requests',
            record_id: requestId,
            action: 'INSERT',
            actor_id: userId,
            actor_label: 'WELCOME',
            new_data: {
                request_id: requestId,
                status: 'PENDING',
                user_id: userId,
                full_name: fullName,
                phone,
                email: emailInput || null,
                pincode: pincode || null,
                requested_scopes: requestedScopes.length > 0 ? requestedScopes : ['FINANCER_TEAM', 'DEALERSHIP_TEAM'],
                finance_tenant_ids: financeTenantIds,
                dealership_tenant_ids: dealershipTenantIds,
                submitted_at: new Date().toISOString(),
            },
        });
        if (requestInsertError) {
            return NextResponse.json(
                { success: false, message: `Unable to save onboarding request: ${requestInsertError.message}` },
                { status: 500 }
            );
        }

        const { data: aumsTenant } = await adminClient.from('id_tenants').select('id').eq('slug', 'aums').maybeSingle();

        const notifyTenantIds = Array.from(
            new Set([...financeTenantIds, ...dealershipTenantIds, aumsTenant?.id || ''].filter(Boolean))
        );
        let notificationWarning: string | null = null;
        if (notifyTenantIds.length > 0) {
            const { error: notificationError } = await adminClient.from('notifications').insert(
                notifyTenantIds.map(tenantId => ({
                    tenant_id: tenantId,
                    type: 'ONBOARDING_REQUEST',
                    title: 'New Team Access Request',
                    message: `${fullName} requested financer + dealership access via /welcome.`,
                    metadata: {
                        request_id: requestId,
                        user_id: userId,
                        finance_tenant_ids: financeTenantIds,
                        dealership_tenant_ids: dealershipTenantIds,
                        status: 'PENDING_REVIEW',
                    },
                }))
            );
            if (notificationError) {
                notificationWarning = notificationError.message;
            }
        }

        return NextResponse.json({
            success: true,
            requestId,
            userId,
            message: `Onboarding request submitted. Request ID: ${requestId}`,
            warning: notificationWarning,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
