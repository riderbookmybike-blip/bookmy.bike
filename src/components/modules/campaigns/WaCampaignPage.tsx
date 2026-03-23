'use client';

import React, { useEffect, useState, useTransition, useCallback, useRef } from 'react';
import type { WaCampaign, WaCampaignLog, WaCampaignRecipient } from '@/actions/wa-campaign';
import {
    sendTestBatch,
    approveTestBatch,
    runNextBatch,
    pauseCampaign,
    resumeCampaign,
    stopCampaign,
    refreshEligibleCount,
    backfillCampaignStatus,
} from '@/actions/wa-campaign';
import { WaCampaignRecipientsGrid } from './WaCampaignRecipientsGrid';
import {
    FlaskConical,
    CheckCircle2,
    Play,
    RefreshCw,
    Pause,
    Square,
    ShieldAlert,
    ShieldCheck,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Timer,
    Hourglass,
    Send,
    Users,
    Download,
} from 'lucide-react';

interface Props {
    initialCampaign: WaCampaign;
    initialLogs: WaCampaignLog[];
    initialRecipients: WaCampaignRecipient[];
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    TEST: 'bg-yellow-100 text-yellow-700',
    ACTIVE: 'bg-green-100 text-green-700',
    RUNNING: 'bg-violet-100 text-violet-700',
    PAUSED: 'bg-orange-100 text-orange-700',
    STOPPED: 'bg-rose-100 text-rose-700',
    DONE: 'bg-blue-100 text-blue-700',
};
const LOG_STATUS_COLORS: Record<string, string> = {
    QUEUED: 'bg-slate-100 text-slate-500',
    RUNNING: 'bg-violet-100 text-violet-700',
    DONE: 'bg-green-100 text-green-700',
    FAILED: 'bg-rose-100 text-rose-700',
    PAUSED: 'bg-orange-100 text-orange-700',
};

function StatusBadge({ status, map }: { status: string; map: Record<string, string> }) {
    return (
        <span
            className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] ?? 'bg-slate-100 text-slate-500'}`}
        >
            {status}
        </span>
    );
}

const BTN: Record<string, string> = {
    yellow: 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
    ghost: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
    orange: 'border border-orange-300 text-orange-700 hover:bg-orange-50',
    red: 'border border-rose-300 text-rose-700 hover:bg-rose-50',
};

function Btn({
    id,
    label,
    icon,
    variant,
    disabled,
    onClick,
}: {
    id?: string;
    label: string;
    icon: React.ReactNode;
    variant: keyof typeof BTN;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            id={id}
            disabled={disabled}
            onClick={onClick}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] ${BTN[variant]}`}
        >
            {icon}
            {label}
        </button>
    );
}

