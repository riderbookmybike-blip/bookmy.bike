import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMemberFullProfile } from '@/actions/members';
import { formatDisplayId } from '@/utils/displayId';
import { formatMembershipCardCode } from '@/lib/oclub/membershipCardIdentity';

export const metadata: Metadata = { title: 'Member Profile — AUMS' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function Pill({ label, tone }: { label: string; tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
    const cls = {
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        rose: 'bg-rose-50 text-rose-700 border-rose-200',
        slate: 'bg-slate-100 text-slate-600 border-slate-200',
    }[tone ?? 'slate'];
    return (
        <span
            className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cls}`}
        >
            {label}
        </span>
    );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-50 last:border-0">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0 w-32">
                {label}
            </span>
            <span className="text-[11px] font-bold text-slate-800 text-right">{value || '—'}</span>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{title}</h2>
            {children}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
    params: Promise<{ id: string }>;
}

export default async function AumsMemberDetailPage({ params }: Props) {
    const { id } = await params;
    const profile = await getMemberFullProfile(id);
    if (!profile) notFound();

    const { member, wallet, referredMembers } = profile;
    const m = member as any;

    const totalAvailable = (wallet?.available_system ?? 0) + (wallet?.available_referral ?? 0);
    const temp = String(m.current_temperature || m.visitor_temperature || '').toUpperCase();
    const tempTone = temp === 'HOT' ? 'rose' : temp === 'WARM' ? 'amber' : temp === 'COLD' ? 'indigo' : 'slate';

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-50">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    href="/app/aums/members"
                    className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-1"
                >
                    ← Members
                </Link>
                <span className="text-slate-200">/</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {formatDisplayId(m.display_id || m.id)}
                </span>
            </div>

            {/* Hero */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shrink-0">
                        {(m.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-slate-900">{m.full_name || 'Unknown Member'}</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {m.primary_phone || '—'} · {formatDisplayId(m.display_id || m.id)}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {temp && <Pill label={`🌡 ${temp}`} tone={tempTone as any} />}
                            {m.state && <Pill label={m.state} />}
                            {m.district && <Pill label={m.district} />}
                        </div>
                    </div>
                    {/* O' Circle */}
                    <div className="shrink-0 flex flex-col items-center bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
                        <span className="text-2xl font-black text-amber-600">{totalAvailable}</span>
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1">
                            O' Coins
                        </span>
                        {wallet && (
                            <span className="text-[8px] font-bold text-amber-400 mt-0.5">
                                Lifetime: {wallet.lifetime_earned}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Identity */}
                <Section title="Identity">
                    <DataRow label="Full Name" value={m.full_name} />
                    <DataRow label="Phone" value={m.primary_phone} />
                    <DataRow label="Email" value={m.primary_email} />
                    <DataRow label="Display ID" value={formatDisplayId(m.display_id || m.id)} />
                    <DataRow label="Membership" value={m.display_id ? formatMembershipCardCode(m.display_id) : '—'} />
                    <DataRow label="Date of Birth" value={fmtDate(m.date_of_birth)} />
                    <DataRow label="Joined" value={fmtDate(m.created_at)} />
                </Section>

                {/* Location */}
                <Section title="Location">
                    <DataRow label="Pincode" value={m.pincode} />
                    <DataRow label="Taluka" value={m.taluka} />
                    <DataRow label="District" value={m.district} />
                    <DataRow label="State" value={m.state} />
                    <DataRow label="RTO" value={m.rto} />
                    {m.latitude && m.longitude && (
                        <div className="mt-2">
                            <a
                                href={`https://www.google.com/maps?q=${m.latitude},${m.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-black text-emerald-600 hover:underline"
                            >
                                📍 View on Map →
                            </a>
                        </div>
                    )}
                </Section>

                {/* Referral */}
                <Section title="Referral Network">
                    <div className="mb-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Referred By
                        </p>
                        {m.referred_by ? (
                            <Link
                                href={`/aums/members/${m.referred_by.id}`}
                                className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100 hover:border-indigo-300 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                                    {(m.referred_by.full_name || 'U').charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-indigo-800 group-hover:text-indigo-600 transition-colors">
                                        {m.referred_by.full_name}
                                    </p>
                                    <p className="text-[9px] font-bold text-indigo-400">
                                        {formatDisplayId(m.referred_by.display_id || m.referred_by.id)}
                                    </p>
                                </div>
                            </Link>
                        ) : (
                            <p className="text-xs text-slate-300 font-bold">Organic — No referrer</p>
                        )}
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Members Referred ({referredMembers.length})
                        </p>
                        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                            {referredMembers.length === 0 && (
                                <p className="text-xs text-slate-300 font-bold">None yet</p>
                            )}
                            {referredMembers.map((r: any) => (
                                <Link
                                    key={r.id}
                                    href={`/aums/members/${r.id}`}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group text-xs font-bold text-slate-700 group-hover:text-indigo-700"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                    {r.full_name || 'Unnamed'} · {formatDisplayId(r.display_id || r.id)}
                                    <span className="ml-auto text-[8px] text-slate-400">{fmtDate(r.created_at)}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </Section>
            </div>

            {/* O' Circle Wallet */}
            {wallet && (
                <Section title="O' Circle Wallet">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Available (System)', value: wallet.available_system, tone: 'indigo' },
                            { label: 'Available (Referral)', value: wallet.available_referral, tone: 'emerald' },
                            { label: 'Locked Referral', value: wallet.locked_referral, tone: 'amber' },
                            { label: 'Lifetime Earned', value: wallet.lifetime_earned, tone: 'slate' },
                        ].map(({ label, value, tone }) => (
                            <div
                                key={label}
                                className={`rounded-xl p-4 border text-center ${
                                    tone === 'indigo'
                                        ? 'bg-indigo-50 border-indigo-100'
                                        : tone === 'emerald'
                                          ? 'bg-emerald-50 border-emerald-100'
                                          : tone === 'amber'
                                            ? 'bg-amber-50 border-amber-100'
                                            : 'bg-slate-50 border-slate-100'
                                }`}
                            >
                                <div className="text-2xl font-black text-slate-900">{value}</div>
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {label}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold mt-3 text-right">
                        Last updated: {fmtTime(wallet.updated_at)}
                    </p>
                </Section>
            )}

            {/* Intent Signal */}
            <Section title="Intent Signal">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <DataRow label="Current Temp" value={temp || 'Unknown'} />
                    <DataRow label="Max Temp" value={String(m.max_temperature || '').toUpperCase() || '—'} />
                    <DataRow label="Last Visit" value={fmtTime(m.last_visit_at)} />
                    <DataRow label="Last PDP" value={fmtTime(m.last_pdp_at)} />
                    <DataRow label="Last Catalog" value={fmtTime(m.last_catalog_at)} />
                    <DataRow label="Last Landing" value={fmtTime(m.last_landing_at)} />
                </div>
            </Section>
        </div>
    );
}
