import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'DEALERSHIP_ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'MARKETPLACE_ADMIN'];

export async function POST(req: NextRequest) {
    try {
        const { id, otp, phone, tenantId } = await req.json();
        if (!id || !otp || !phone || !tenantId) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { data: memberships } = await adminClient
            .from('id_team')
            .select('role')
            .eq('user_id', user.id)
            .eq('tenant_id', tenantId)
            .eq('status', 'ACTIVE');

        const hasAdminRole = (memberships || []).some(m => ADMIN_ROLES.includes((m.role || '').toUpperCase()));
        if (!hasAdminRole) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const { data: rule, error: ruleError } = await adminClient
            .from('cat_reg_rules')
            .select('id, rule_name, status')
            .eq('id', id)
            .maybeSingle();

        if (ruleError || !rule) {
            return NextResponse.json({ success: false, message: 'Rule not found' }, { status: 404 });
        }

        if ((rule.status || '').toUpperCase() !== 'ARCHIVED') {
            return NextResponse.json({ success: false, message: 'Only archived rules can be deleted' }, { status: 400 });
        }

        const authKey = process.env.MSG91_AUTH_KEY;
        const isProduction = process.env.NODE_ENV === 'production';
        let isVerified = false;

        if (!authKey) {
            if (isProduction) {
                return NextResponse.json({ success: false, message: 'OTP service unavailable' }, { status: 500 });
            }
            isVerified = otp === '1234' || otp === '0000';
        } else {
            const cleanedPhone = phone.replace(/\D/g, '');
            const tenDigitPhone = cleanedPhone.slice(-10);
            const mobile = `91${tenDigitPhone}`;
            const url = `https://control.msg91.com/api/v5/otp/verify?mobile=${mobile}&otp=${otp}&authkey=${authKey}`;
            const res = await fetch(url, { method: 'POST' });
            const data = await res.json();
            isVerified = data.type === 'success';
        }

        if (!isVerified) {
            return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 403 });
        }

        const { error: deleteError } = await adminClient
            .from('cat_reg_rules')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
        }

        await logAudit({
            tenantId,
            actorId: user.id,
            action: 'REGISTRATION_RULE_DELETED',
            entityType: 'REGISTRATION_RULE',
            entityId: id,
            metadata: { ruleName: rule.rule_name },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete registration rule failed:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
