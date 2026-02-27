'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    Landmark,
    CheckCircle2,
    Building2,
    Calendar,
    User,
    FileText,
    ArrowRight,
    Wallet,
    BadgePercent,
    Banknote,
    Clock,
    Paperclip,
    ExternalLink,
    Percent,
    IndianRupee,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getFinanceApplications, updateFinanceStatus } from '@/actions/finance';
import { advanceBookingStage } from '@/actions/bookingStage';
import { toast } from 'sonner';

export default function SalesOrderFinancePage() {
    const params = useParams();
    const id = typeof params?.id === 'string' ? params.id : '';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [movingStage, setMovingStage] = useState<string | null>(null);
    const [financeApp, setFinanceApp] = useState<any>(null);
    const [draft, setDraft] = useState<any>(null);

    useEffect(() => {
        if (id) loadFinanceData();
    }, [id]);

    async function loadFinanceData() {
        setLoading(true);
        try {
            const apps = await getFinanceApplications(id);
            // We'll take the first one or create a draft if none exists
            if (apps && apps.length > 0) {
                const app = apps[0];
                setFinanceApp(app);

                // Parse extended data from notes (JSON-ish) if it exists
                let extendedData = {};
                try {
                    if (app.notes?.startsWith('{')) {
                        extendedData = JSON.parse(app.notes);
                    }
                } catch (e) {}

                setDraft({
                    status: app.status || 'APPLIED',
                    bank: app.lender_name || '',
                    reqLoanAmount: app.requested_amount || 0,
                    loanAmount: app.approved_amount || 0,
                    tenure: app.tenure_months || 0,
                    roi: app.interest_rate || 0,
                    emi: (app as any).emi_amount || 0,
                    executive: (app as any).finance_executive_name || '',
                    lanNumber: (app as any).lan_number || '',
                    ...extendedData,
                });
            } else {
                setDraft({
                    status: 'PENDING',
                    bank: '',
                    reqLoanAmount: 0,
                    loanAmount: 0,
                    tenure: 24,
                    roi: 10.99,
                    emi: 0,
                });
            }
        } catch (err) {
            toast.error('Failed to load finance data');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!financeApp?.id) {
            toast.error('No finance application found to update');
            return;
        }
        setSaving(true);
        try {
            // Map common fields
            const updates: any = {
                status: draft.status,
                lender_name: draft.bank,
                approved_amount: Number(draft.loanAmount),
                interest_rate: Number(draft.roi),
                tenure_months: Number(draft.tenure),
                // We'll store the rest in notes for now as JSON until schema is updated
                notes: JSON.stringify(draft),
            };

            await updateFinanceStatus(financeApp.id, updates);
            toast.success('Finance details updated successfully');
            await loadFinanceData();
        } catch (err) {
            toast.error('Failed to save updates');
        } finally {
            setSaving(false);
        }
    }

    async function handleMoveToStage(stage: string) {
        if (!id) return;
        setMovingStage(stage);
        try {
            const result = await advanceBookingStage(id, stage, `finance_page_move_to_${stage.toLowerCase()}`);
            if (result.success) {
                toast.success(`Moved to ${stage}`);
            } else {
                toast.error(result.message || result.warning || `Failed to move to ${stage}`);
            }
        } catch (err) {
            toast.error(`Failed to move to ${stage}`);
        } finally {
            setMovingStage(null);
        }
    }

    const SectionHeader = ({ title, icon: Icon, colorClass }: { title: string; icon: any; colorClass: string }) => (
        <div className="flex items-center gap-3 mb-6">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg', colorClass)}>
                <Icon size={16} />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                {title}
            </h3>
        </div>
    );

    const Field = ({ label, value, type = 'text', icon: Icon, addon, suffix, field }: any) => (
        <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4 transition-all hover:border-indigo-500/30 group">
            <div className="flex items-center justify-between mb-2">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-400 transition-colors">
                    {label}
                </div>
                {Icon && <Icon size={10} className="text-slate-300" />}
            </div>
            <div className="flex items-center gap-2">
                {addon && <span className="text-slate-400 text-xs font-bold">{addon}</span>}
                <input
                    type={type}
                    value={value ?? ''}
                    onChange={e => setDraft((prev: any) => ({ ...prev, [field]: e.target.value }))}
                    className="bg-transparent border-none p-0 text-sm font-black text-slate-900 dark:text-white outline-none w-full tabular-nums"
                />
                {suffix && <span className="text-[10px] font-black text-slate-400 uppercase">{suffix}</span>}
            </div>
        </div>
    );

    if (loading)
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Syncing Finance Engine...
                </p>
            </div>
        );

    return (
        <div className="flex flex-col gap-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[1.5rem] p-4 flex flex-wrap gap-2">
                <Button
                    variant="outline"
                    onClick={() => handleMoveToStage('FINANCE')}
                    disabled={movingStage !== null}
                    className="rounded-xl"
                >
                    {movingStage === 'FINANCE' ? 'Moving...' : 'Move to FINANCE'}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleMoveToStage('ALLOTMENT')}
                    disabled={movingStage !== null}
                    className="rounded-xl"
                >
                    {movingStage === 'ALLOTMENT' ? 'Moving...' : 'Move to ALLOTMENT'}
                </Button>
            </div>

            {/* 1. CORE SPECS & STATUS */}
            <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
                <SectionHeader
                    title="Loan Application Status"
                    icon={Landmark}
                    colorClass="bg-indigo-600 shadow-indigo-600/30"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Field label="Finance Status" value={draft?.status} field="status" icon={CheckCircle2} />
                    <Field label="Financing Bank" value={draft?.bank} field="bank" icon={Building2} />
                    <Field
                        label="Requested Loan"
                        value={draft?.reqLoanAmount}
                        field="reqLoanAmount"
                        addon="₹"
                        type="number"
                    />
                    <Field label="Approved Loan" value={draft?.loanAmount} field="loanAmount" addon="₹" type="number" />
                    <Field
                        label="Initial Downpayment"
                        value={draft?.downpayment}
                        field="downpayment"
                        addon="₹"
                        type="number"
                    />
                    <Field label="Tenure" value={draft?.tenure} field="tenure" suffix="Months" type="number" />
                    <Field
                        label="Interest Rate (Flat)"
                        value={draft?.roi}
                        field="roi"
                        suffix="%"
                        icon={Percent}
                        type="number"
                    />
                    <Field label="EMI Amount" value={draft?.emi} field="emi" addon="₹" type="number" />
                </div>
            </div>

            {/* 2. SANCTIONED DETAILS */}
            <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[3rem] p-8 shadow-sm border-l-4 border-l-rose-500">
                <SectionHeader
                    title="Sanction & Verification"
                    icon={FileText}
                    colorClass="bg-rose-500 shadow-rose-500/30"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Field label="Finance Executive" value={draft?.executive} field="executive" icon={User} />
                    <Field label="Selected Scheme" value={draft?.scheme} field="scheme" icon={BadgePercent} />
                    <Field label="Coupon Applied" value={draft?.coupon} field="coupon" icon={Wallet} />
                    <Field label="Login Time" value={draft?.loginTime} field="loginTime" icon={Clock} />

                    <div className="bg-slate-50 dark:bg-white/[0.01] border border-dashed border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between col-span-1 md:col-span-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Scheme PDF
                        </div>
                        <Button variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest gap-2">
                            <ExternalLink size={12} /> Preview PDF
                        </Button>
                    </div>

                    <Field label="Hypothecation" value={draft?.hypothecation} field="hypothecation" />
                    <Field label="Loan Add-On" value={draft?.loanAddOn} field="loanAddOn" addon="₹" type="number" />
                    <Field
                        label="Gross Loan Amount"
                        value={draft?.grossLoan}
                        field="grossLoan"
                        addon="₹"
                        type="number"
                    />
                    <Field
                        label="Downpayment Charges"
                        value={draft?.downpaymentCharges}
                        field="downpaymentCharges"
                        addon="₹"
                        type="number"
                    />
                    <Field
                        label="Sanctioned Date"
                        value={draft?.sanctionedDate}
                        field="sanctionedDate"
                        icon={Calendar}
                    />

                    <div className="bg-slate-50 dark:bg-white/[0.01] border border-dashed border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Sanction Letter
                        </div>
                        <Button variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest gap-2">
                            <Paperclip size={12} /> Attach File
                        </Button>
                    </div>

                    <Field label="LAN Number" value={draft?.lanNumber} field="lanNumber" />
                </div>
            </div>

            {/* 3. OPERATIONAL MILESTONES */}
            <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
                <SectionHeader
                    title="Operational Milestones"
                    icon={CheckCircle2}
                    colorClass="bg-emerald-500 shadow-emerald-500/30"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Field label="E-NACH Status" value={draft?.eNach} field="eNach" icon={Calendar} />
                    <Field
                        label="Agreement Signed"
                        value={draft?.agreementSigned}
                        field="agreementSigned"
                        icon={Calendar}
                    />
                    <Field label="File Internal Close" value={draft?.fileClose} field="fileClose" icon={Calendar} />
                    <Field
                        label="Disbursement Amount"
                        value={draft?.disbursementAmount}
                        field="disbursementAmount"
                        addon="₹"
                        type="number"
                    />
                    <Field
                        label="Disbursement Date"
                        value={draft?.disbursementDate}
                        field="disbursementDate"
                        icon={Calendar}
                    />
                </div>
            </div>

            {/* 4. CLOSING & SETTLEMENT */}
            <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
                <SectionHeader
                    title="Closing & Settlement"
                    icon={IndianRupee}
                    colorClass="bg-slate-900 shadow-slate-900/30"
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Field
                        label="Hypothecation Amount"
                        value={draft?.hypothecationAmount}
                        field="hypothecationAmount"
                        addon="₹"
                        type="number"
                    />
                    <Field
                        label="Margin Money"
                        value={draft?.marginMoney}
                        field="marginMoney"
                        addon="₹"
                        type="number"
                    />
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 pt-8">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                        Settlement Documents
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {['Performa Invoice', 'Tax Invoice', 'Receipt', 'Process Finance'].map(doc => (
                            <Button
                                key={doc}
                                variant="outline"
                                className="h-14 border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-between px-6 hover:bg-slate-50 dark:hover:bg-white/5 group transition-all"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">{doc}</span>
                                <ArrowRight
                                    size={14}
                                    className="text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all"
                                />
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-2 rounded-2xl shadow-2xl z-50">
                <Button
                    variant="ghost"
                    onClick={() => loadFinanceData()}
                    className="rounded-xl px-6 h-12 text-[10px] font-black uppercase tracking-widest"
                >
                    Discard
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-10 h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 gap-2"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {saving ? 'Saving...' : 'Save Update'}
                </Button>
            </div>
        </div>
    );
}