export function WaCampaignPage({ initialCampaign, initialLogs, initialRecipients }: Props) {
    const [campaign, setCampaign] = useState<WaCampaign>(initialCampaign);
    const [logs, setLogs] = useState<WaCampaignLog[]>(initialLogs);
    const [recipients, setRecipients] = useState<WaCampaignRecipient[]>(initialRecipients);
    const [activeTab, setActiveTab] = useState<'logs' | 'recipients'>('logs');
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);
    const [riskPayload, setRiskPayload] = useState<{ failed_rate_pct: number; threshold_pct: number } | null>(null);
    const [retryAfter, setRetryAfter] = useState<number>(0);
    const [isPending, startTransition] = useTransition();
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ updated: number; scanned: number } | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const campaignId = campaign.id;

    const pollLogs = useCallback(async () => {
        try {
            const res = await fetch(`/api/aums/campaigns/${campaignId}/logs`);
            if (res.ok) {
                const j = await res.json();
                setLogs(j.logs ?? []);
            }
        } catch {
            /* silent */
        }
    }, [campaignId]);

    const pollRecipientStatuses = useCallback(async () => {
        try {
            const res = await fetch(`/api/aums/campaigns/${campaignId}/recipients-status`);
            if (!res.ok) return;
            const j = await res.json();
            const updates = (j.recipients ?? []) as Array<{
                id: string;
                send_status: 'SENT' | 'FAILED';
                delivered_at: string | null;
                read_at: string | null;
                clicked_at: string | null;
                signup_at: string | null;
                login_at: string | null;
            }>;
            if (!updates.length) return;
            const map = new Map(updates.map(u => [u.id, u]));
            setRecipients(prev =>
                prev.map(r => {
                    const u = map.get(r.id);
                    if (!u) return r;
                    return {
                        ...r,
                        send_status: u.send_status,
                        delivered_at: u.delivered_at,
                        read_at: u.read_at,
                        clicked_at: u.clicked_at,
                        signup_at: u.signup_at,
                        login_at: u.login_at,
                    };
                })
            );
            const failedRows = updates.filter(u => u.send_status === 'FAILED').length;
            if (failedRows > campaign.failed_count) {
                setCampaign(prev => ({ ...prev, failed_count: failedRows }));
            }
        } catch {
            /* silent */
        }
    }, [campaignId, campaign.failed_count]);

    useEffect(() => {
        const id = setInterval(pollLogs, campaign.status === 'RUNNING' ? 5_000 : 15_000);
        return () => clearInterval(id);
    }, [pollLogs, campaign.status]);

    useEffect(() => {
        const id = setInterval(pollRecipientStatuses, 10_000);
        return () => clearInterval(id);
    }, [pollRecipientStatuses]);

    useEffect(() => {
        if (retryAfter <= 0) return;
        countdownRef.current = setInterval(
            () =>
                setRetryAfter(s => {
                    if (s <= 1) {
                        clearInterval(countdownRef.current!);
                        return 0;
                    }
                    return s - 1;
                }),
            1000
        );
        return () => clearInterval(countdownRef.current!);
    }, [retryAfter]);

    const go = (
        fn: () => Promise<{
            success: boolean;
            error?: string;
            too_soon?: boolean;
            retry_after_seconds?: number;
            busy?: boolean;
            risk_blocked?: boolean;
            failed_rate_pct?: number;
            threshold_pct?: number;
            data?: unknown;
        }>,
        msg: string,
        reload = false
    ) => {
        setActionError(null);
        setActionSuccess(null);
        setRetryAfter(0);
        setRiskPayload(null);
        startTransition(async () => {
            const r = await fn();
            if (r.risk_blocked) {
                setRiskPayload({ failed_rate_pct: r.failed_rate_pct ?? 0, threshold_pct: r.threshold_pct ?? 30 });
            } else if (r.too_soon && r.retry_after_seconds) {
                setRetryAfter(r.retry_after_seconds);
                setActionError(`Too soon — next batch in ${Math.ceil(r.retry_after_seconds / 60)} min`);
            } else if (r.busy) {
                setActionError('A batch is already in progress — wait for it to finish');
            } else if (!r.success) {
                setActionError(r.error ?? 'Action failed');
            } else {
                setActionSuccess(msg);
                await pollLogs();
                if (reload) window.location.reload();
            }
        });
    };

    const isTerminal = campaign.status === 'STOPPED' || campaign.status === 'DONE';
    const isRunning = campaign.status === 'RUNNING';
    const canSendTest = campaign.status === 'DRAFT' && !isPending;
    const canApprove = campaign.status === 'TEST' && !campaign.test_batch_approved && !isPending;
    const canRunNext = campaign.status === 'ACTIVE' && campaign.test_batch_approved && !isPending && retryAfter === 0;
    const canPause = campaign.status === 'ACTIVE' && !isPending;
    const canResume = campaign.status === 'PAUSED' && !isPending;
    const canStop = !isTerminal && !isPending && !isRunning;
    const remaining = Math.max(0, (campaign.eligible_count ?? 0) - campaign.sent_count);
    const progressPct = campaign.eligible_count
        ? Math.min(100, Math.round((campaign.sent_count / campaign.eligible_count) * 100))
        : 0;

    const fmt = (dt: string | null) =>
        dt
            ? new Date(dt).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : '—';

    return (
        <div className="flex flex-col min-h-0 flex-1 bg-slate-50">
            {/* ── Campaign header ────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-200 px-8 py-5">
                <div className="max-w-screen-2xl mx-auto space-y-4">
                    {/* Title + status + stats */}
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="p-2.5 bg-green-100 rounded-xl shrink-0">
                                <Send className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">{campaign.name}</h1>
                                    <StatusBadge status={campaign.status} map={STATUS_COLORS} />
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                        {campaign.template_name}
                                    </code>
                                    <span
                                        className={`font-semibold ${campaign.template_status === 'APPROVED' ? 'text-green-600' : 'text-yellow-600'}`}
                                    >
                                        {campaign.template_status === 'APPROVED'
                                            ? '✓ Template approved'
                                            : '⚠ Template pending'}
                                    </span>
                                    {(campaign.offer_start || campaign.offer_end) && (
                                        <span>
                                            Offer: {campaign.offer_start ?? '—'} → {campaign.offer_end ?? '—'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stat pills */}
                        <div className="flex items-stretch gap-3 flex-wrap">
                            {[
                                { label: 'Eligible', value: campaign.eligible_count ?? '—', cls: 'text-slate-700' },
                                { label: 'Sent', value: campaign.sent_count, cls: 'text-green-700' },
                                {
                                    label: 'Failed',
                                    value: campaign.failed_count,
                                    cls: campaign.failed_count > 0 ? 'text-rose-600' : 'text-slate-400',
                                },
                                { label: 'Remaining', value: remaining, cls: 'text-slate-700' },
                            ].map(s => (
                                <div
                                    key={s.label}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-center min-w-[80px]"
                                >
                                    <div className={`text-2xl font-black tabular-nums ${s.cls}`}>{s.value}</div>
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
                                        {s.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Progress bar */}
                    {campaign.eligible_count != null && campaign.eligible_count > 0 && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Campaign progress</span>
                                <span className="font-semibold text-slate-600">{progressPct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-green-500 transition-all duration-700"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Controls strip (Batch Controls + Audience Filters side by side) ── */}
            <div className="bg-white border-b border-slate-200 px-8 py-4">
                <div className="max-w-screen-2xl mx-auto flex flex-wrap items-start gap-8">
                    {/* Batch Controls */}
                    <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Batch Controls</p>
                            <span className="text-xs text-slate-400">
                                Size <strong className="text-slate-600">{campaign.batch_size}</strong>
                                {' · Delay '}
                                <strong className="text-slate-600">{campaign.batch_delay_min}m</strong>
                            </span>
                        </div>

                        {/* Inline banners */}
                        {isRunning && (
                            <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 text-violet-700 rounded-lg px-3 py-2 text-xs">
                                <span className="animate-spin">⏳</span> Batch in progress — Run Next Batch is locked
                            </div>
                        )}
                        {retryAfter > 0 && (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs">
                                <Timer className="h-3.5 w-3.5 shrink-0" />
                                Next batch in{' '}
                                <strong className="mx-1">
                                    {Math.floor(retryAfter / 60)}m {retryAfter % 60}s
                                </strong>
                            </div>
                        )}
                        {riskPayload && (
                            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5">
                                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                <div className="space-y-1.5">
                                    <p className="text-xs text-rose-700 font-medium">
                                        High failure rate: {riskPayload.failed_rate_pct}% ≥ {riskPayload.threshold_pct}%
                                        threshold
                                    </p>
                                    <button
                                        onClick={() => {
                                            setRiskPayload(null);
                                            go(
                                                () => runNextBatch(campaignId, { force: true }),
                                                'Batch dispatched (forced).',
                                                true
                                            );
                                        }}
                                        className="text-xs font-bold px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                                    >
                                        Force run anyway
                                    </button>
                                </div>
                            </div>
                        )}
                        {actionError && !riskPayload && (
                            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-xs">
                                <XCircle className="h-3.5 w-3.5 shrink-0" /> {actionError}
                            </div>
                        )}
                        {actionSuccess && (
                            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {actionSuccess}
                            </div>
                        )}

                        {/* Action buttons — horizontal row */}
                        <div className="flex flex-wrap gap-2">
                            <Btn
                                id="btn-send-test"
                                label="Send Test Batch"
                                icon={<FlaskConical className="h-4 w-4" />}
                                variant="yellow"
                                disabled={!canSendTest}
                                onClick={() =>
                                    go(
                                        () => sendTestBatch(campaignId),
                                        'Test batch sent — review before approving.',
                                        true
                                    )
                                }
                            />
                            <Btn
                                id="btn-approve-test"
                                label="Approve Test"
                                icon={<CheckCircle2 className="h-4 w-4" />}
                                variant="blue"
                                disabled={!canApprove}
                                onClick={() =>
                                    go(() => approveTestBatch(campaignId), 'Approved. Production unlocked.', true)
                                }
                            />
                            <Btn
                                id="btn-run-next"
                                label="Run Next Batch"
                                icon={<Play className="h-4 w-4" />}
                                variant="green"
                                disabled={!canRunNext}
                                onClick={() => go(() => runNextBatch(campaignId), 'Batch dispatched.', true)}
                            />
                            <div className="w-px bg-slate-200 mx-1 self-stretch" />
                            <Btn
                                id="btn-refresh"
                                label="Refresh Count"
                                icon={<RefreshCw className="h-4 w-4" />}
                                variant="ghost"
                                disabled={isPending}
                                onClick={() => go(() => refreshEligibleCount(campaignId), 'Count refreshed.', true)}
                            />
                            <button
                                id="btn-sync-status"
                                disabled={isSyncing || isPending}
                                onClick={async () => {
                                    setSyncResult(null);
                                    setActionError(null);
                                    setActionSuccess(null);
                                    setIsSyncing(true);
                                    try {
                                        const r = await backfillCampaignStatus(campaignId);
                                        if (r.success && r.data) {
                                            setSyncResult(r.data);
                                            await Promise.all([pollLogs(), pollRecipientStatuses()]);
                                        } else {
                                            setActionError(r.error ?? 'Sync failed');
                                        }
                                    } finally {
                                        setIsSyncing(false);
                                    }
                                }}
                                className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] border border-slate-300 text-slate-700 hover:bg-slate-50"
                            >
                                <Download className={`h-4 w-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                                {isSyncing ? 'Syncing…' : 'Sync from MSG91'}
                            </button>
                            {syncResult && (
                                <span className="text-xs text-emerald-600 font-semibold self-center">
                                    ✓ {syncResult.updated} updated (scanned {syncResult.scanned})
                                </span>
                            )}
                            {canPause && (
                                <Btn
                                    id="btn-pause"
                                    label="Pause"
                                    icon={<Pause className="h-4 w-4" />}
                                    variant="orange"
                                    onClick={() => go(() => pauseCampaign(campaignId), 'Paused.', true)}
                                />
                            )}
                            {canResume && (
                                <Btn
                                    id="btn-resume"
                                    label="Resume"
                                    icon={<Play className="h-4 w-4" />}
                                    variant="ghost"
                                    onClick={() => go(() => resumeCampaign(campaignId), 'Resumed.', true)}
                                />
                            )}
                            {canStop && (
                                <Btn
                                    id="btn-stop"
                                    label="Stop"
                                    icon={<Square className="h-4 w-4" />}
                                    variant="red"
                                    onClick={() => {
                                        if (!confirm('Stop permanently? Cannot be undone.')) return;
                                        go(() => stopCampaign(campaignId), 'Stopped.', true);
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px bg-slate-200 self-stretch" />

                    {/* Audience Filters */}
                    <div className="shrink-0 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Audience Filters <span className="font-normal normal-case text-slate-400">(locked)</span>
                        </p>
                        <ul className="space-y-1.5">
                            {[
                                { ok: true, text: 'Serviceable: 200km from 401203' },
                                { ok: true, text: 'Valid WhatsApp number required' },
                                { ok: false, text: 'Exclude opted-out users', note: 'wa_opt_out pending' },
                                { ok: false, text: 'Exclude blacklisted numbers', note: 'exclusion contract pending' },
                            ].map(f => (
                                <li key={f.text} className="flex items-start gap-2 text-xs">
                                    {f.ok ? (
                                        <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                                    ) : (
                                        <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    )}
                                    <span className="text-slate-600">
                                        {f.text}
                                        {f.note && <span className="ml-1 text-amber-500">({f.note})</span>}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* ── Full-width table area ─────────────────────────────────────── */}
            <div className="flex-1 overflow-auto px-8 py-6">
                <div className="max-w-screen-2xl mx-auto">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Tab bar */}
                        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50">
                            {(
                                [
                                    {
                                        key: 'logs',
                                        label: 'Batch Logs',
                                        icon: <Send className="h-3.5 w-3.5" />,
                                        count: logs.length,
                                    },
                                    {
                                        key: 'recipients',
                                        label: 'Recipients',
                                        icon: <Users className="h-3.5 w-3.5" />,
                                        count: recipients.length,
                                    },
                                ] as const
                            ).map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-1 py-4 mr-6 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                                        activeTab === tab.key
                                            ? 'border-green-500 text-green-700'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    <span
                                        className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                            <div className="flex-1" />
                            <span className="text-xs text-slate-400">Auto-refreshes every 15s</span>
                        </div>

                        <div className="p-6">
                            {/* Batch Logs */}
                            {activeTab === 'logs' &&
                                (logs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                        <Hourglass className="h-10 w-10 mb-3 opacity-30" />
                                        <p className="text-sm font-medium">No batches sent yet</p>
                                        <p className="text-xs mt-1 opacity-60">Send a test batch to get started</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-left">
                                                    {[
                                                        'Batch',
                                                        'Type',
                                                        'Status',
                                                        'Sent',
                                                        'Failed',
                                                        'Delivered',
                                                        'Read',
                                                        'Clicked',
                                                        'Started',
                                                        'Completed',
                                                    ].map(h => (
                                                        <th
                                                            key={h}
                                                            className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                                                        >
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {logs.map(log => (
                                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 font-mono font-bold text-slate-700">
                                                            #{log.batch_number}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${log.is_test ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}
                                                            >
                                                                {log.is_test ? 'TEST' : 'PROD'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <StatusBadge status={log.status} map={LOG_STATUS_COLORS} />
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-green-600 tabular-nums">
                                                            {log.sent_count}
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold tabular-nums">
                                                            {log.failed_count > 0 ? (
                                                                <span className="text-rose-600">
                                                                    {log.failed_count}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 tabular-nums">
                                                            {log.delivered_count > 0 ? (
                                                                <span className="text-emerald-600 font-semibold">
                                                                    {log.delivered_count}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 tabular-nums">
                                                            {log.read_count > 0 ? (
                                                                <span className="text-blue-600 font-semibold">
                                                                    {log.read_count}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 tabular-nums">
                                                            {log.clicked_count > 0 ? (
                                                                <span className="text-violet-600 font-semibold">
                                                                    {log.clicked_count}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                                            {fmt(log.started_at)}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                                            {fmt(log.completed_at)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {logs.some(l => l.error_summary) && (
                                            <div className="mt-4 space-y-2">
                                                {logs
                                                    .filter(l => l.error_summary)
                                                    .map(l => (
                                                        <div
                                                            key={l.id}
                                                            className="flex items-start gap-2 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                            Batch #{l.batch_number}: {l.error_summary}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                            {/* Recipients */}
                            {activeTab === 'recipients' && <WaCampaignRecipientsGrid recipients={recipients} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
