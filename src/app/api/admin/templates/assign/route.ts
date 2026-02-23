import { NextResponse } from 'next/server';
import { assignTemplateToRole } from '@/modules/templates/templateService';
import { getErrorMessage } from '@/lib/utils/errorMessage';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tenant_type, role, template_id } = body;

        if (!tenant_type || !role || !template_id) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        await assignTemplateToRole(tenant_type, role, template_id);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
    }
}
