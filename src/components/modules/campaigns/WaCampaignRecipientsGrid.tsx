'use client';

import React, { useState, useMemo } from 'react';
import type { WaCampaignRecipient } from '@/actions/wa-campaign';
import { CheckCircle, XCircle, Clock, Copy, Check, Users, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface Props {
    recipients: WaCampaignRecipient[];
}

type SortKey =
    | 'full_name'
    | 'phone'
    | 'distance_km'
    | 'sent_at'
    | 'delivered_at'
    | 'read_at'
    | 'clicked_at'
    | 'signup_at'
    | 'login_at';
type SortDir = 'asc' | 'desc';

function PhoneCell({ phone }: { phone: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(phone).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };
    return (
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
            <span>{phone}</span>
            <button onClick={copy} title="Copy" className="text-slate-300 hover:text-slate-600 transition-colors">
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </button>
        </div>
    );
}

function TS({ value, label }: { value: string | null; label: string }) {
    if (!value)
        return (
            <span
                title={`${label}: pending`}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200 font-medium"
            >
                <Clock className="h-2.5 w-2.5" />
                pending
            </span>
        );
    const d = new Date(value);
    return (
        <span title={d.toLocaleString('en-IN')} className="text-xs text-slate-600">
            {d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
    );
}

// Column header with sort indicator
function SortTh({
    label,
    sortKey,
    current,
    dir,
    onSort,
}: {
    label: string;
    sortKey: SortKey;
    current: SortKey | null;
    dir: SortDir;
    onSort: (k: SortKey) => void;
}) {
    const active = current === sortKey;
    return (
        <th
            className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 cursor-pointer select-none hover:text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap"
            onClick={() => onSort(sortKey)}
        >
            <span className="flex items-center gap-1">
                {label}
                {active ? (
                    dir === 'asc' ? (
                        <ChevronUp className="h-3 w-3 text-green-600" />
                    ) : (
                        <ChevronDown className="h-3 w-3 text-green-600" />
                    )
                ) : (
                    <ChevronsUpDown className="h-3 w-3 opacity-30" />
                )}
            </span>
        </th>
    );
}

const cmp = (a: string | null, b: string | null) => ((a ?? '') < (b ?? '') ? -1 : (a ?? '') > (b ?? '') ? 1 : 0);

export function WaCampaignRecipientsGrid({ recipients }: Props) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const onSort = (k: SortKey) => {
        if (sortKey === k) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else {
            setSortKey(k);
            setSortDir('asc');
        }
    };

    const total = recipients.length;
    const failed = recipients.filter(r => r.send_status === 'FAILED').length;
    const delivered = recipients.filter(r => !!r.delivered_at).length;
    const read = recipients.filter(r => !!r.read_at).length;
    const clicked = recipients.filter(r => !!r.clicked_at).length;
    const signup = recipients.filter(r => !!r.signup_at).length;
    const login = recipients.filter(r => !!r.login_at).length;
    const queued = recipients.filter(r => r.send_status === 'SENT' && !r.delivered_at && !r.read_at).length;

    const filtered = useMemo(() => {
        let rows = search.trim()
            ? recipients.filter(
                  r =>
                      r.phone.includes(search) ||
                      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                      r.pincode?.includes(search) ||
                      r.area?.toLowerCase().includes(search.toLowerCase()) ||
                      r.district?.toLowerCase().includes(search.toLowerCase())
              )
            : [...recipients];

        if (sortKey) {
            rows.sort((a, b) => {
                let v = 0;
                if (sortKey === 'distance_km') {
                    v = (a.distance_km ?? 999) - (b.distance_km ?? 999);
                } else {
                    v = cmp(a[sortKey] as string | null, b[sortKey] as string | null);
                }
                return sortDir === 'asc' ? v : -v;
            });
        }
        return rows;
    }, [recipients, search, sortKey, sortDir]);

    const plainTh = (label: string) => (
        <th key={label} className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {label}
        </th>
    );

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                {[
                    { k: 'Total', v: total, cls: 'text-slate-700 bg-slate-100' },
                    { k: 'Queued', v: queued, cls: 'text-amber-700 bg-amber-100' },
                    { k: 'Failed', v: failed, cls: 'text-rose-700 bg-rose-100' },
                    { k: 'Delivered', v: delivered, cls: 'text-green-700 bg-green-100' },
                    { k: 'Read', v: read, cls: 'text-emerald-700 bg-emerald-100' },
                    { k: 'Clicked', v: clicked, cls: 'text-blue-700 bg-blue-100' },
                    { k: 'Signup', v: signup, cls: 'text-violet-700 bg-violet-100' },
                    { k: 'Login', v: login, cls: 'text-indigo-700 bg-indigo-100' },
                ].map(item => (
                    <div key={item.k} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                        <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{item.k}</div>
                        <div className={`inline-flex mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${item.cls}`}>
                            {item.v}
                        </div>
                    </div>
                ))}
            </div>

            {/* Wiring status notice */}
            <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2.5">
                <strong>Wired:</strong> <code>delivered/read/failed/clicked</code> via MSG91 webhook ·{' '}
                <code>signup/login</code> via auth session events.
                <span className="ml-1 text-emerald-600">
                    If counts are pending, verify MSG91 webhook callback is configured to this app route.
                </span>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    placeholder="Search name, phone, pincode, area…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 text-sm rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                />
                <span className="text-xs text-slate-400 whitespace-nowrap font-mono">
                    {filtered.length}/{recipients.length}
                </span>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Users className="h-10 w-10 mb-3 opacity-25" />
                    <p className="text-sm font-medium">
                        {recipients.length === 0 ? 'No recipients yet — run a batch to populate.' : 'No matches.'}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs border-collapse min-w-[960px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <SortTh
                                    label="Name"
                                    sortKey="full_name"
                                    current={sortKey}
                                    dir={sortDir}
                                    onSort={onSort}
                                />
                                <SortTh label="Phone" sortKey="phone" current={sortKey} dir={sortDir} onSort={onSort} />
                                {plainTh('Pincode')}
                                {plainTh('Area')}
                                {plainTh('District')}
                                <SortTh
                                    label="Dist km"
                                    sortKey="distance_km"
                                    current={sortKey}
                                    dir={sortDir}
                                    onSort={onSort}
                                />
                                {plainTh('Status')}
                                <SortTh
                                    label="Sent"
                                    sortKey="sent_at"
                                    current={sortKey}
                                    dir={sortDir}
                                    onSort={onSort}
                                />
                                <SortTh
                                    label="Delivered"
                                    sortKey="delivered_at"
                                    current={sortKey}
                                    dir={sortDir}
                                    onSort={onSort}
                                />
                                <SortTh
                                    label="Read"
                                    sortKey="read_at"
                                    current={sortKey}
                                    dir={sortDir}
                                    onSort={onSort}
                                />
                                <SortTh
                                    label="Clicked"
                                    sortKey="clicked_at"
                                    current={sortKey}
                                    dir={sortDir}
                                    onSort={onSort}
                                />
                                <SortTh
                                    label="Signup"
                                    sortKey="signup_at"
                                    current={sortKey}
                                    dir={sortDir}
                                    onSort={onSort}
                                />
                                <SortTh
                                    label="Login"
                                    sortKey="login_at"
                                    current={sortKey}
                                    dir={sortDir}
                                    onSort={onSort}
                                />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-3 py-2.5 text-slate-800 font-medium max-w-[130px] truncate">
                                        {r.full_name ?? <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <PhoneCell phone={r.phone} />
                                    </td>
                                    <td className="px-3 py-2.5 font-mono text-slate-500">{r.pincode ?? '—'}</td>
                                    <td className="px-3 py-2.5 text-slate-500 max-w-[110px] truncate">
                                        {r.area ?? '—'}
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-500 max-w-[110px] truncate">
                                        {r.district ?? '—'}
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-500 tabular-nums">{r.distance_km ?? '—'}</td>
                                    <td className="px-3 py-2.5">
                                        {r.send_status === 'SENT' ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                <CheckCircle className="h-2.5 w-2.5" />
                                                SENT
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                                <XCircle className="h-2.5 w-2.5" />
                                                FAILED
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <TS value={r.sent_at} label="Sent" />
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <TS value={r.delivered_at} label="Delivered" />
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <TS value={r.read_at} label="Read" />
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <TS value={r.clicked_at} label="Clicked" />
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <TS value={r.signup_at} label="Signup" />
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <TS value={r.login_at} label="Login" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
