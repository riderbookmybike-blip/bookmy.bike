import { NextResponse } from 'next/server';
import { assignTemplateToRole } from '@/modules/templates/templateService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tenant_type, role, template_id } = body;

        if (!tenant_type || !role || !template_id) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        await assignTemplateToRole(tenant_type, role, template_id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
