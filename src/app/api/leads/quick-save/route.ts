import { NextRequest, NextResponse } from 'next/server';
import { addLeadNoteAction, checkQuickLeadContextAction, createLeadAction } from '@/actions/crm';

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            customerName?: string;
            phone?: string;
            note?: string;
            ownerTenantId?: string;
            selectedDealerId?: string;
        };

        const customerName = String(body?.customerName || '').trim();
        const phone = String(body?.phone || '').trim();
        const note = String(body?.note || '').trim();
        const ownerTenantId = String(body?.ownerTenantId || '').trim() || undefined;
        const selectedDealerId = String(body?.selectedDealerId || '').trim() || undefined;

        if (!ownerTenantId) {
            return NextResponse.json(
                { success: false, message: 'Activate dealership first, then save lead.' },
                { status: 400 }
            );
        }
        if (!customerName) {
            return NextResponse.json({ success: false, message: 'Customer name required.' }, { status: 400 });
        }
        if (!note) {
            return NextResponse.json({ success: false, message: 'Lead note is required.' }, { status: 400 });
        }

        const precheck = await checkQuickLeadContextAction({
            phone,
            ownerTenantId,
            selectedDealerId,
        });
        const existingLead = (precheck as any)?.existingLead;
        if (precheck?.success && existingLead?.id && existingLead?.canWrite === false) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Lead belongs to another owner. Request share first; edit is blocked until approved.',
                    requireShareRequest: true,
                    leadId: existingLead.id,
                },
                { status: 403 }
            );
        }

        const result = await createLeadAction({
            customer_name: customerName,
            customer_phone: phone,
            owner_tenant_id: ownerTenantId,
            selected_dealer_id: selectedDealerId,
            interest_model: 'MARKETPLACE_QUICK_LEAD',
            model: 'GENERAL_ENQUIRY',
            interest_text: note,
            source: 'MARKETPLACE_QUICK_LEAD',
        });

        if (!result?.success || !('leadId' in result) || !result.leadId) {
            return NextResponse.json(
                { success: false, message: result?.message || 'Failed to save lead' },
                { status: 400 }
            );
        }

        const noteResult = await addLeadNoteAction({
            leadId: result.leadId,
            body: note,
            actorTenantId: ownerTenantId || selectedDealerId || undefined,
        });
        return NextResponse.json({
            success: true,
            leadId: result.leadId,
            duplicate: Boolean((result as any).duplicate),
            noteSaved: Boolean(noteResult?.success),
            noteMessage: (noteResult as any)?.message || null,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
