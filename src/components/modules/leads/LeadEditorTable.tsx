'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useTenant } from '@/lib/tenant/tenantContext';
import {
    Calendar,
    ChevronDown,
    ChevronRight,
    Clock,
    MoreHorizontal,
    User,
    Activity,
    ShieldCheck,
    Phone,
    Mail,
    BadgeCheck,
    Plus,
    Target,
    Flame,
    MapPin,
    FileText,
    Paperclip,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDisplayId } from '@/utils/displayId';
import { toast } from 'sonner';
import DocumentManager from '@/components/modules/leads/DocumentManager';
import {
    addLeadNoteAction,
    addLeadTaskAction,
    getLeadEventsAction,
    getMemberDocumentUrl,
    getLeadModuleStateAction,
    updateLeadIntentScoreAction,
    updateLeadAction,
    type LeadEventRecord,
    toggleLeadTaskAction,
} from '@/actions/crm';
import { getOClubLedger, getOClubWallet } from '@/actions/oclub';
import { getMemberFullProfile } from '@/actions/members';
import { createClient } from '@/lib/supabase/client';

interface LeadProfile {
    lead: any;
    quotes: any[];
    bookings: any[];
    receipts: any[];
}

type LeadNoteAttachment = {
    path: string;
    name: string;
    file_type: string | null;
    size: number | null;
};

type LeadModuleNote = {
    id: string;
    body: string;
    created_at: string;
    created_by: string | null;
    created_by_name?: string | null;
    attachments?: LeadNoteAttachment[];
};

type LeadTimelineEntry = {
    id: string;
    title: string;
    description: string;
    timestamp: string | null;
    source: 'EVENT_LOG' | 'LEGACY_LOG';
    actorName?: string | null;
    changedValue?: string | null;
};

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString();
    } catch {
        return value;
    }
};

const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return value;
    }
};

const formatMoney = (value?: number | null) => {
    if (value === null || value === undefined) return '—';
    return `₹${value.toLocaleString()}`;
};

const formatEventTypeLabel = (eventType?: string | null) =>
    (eventType || 'SYSTEM_EVENT')
        .split('_')
        .filter(Boolean)
        .map(token => token.charAt(0) + token.slice(1).toLowerCase())
        .join(' ');

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

export default function LeadEditorTable({ profile }: { profile: LeadProfile }) {
    const params = useParams();
    const router = useRouter();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';
    const { device } = useBreakpoint();
    const isPhone = device === 'phone';
    const { tenantSlug, tenantId } = useTenant();

    // ── Derived lead reference (must be before any useState that accesses lead) ──
    const lead = profile.lead || {};

    type TabKey =
        | 'LEAD'
        | 'FINANCE'
        | 'TRANSACTIONS'
        | 'MEMBER'
        | 'DOCUMENTS'
        | 'TASKS'
        | 'NOTES'
        | 'TIMELINE'
        | 'OCLUB';
    const [activeTab, setActiveTab] = useState<TabKey>('LEAD');
    const [groups, setGroups] = useState({
        transactionQuotes: true,
        transactionBookings: true,
        transactionReceipts: true,
    });
    const [moduleLoading, setModuleLoading] = useState(false);
    const [notes, setNotes] = useState<LeadModuleNote[]>([]);
    const [tasks, setTasks] = useState<
        Array<{
            id: string;
            title: string;
            due_date: string | null;
            completed: boolean;
            completed_at: string | null;
            created_at: string;
            created_by: string | null;
            priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
            assigned_to_name?: string | null;
        }>
    >([]);
    const [noteDraft, setNoteDraft] = useState('');
    const [noteAttachments, setNoteAttachments] = useState<File[]>([]);
    const [noteAttachmentUrls, setNoteAttachmentUrls] = useState<Record<string, string>>({});
    const [taskDraft, setTaskDraft] = useState('');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
    const [savingNote, setSavingNote] = useState(false);
    const [savingTask, setSavingTask] = useState(false);
    const [walletLoading, setWalletLoading] = useState(false);
    const [memberProfile, setMemberProfile] = useState<any | null>(null);
    const [memberProfileLoading, setMemberProfileLoading] = useState(false);
    const [wallet, setWallet] = useState<any | null>(null);
    const [ledger, setLedger] = useState<any[]>([]);
    const [leadEventsLoading, setLeadEventsLoading] = useState(false);
    const [leadEvents, setLeadEvents] = useState<LeadEventRecord[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        customer_name: lead.customerName || '',
        customer_phone: lead.phone || '',
        customer_pincode: lead.pincode || '',
        customer_dob: lead.dob || '',
        interest_text: lead.interestText || lead.interestModel || '',
    });
    const noteAttachmentInputRef = useRef<HTMLInputElement>(null);
    const supabase = useMemo(() => createClient(), []);

    const quoteCount = profile.quotes?.length || 0;
    const bookingCount = profile.bookings?.length || 0;
    const receiptCount = profile.receipts?.length || 0;
    const leadLocationProfile =
        lead?.raw?.utm_data && typeof lead.raw.utm_data === 'object'
            ? (((lead.raw.utm_data as Record<string, unknown>).location_profile as
                  | Record<string, string>
                  | undefined) ?? {})
            : ({} as Record<string, string>);
    const leadArea = lead.area || leadLocationProfile?.area || '—';
    const leadDistrict = lead.district || leadLocationProfile?.district || '—';
    const leadState = lead.state || leadLocationProfile?.state || '—';
    const legacyTimelineEvents = Array.isArray(lead?.events_log) ? (lead.events_log as Record<string, unknown>[]) : [];
    const timelineEntries = useMemo<LeadTimelineEntry[]>(() => {
        const fromLeadEvents = leadEvents.map(event => ({
            id: `event-${event.id}`,
            title: formatEventTypeLabel(event.event_type),
            description: event.notes || event.changed_value || 'System event',
            timestamp: event.created_at || null,
            source: 'EVENT_LOG' as const,
            actorName: event.actor_name || null,
            changedValue: event.changed_value || null,
        }));

        const fromLegacy = legacyTimelineEvents.map((event: any, index: number) => ({
            id: `legacy-${event?.id || index}`,
            title: event?.title || formatEventTypeLabel(event?.type),
            description: event?.description || event?.meta || 'System-generated activity log',
            timestamp: event?.timestamp || event?.at || null,
            source: 'LEGACY_LOG' as const,
            actorName: event?.actor || null,
            changedValue: null,
        }));

        return [...fromLeadEvents, ...fromLegacy].sort((a, b) => {
            const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return bTime - aTime;
        });
    }, [leadEvents, legacyTimelineEvents]);

    const tabs = useMemo(
        () => [
            { key: 'LEAD', label: 'LEAD', count: 0 },
            { key: 'FINANCE', label: 'FINANCE', count: quoteCount },
            { key: 'TRANSACTIONS', label: 'TRANSACTION', count: quoteCount + bookingCount + receiptCount },
            { key: 'MEMBER', label: 'MEMBER', count: 0 },
            { key: 'DOCUMENTS', label: 'DOCUMENTS', count: lead.customerId ? 1 : 0 },
            { key: 'TASKS', label: 'TASK', count: tasks.filter(task => !task.completed).length },
            { key: 'NOTES', label: 'NOTES', count: notes.length },
            {
                key: 'TIMELINE',
                label: 'TIMELINE',
                count: timelineEntries.length,
            },
            { key: 'OCLUB', label: 'O CLUB', count: 0 },
        ],
        [quoteCount, bookingCount, receiptCount, lead.customerId, tasks, notes, timelineEntries.length]
    );

    useEffect(() => {
        const loadLeadModules = async () => {
            if (!lead?.id) {
                setNotes([]);
                setTasks([]);
                return;
            }

            setModuleLoading(true);
            const result = await getLeadModuleStateAction(lead.id);
            if (result.success) {
                setNotes(result.notes || []);
                setTasks(result.tasks || []);
            } else {
                setNotes([]);
                setTasks([]);
            }
            setModuleLoading(false);
        };

        loadLeadModules();
    }, [lead?.id]);

    useEffect(() => {
        const loadLeadEvents = async () => {
            if (!lead?.id) {
                setLeadEvents([]);
                return;
            }

            setLeadEventsLoading(true);
            const result = await getLeadEventsAction(lead.id, 150);
            if (result.success) {
                setLeadEvents(result.events || []);
            } else {
                setLeadEvents([]);
            }
            setLeadEventsLoading(false);
        };

        loadLeadEvents();
    }, [lead?.id]);

    useEffect(() => {
        const uniquePaths = Array.from(
            new Set(notes.flatMap(note => (Array.isArray(note.attachments) ? note.attachments : [])).map(a => a.path))
        ).filter(Boolean);

        if (uniquePaths.length === 0) {
            setNoteAttachmentUrls({});
            return;
        }

        let active = true;
        const loadAttachmentUrls = async () => {
            const urlEntries = await Promise.all(
                uniquePaths.map(async path => {
                    try {
                        const url = await getMemberDocumentUrl(path);
                        return [path, url] as const;
                    } catch {
                        return [path, ''] as const;
                    }
                })
            );
            if (!active) return;
            const nextMap: Record<string, string> = {};
            for (const [path, url] of urlEntries) {
                if (url) nextMap[path] = url;
            }
            setNoteAttachmentUrls(nextMap);
        };

        loadAttachmentUrls();
        return () => {
            active = false;
        };
    }, [notes]);

    useEffect(() => {
        const loadWallet = async () => {
            if (activeTab !== 'OCLUB' || !lead?.customerId) return;
            setWalletLoading(true);
            const [walletResult, ledgerResult] = await Promise.all([
                getOClubWallet(lead.customerId),
                getOClubLedger(lead.customerId, 20),
            ]);
            setWallet(walletResult.success ? walletResult.wallet : null);
            setLedger(ledgerResult.success ? ledgerResult.ledger || [] : []);
            setWalletLoading(false);
        };

        loadWallet();
    }, [activeTab, lead?.customerId]);

    const TransactionSection = ({
        title,
        count,
        expanded,
        onToggle,
        children,
    }: {
        title: string;
        count: number;
        expanded: boolean;
        onToggle: () => void;
        children: React.ReactNode;
    }) => (
        <div className="border-b border-slate-100 dark:border-white/5 last:border-b-0">
            <div
                className={cn(
                    'flex items-center justify-between px-6 py-2.5 transition-colors',
                    expanded
                        ? 'bg-slate-50 dark:bg-white/[0.04] border-b border-slate-100 dark:border-white/5'
                        : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                )}
            >
                <button onClick={onToggle} className="flex items-center gap-3">
                    <div className={cn('transition-transform duration-200', expanded ? 'rotate-90' : 'rotate-0')}>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                            {title}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-[8px] font-black text-slate-500">
                            {count}
                        </span>
                    </div>
                </button>
                <div className="flex items-center gap-4">
                    <button className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                        <Plus size={10} /> New
                    </button>
                </div>
            </div>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 pt-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const handleGenerateQuote = () => {
        if (!lead?.id) {
            toast.error('Lead context missing. Please refresh and try again.');
            return;
        }
        window.location.href = `/store/catalog?leadId=${encodeURIComponent(lead.id)}`;
    };

    const handleNoteAttachmentSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length > 10) {
            toast.error('Max 10 attachments allowed per note');
            setNoteAttachments(selectedFiles.slice(0, 10));
            return;
        }
        setNoteAttachments(selectedFiles);
    };

    const memberId = lead.customerId || null;
    const leadTenantId = tenantId || lead?.raw?.owner_tenant_id || null;

    const handleAddNote = async () => {
        if (!lead?.id) return;
        const body = noteDraft.trim();
        if (!body) {
            toast.error('Note cannot be empty');
            return;
        }
        setSavingNote(true);
        const uploadedAttachments: LeadNoteAttachment[] = [];
        try {
            for (const [index, file] of noteAttachments.entries()) {
                const extension = file.name.includes('.') ? file.name.split('.').pop() || 'bin' : 'bin';
                const baseName = file.name.replace(/\.[^/.]+$/, '');
                const safeBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'attachment';
                const storagePath = `lead-notes/${lead.id}/${Date.now()}_${index}_${safeBaseName}.${extension}`;
                const { data: storageData, error: storageError } = await supabase.storage
                    .from('documents')
                    .upload(storagePath, file, { upsert: false });
                if (storageError || !storageData?.path) {
                    throw new Error(storageError?.message || 'Attachment upload failed');
                }
                uploadedAttachments.push({
                    path: storageData.path,
                    name: file.name,
                    file_type: file.type || null,
                    size: file.size || null,
                });
            }
        } catch (error: unknown) {
            toast.error(error?.message || 'Failed to upload note attachments');
            setSavingNote(false);
            return;
        }

        const result = await addLeadNoteAction({ leadId: lead.id, body, attachments: uploadedAttachments });
        if (!result.success) {
            if (uploadedAttachments.length > 0) {
                await supabase.storage.from('documents').remove(uploadedAttachments.map(attachment => attachment.path));
            }
            toast.error(result.message || 'Failed to save note');
            setSavingNote(false);
            return;
        }
        if ('note' in result && result.note) {
            setNotes(prev => [result.note as LeadModuleNote, ...prev]);
        }
        setNoteDraft('');
        setNoteAttachments([]);
        if (noteAttachmentInputRef.current) {
            noteAttachmentInputRef.current.value = '';
        }
        setSavingNote(false);
        toast.success('Note saved');
    };

    const handleAddTask = async () => {
        if (!lead?.id) return;
        const title = taskDraft.trim();
        if (!title) {
            toast.error('Task title is required');
            return;
        }
        setSavingTask(true);
        const result = await addLeadTaskAction({
            leadId: lead.id,
            title,
            dueDate: taskDueDate || null,
            priority: taskPriority,
        });
        if (!result.success) {
            toast.error(result.message || 'Failed to add task');
            setSavingTask(false);
            return;
        }
        if ('task' in result && result.task) {
            setTasks(prev => [result.task as (typeof tasks)[number], ...prev]);
        }
        setTaskDraft('');
        setTaskDueDate('');
        setTaskPriority('MEDIUM');
        setSavingTask(false);
        toast.success('Task added');
    };

    const handleToggleTask = async (taskId: string, completed: boolean) => {
        if (!lead?.id) return;
        const result = await toggleLeadTaskAction({
            leadId: lead.id,
            taskId,
            completed,
        });
        if (!result.success) {
            toast.error(result.message || 'Failed to update task');
            return;
        }
        setTasks(prev =>
            prev.map(task =>
                task.id === taskId
                    ? {
                          ...task,
                          completed,
                          completed_at: completed ? new Date().toISOString() : null,
                      }
                    : task
            )
        );
    };

    const [localIntentScore, setLocalIntentScore] = useState<string>(lead.intentScore || 'COLD');
    const [updatingScore, setUpdatingScore] = useState(false);

    // Sync if lead data changes externally
    useEffect(() => {
        if (lead.intentScore) setLocalIntentScore(lead.intentScore);
    }, [lead.intentScore]);

    const handleScoreChange = async (newScore: 'HOT' | 'WARM' | 'COLD' | 'JUNK') => {
        if (newScore === localIntentScore || updatingScore) return;
        const previousScore = localIntentScore;
        setLocalIntentScore(newScore); // optimistic
        setUpdatingScore(true);
        try {
            const result = await updateLeadIntentScoreAction({ leadId: lead.id, intentScore: newScore });
            if (!result.success) {
                setLocalIntentScore(previousScore); // revert
                toast.error(result.message || 'Failed to update score');
            } else {
                toast.success(`Score updated to ${newScore}`);
            }
        } catch {
            setLocalIntentScore(previousScore);
            toast.error('Failed to update score');
        } finally {
            setUpdatingScore(false);
        }
    };

    const getScoreBadgeClass = (score: string) =>
        score === 'HOT'
            ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
            : score === 'WARM'
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
              : score === 'JUNK'
                ? 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                : 'bg-blue-500/10 text-blue-600 border-blue-500/30';

    const intentBadge = getScoreBadgeClass(localIntentScore);

    // ── PHONE DETAIL VIEW ──────────────────────────────────────────
    if (isPhone) {
        const resolveHref = (path: string) => (tenantSlug ? `/app/${tenantSlug}${path}` : path);
        const phoneNumber = lead.phone?.replace(/\D/g, '') || '';
        const waPhone = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;

        const PhoneSection = ({
            title,
            defaultOpen = false,
            count,
            children,
        }: {
            title: string;
            defaultOpen?: boolean;
            count?: number;
            children: React.ReactNode;
        }) => {
            const [open, setOpen] = useState(defaultOpen);
            return (
                <div className="border-b border-slate-100 dark:border-white/5">
                    <button
                        onClick={() => setOpen(!open)}
                        data-crm-allow
                        className="w-full flex items-center justify-between px-3 py-3 active:bg-slate-50 dark:active:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <ChevronRight
                                size={14}
                                className={cn('text-slate-400 transition-transform duration-200', open && 'rotate-90')}
                            />
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200">
                                {title}
                            </span>
                            {count !== undefined && count > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-[8px] font-black text-indigo-600">
                                    {count}
                                </span>
                            )}
                        </div>
                        <ChevronDown
                            size={14}
                            className={cn('text-slate-300 transition-transform duration-200', open && 'rotate-180')}
                        />
                    </button>
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-3 pb-3">{children}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        };

        return (
            <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10]">
                {/* Contact Card Hero */}
                <div className="px-3 pt-1 pb-3 space-y-2.5">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base font-black shadow-lg shrink-0">
                            {(lead.customerName || 'L').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                                    {lead.customerName || 'Lead'}
                                </h1>
                                <span
                                    className={cn(
                                        'px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0',
                                        intentBadge
                                    )}
                                >
                                    {localIntentScore}
                                </span>
                            </div>
                            {phoneNumber && (
                                <a
                                    href={`tel:${phoneNumber}`}
                                    className="flex items-center gap-1.5 mt-0.5 text-indigo-600"
                                >
                                    <Phone size={11} />
                                    <span className="text-[11px] font-black tracking-wide">{lead.phone}</span>
                                </a>
                            )}
                            <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-bold flex-wrap">
                                <span className="font-black uppercase tracking-widest">
                                    {formatDisplayId(lead.displayId || lead.id)}
                                </span>
                                <span>•</span>
                                <span>{formatDate(lead.created_at)}</span>
                                {lead.pincode && (
                                    <>
                                        <span>•</span>
                                        <span>📍 {lead.pincode}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-1.5">
                        {phoneNumber && (
                            <a
                                href={`tel:${phoneNumber}`}
                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                            >
                                <Phone size={13} /> Call
                            </a>
                        )}
                        {phoneNumber && (
                            <a
                                href={`https://wa.me/${waPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#25D366] text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                            >
                                💬 WhatsApp
                            </a>
                        )}
                        <Link
                            href={resolveHref(`/quotes`)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                        >
                            <FileText size={13} /> Quote
                        </Link>
                    </div>
                </div>

                {/* Accordion Sections */}
                <div
                    className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/80 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5"
                    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
                >
                    {/* Lead Info */}
                    <PhoneSection title="Lead Info" defaultOpen={true}>
                        <div className="space-y-0">
                            {[
                                { label: 'Status', value: lead.status || 'NEW' },
                                { label: 'Source', value: lead.source || '—' },
                                { label: 'Score', value: localIntentScore, isScore: true },
                                { label: 'Interest', value: lead.interestModel || '—' },
                                { label: 'Referral', value: lead.referralSource || '—' },
                                { label: 'Phone', value: lead.phone || '—' },
                                { label: 'DOB', value: formatDate(lead.dob) },
                                { label: 'Pincode', value: lead.pincode || '—' },
                                { label: 'Taluka', value: lead.taluka || '—' },
                                { label: 'District', value: leadDistrict },
                                { label: 'State', value: leadState },
                                { label: 'Area', value: leadArea },
                            ].map(item => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between py-2 px-1 border-b border-slate-100 dark:border-white/5 last:border-0"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {item.label}
                                    </span>
                                    {'isScore' in item && item.isScore ? (
                                        <div className="flex items-center gap-1">
                                            {(['HOT', 'WARM', 'COLD', 'JUNK'] as const).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleScoreChange(s)}
                                                    disabled={updatingScore}
                                                    className={cn(
                                                        'px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all',
                                                        localIntentScore === s
                                                            ? getScoreBadgeClass(s)
                                                            : 'bg-transparent text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                                    )}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                            {item.value}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </PhoneSection>

                    {/* Quotes */}
                    <PhoneSection title="Quotes" count={quoteCount}>
                        {quoteCount === 0 ? (
                            <p className="text-[10px] text-slate-400 font-bold py-2">No quotes yet</p>
                        ) : (
                            <div className="space-y-1.5">
                                {(profile.quotes || []).map((q: any) => {
                                    const statusColor =
                                        q.status === 'APPROVED' || q.status === 'SENT'
                                            ? 'bg-emerald-500/10 text-emerald-600'
                                            : q.status === 'DRAFT'
                                              ? 'bg-slate-100 text-slate-600'
                                              : 'bg-amber-500/10 text-amber-600';
                                    return (
                                        <Link
                                            key={q.id}
                                            href={resolveHref(`/quotes/${q.id}`)}
                                            className="block bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2.5 active:scale-[0.98] transition-transform"
                                        >
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                                    {formatDisplayId(q.displayId || q.id)}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest',
                                                        statusColor
                                                    )}
                                                >
                                                    {q.status}
                                                </span>
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-bold">
                                                {formatDate(q.created_at)}
                                                {q.commercials?.grand_total && (
                                                    <> • {formatMoney(q.commercials.grand_total)}</>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </PhoneSection>

                    {/* Bookings */}
                    <PhoneSection title="Bookings" count={bookingCount}>
                        {bookingCount === 0 ? (
                            <p className="text-[10px] text-slate-400 font-bold py-2">No bookings yet</p>
                        ) : (
                            <div className="space-y-1.5">
                                {(profile.bookings || []).map((b: any) => (
                                    <div
                                        key={b.id}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2.5"
                                    >
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                                {formatDisplayId(b.displayId || b.id)}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-[8px] font-black text-indigo-600 uppercase tracking-widest">
                                                {b.status || 'ACTIVE'}
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-bold">
                                            {formatDate(b.created_at)}
                                            {b.amount && <> • {formatMoney(b.amount)}</>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PhoneSection>

                    {/* Receipts */}
                    <PhoneSection title="Receipts" count={profile.receipts?.length || 0}>
                        {(profile.receipts?.length || 0) === 0 ? (
                            <p className="text-[10px] text-slate-400 font-bold py-2">No receipts yet</p>
                        ) : (
                            <div className="space-y-1.5">
                                {(profile.receipts || []).map((r: any) => (
                                    <div
                                        key={r.id}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2.5"
                                    >
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                                {formatDisplayId(r.displayId || r.id)}
                                            </span>
                                            <span className="text-[10px] font-black text-emerald-600">
                                                {formatMoney(r.amount)}
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-bold">
                                            {formatDate(r.created_at)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PhoneSection>

                    {/* Notes */}
                    <PhoneSection title="Notes">
                        <div className="space-y-2">
                            <textarea
                                value={noteDraft}
                                onChange={e => setNoteDraft(e.target.value)}
                                placeholder="Add a note about this lead..."
                                className="w-full h-24 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-[11px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 placeholder:text-slate-400 resize-none"
                            />
                            <div className="flex items-center gap-2">
                                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">
                                    <Paperclip size={11} />
                                    Attach
                                    <input
                                        ref={noteAttachmentInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleNoteAttachmentSelection}
                                        accept="image/*,.pdf,.doc,.docx"
                                    />
                                </label>
                                {noteAttachments.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNoteAttachments([]);
                                            if (noteAttachmentInputRef.current)
                                                noteAttachmentInputRef.current.value = '';
                                        }}
                                        className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-500"
                                    >
                                        <X size={11} />
                                        Clear
                                    </button>
                                )}
                            </div>
                            {noteAttachments.length > 0 && (
                                <div className="space-y-1">
                                    {noteAttachments.map(file => (
                                        <div
                                            key={`${file.name}_${file.size}`}
                                            className="text-[9px] text-slate-500 bg-slate-50 dark:bg-white/5 rounded-md px-2 py-1 truncate"
                                        >
                                            {file.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={handleAddNote}
                                disabled={savingNote}
                                className="w-full py-2 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                            >
                                {savingNote ? 'Saving...' : 'Save Note'}
                            </button>
                            <div className="space-y-1">
                                {notes.slice(0, 5).map(note => (
                                    <div
                                        key={note.id}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2.5"
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 truncate">
                                                {note.created_by_name || 'Team'}
                                            </p>
                                            <p className="text-[9px] text-slate-400">
                                                {formatDateTime(note.created_at)}
                                            </p>
                                        </div>
                                        <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                                            {note.body}
                                        </p>
                                        {(note.attachments || []).length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {(note.attachments || []).map(attachment => {
                                                    const signedUrl = noteAttachmentUrls[attachment.path] || null;
                                                    return (
                                                        <a
                                                            key={`${note.id}-${attachment.path}`}
                                                            href={signedUrl || '#'}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className={cn(
                                                                'flex items-center gap-1.5 text-[9px] font-bold',
                                                                signedUrl
                                                                    ? 'text-indigo-600 hover:underline'
                                                                    : 'text-slate-400 pointer-events-none'
                                                            )}
                                                        >
                                                            <FileText size={10} />
                                                            {attachment.name}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </PhoneSection>

                    {/* Tasks */}
                    <PhoneSection title="Tasks">
                        <div className="space-y-2">
                            <div className="flex gap-1.5">
                                <input
                                    value={taskDraft}
                                    onChange={e => setTaskDraft(e.target.value)}
                                    placeholder="Add task"
                                    className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-[10px] font-bold"
                                />
                                <button
                                    onClick={handleAddTask}
                                    disabled={savingTask}
                                    className="px-3 rounded-lg bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="space-y-1">
                                {tasks.slice(0, 8).map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => handleToggleTask(task.id, !task.completed)}
                                        className="w-full text-left bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2.5"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span
                                                className={cn(
                                                    'text-[10px] font-semibold',
                                                    task.completed
                                                        ? 'line-through text-slate-400'
                                                        : 'text-slate-700 dark:text-slate-200'
                                                )}
                                            >
                                                {task.title}
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-[8px] font-black uppercase tracking-widest',
                                                    task.completed ? 'text-emerald-600' : 'text-amber-600'
                                                )}
                                            >
                                                {task.completed ? 'Done' : 'Open'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                                {tasks.length === 0 && (
                                    <p className="text-[10px] text-slate-400 font-bold py-2">No tasks yet</p>
                                )}
                            </div>
                        </div>
                    </PhoneSection>

                    {/* Documents */}
                    <PhoneSection title="Documents">
                        {memberId && leadTenantId ? (
                            <DocumentManager memberId={memberId} tenantId={leadTenantId} />
                        ) : (
                            <div className="py-4 text-center">
                                <FileText size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    Member not linked yet
                                </p>
                            </div>
                        )}
                    </PhoneSection>

                    {/* Timeline */}
                    <PhoneSection title="Timeline" count={timelineEntries.length || undefined}>
                        {leadEventsLoading && timelineEntries.length === 0 ? (
                            <div className="py-4 text-center">
                                <Clock size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    Loading timeline...
                                </p>
                            </div>
                        ) : timelineEntries.length === 0 ? (
                            <div className="py-4 text-center">
                                <Clock size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    No timeline events
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {timelineEntries.map((entry, i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2.5"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate">
                                                {entry.title}
                                            </div>
                                            <span
                                                className={cn(
                                                    'px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest',
                                                    entry.source === 'EVENT_LOG'
                                                        ? 'bg-indigo-500/10 text-indigo-600'
                                                        : 'bg-slate-100 text-slate-500'
                                                )}
                                            >
                                                {entry.source === 'EVENT_LOG' ? 'EVENT' : 'LEGACY'}
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                                            {entry.description || 'System event'}
                                            {entry.actorName ? <> • {entry.actorName}</> : null}
                                            {entry.timestamp ? (
                                                <> • {new Date(entry.timestamp).toLocaleDateString()}</>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PhoneSection>
                </div>
            </div>
        );
    }

    // ── DESKTOP DETAIL VIEW (unchanged) ──────────────────────────────
    return (
        <div className="h-full flex flex-col">
            {/* HEADER */}
            <div className="bg-white dark:bg-[#0b0d10] border-b border-slate-100 dark:border-white/5">
                <div className="px-6 pt-6 pb-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-lg">
                                {(lead.customerName || 'L').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-black tracking-tight truncate">
                                        {lead.customerName || 'Lead'}
                                    </h1>
                                    <span
                                        className={cn(
                                            'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest',
                                            intentBadge
                                        )}
                                    >
                                        {localIntentScore}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="font-black uppercase tracking-widest text-[9px]">
                                        {formatDisplayId(lead.displayId || lead.id)}
                                    </span>
                                    <span className="text-slate-300">|</span>
                                    <span className="flex items-center gap-1.5 font-bold">
                                        <Calendar size={12} /> Captured {formatDate(lead.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={async () => {
                                            setEditSaving(true);
                                            try {
                                                const res = await updateLeadAction({ leadId: lead.id, ...editForm });
                                                if (res.success) {
                                                    setIsEditing(false);
                                                    router.refresh();
                                                    window.location.reload();
                                                } else {
                                                    alert(res.message || 'Failed to save');
                                                }
                                            } catch (err: unknown) {
                                                alert(err?.message || 'Save failed');
                                            } finally {
                                                setEditSaving(false);
                                            }
                                        }}
                                        disabled={editSaving}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {editSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditForm({
                                                customer_name: lead.customerName || '',
                                                customer_phone: lead.phone || '',
                                                customer_pincode: lead.pincode || '',
                                                customer_dob: lead.dob || '',
                                                interest_text: lead.interestText || lead.interestModel || '',
                                            });
                                        }}
                                        className="px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                                >
                                    Edit
                                </button>
                            )}
                            <button
                                onClick={handleGenerateQuote}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                            >
                                Generate Quote <ChevronDown size={14} />
                            </button>
                            <button className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 transition-colors">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div
                className={cn(
                    'sticky top-0 z-10 bg-white/20 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 dark:border-white/5 shadow-sm',
                    'mx-4 mt-4'
                )}
            >
                <div className={cn('text-[9px] font-black uppercase tracking-widest w-full', 'grid grid-cols-9')}>
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as TabKey)}
                            className={cn(
                                'py-3 text-center transition-all relative whitespace-nowrap',
                                'w-full',
                                idx < 8 ? 'border-r border-slate-100 dark:border-white/10' : '',
                                activeTab === tab.key
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                    : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-white/30 dark:hover:bg-white/10'
                            )}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span
                                    className={cn(
                                        'ml-1 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full text-[7px] font-black',
                                        activeTab === tab.key
                                            ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                                            : 'bg-indigo-500/10 text-indigo-600 dark:bg-white/10 dark:text-white/60'
                                    )}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-24 bg-slate-50 dark:bg-slate-950">
                {activeTab === 'LEAD' && (
                    <div className="mx-4 mt-4 space-y-4">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-px bg-slate-100 dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5">
                            <div className="bg-white dark:bg-[#0b0d10] p-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                                        Lead Profile
                                    </span>
                                    {isEditing ? (
                                        <input
                                            value={editForm.customer_name}
                                            onChange={e => setEditForm(f => ({ ...f, customer_name: e.target.value }))}
                                            className="text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate leading-tight bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/30 w-full"
                                        />
                                    ) : (
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate leading-tight">
                                            {lead.customerName || 'Lead'}
                                        </h2>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <Phone size={12} className="text-slate-400" />
                                        {isEditing ? (
                                            <input
                                                value={editForm.customer_phone}
                                                onChange={e =>
                                                    setEditForm(f => ({ ...f, customer_phone: e.target.value }))
                                                }
                                                className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700 rounded px-1.5 py-0.5 outline-none w-28"
                                            />
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                {lead.phone || '—'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <MapPin size={12} className="text-slate-400" />
                                        {isEditing ? (
                                            <input
                                                value={editForm.customer_pincode}
                                                onChange={e =>
                                                    setEditForm(f => ({ ...f, customer_pincode: e.target.value }))
                                                }
                                                className="text-[10px] font-bold text-slate-500 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700 rounded px-1.5 py-0.5 outline-none w-20"
                                                maxLength={6}
                                            />
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-500">
                                                {lead.pincode || '—'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#0b0d10] p-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                    <ShieldCheck size={18} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                                        Lead Status
                                    </span>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate leading-tight">
                                        {lead.status || 'NEW'}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <BadgeCheck size={12} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                            {lead.source || 'SOURCE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                    Identity
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Phone
                                        </span>
                                        <span className="text-[12px] font-black text-slate-900 dark:text-white">
                                            {lead.phone || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            DOB
                                        </span>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={editForm.customer_dob || ''}
                                                onChange={e =>
                                                    setEditForm(f => ({ ...f, customer_dob: e.target.value }))
                                                }
                                                className="text-[12px] font-bold text-slate-600 dark:text-slate-300 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700 rounded px-1.5 py-0.5 outline-none"
                                            />
                                        ) : (
                                            <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                                {formatDate(lead.dob)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Pincode
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {lead.pincode || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Taluka
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {lead.taluka || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            District
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {leadDistrict}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            State
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {leadState}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Area
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {leadArea}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                    Intent
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Score
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {(['HOT', 'WARM', 'COLD', 'JUNK'] as const).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleScoreChange(s)}
                                                    disabled={updatingScore}
                                                    className={cn(
                                                        'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer',
                                                        localIntentScore === s
                                                            ? getScoreBadgeClass(s)
                                                            : 'bg-transparent text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                                    )}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Interest
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {lead.interestModel || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Referral
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {lead.referralSource || '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                    Activity
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Source
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {lead.source || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Created
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {formatDate(lead.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'FINANCE' && (
                    <div className="p-6">
                        <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] overflow-hidden">
                            <TransactionSection
                                title="Finance / Quotes"
                                count={quoteCount}
                                expanded={true}
                                onToggle={() => null}
                            >
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[700px] text-left border-collapse">
                                        <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                            <tr className="border-b border-slate-100 dark:border-white/5">
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    ID
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(profile.quotes || []).map((quote: any) => (
                                                <tr
                                                    key={quote.id}
                                                    className="border-b border-slate-50 dark:border-white/[0.02] last:border-b-0 group"
                                                >
                                                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                        {formatDate(quote.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {formatDisplayId(quote.display_id || quote.id)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-widest">
                                                            {quote.status || 'DRAFT'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            onClick={() =>
                                                                slug && router.push(`/app/${slug}/quotes/${quote.id}`)
                                                            }
                                                            className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-opacity"
                                                        >
                                                            View →
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(profile.quotes || []).length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                                    >
                                                        No quotes found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </TransactionSection>
                        </div>
                    </div>
                )}

                {activeTab === 'MEMBER' && (
                    <div className="p-6">
                        <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Member Profile
                                </div>
                                {lead.customerId && (
                                    <a
                                        href={`/app/${slug}/members/${lead.customerId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:underline"
                                    >
                                        Open Full Profile →
                                    </a>
                                )}
                            </div>
                            {/* Basic Info (always available from lead) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl p-4">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Name
                                    </div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white">
                                        {lead.customerName || '—'}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl p-4">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Phone
                                    </div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white">
                                        {lead.phone || '—'}
                                    </div>
                                </div>
                            </div>

                            {/* Extended Member Data */}
                            {lead.customerId && !memberProfile && !memberProfileLoading && (
                                <button
                                    onClick={async () => {
                                        setMemberProfileLoading(true);
                                        try {
                                            const data = await getMemberFullProfile(lead.customerId!);
                                            setMemberProfile(data);
                                        } catch {
                                            toast.error('Failed to load member details');
                                        } finally {
                                            setMemberProfileLoading(false);
                                        }
                                    }}
                                    className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors mb-4"
                                >
                                    Load Full Member Details
                                </button>
                            )}
                            {memberProfileLoading && (
                                <div className="text-xs text-slate-400 mb-4 animate-pulse">
                                    Loading member details...
                                </div>
                            )}

                            {memberProfile?.member && (
                                <div className="space-y-4">
                                    {/* Identity */}
                                    <div className="bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl p-4">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                            Identity Information
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                {
                                                    l: 'Email',
                                                    v: memberProfile.member.primary_email || memberProfile.member.email,
                                                },
                                                { l: 'PAN', v: memberProfile.member.pan_number, mono: true },
                                                { l: 'Aadhaar', v: memberProfile.member.aadhaar_number, mono: true },
                                                {
                                                    l: 'DOB',
                                                    v: memberProfile.member.date_of_birth
                                                        ? new Date(
                                                              memberProfile.member.date_of_birth
                                                          ).toLocaleDateString('en-IN')
                                                        : null,
                                                },
                                            ].map(f => (
                                                <div key={f.l}>
                                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                        {f.l}
                                                    </div>
                                                    <div
                                                        className={`text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 ${f.mono ? 'font-mono' : ''}`}
                                                    >
                                                        {f.v || '—'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Work & Location */}
                                    <div className="bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl p-4">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                            Work & Location
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { l: 'Company', v: memberProfile.member.work_company },
                                                { l: 'Designation', v: memberProfile.member.work_designation },
                                                { l: 'Pincode', v: memberProfile.member.pincode },
                                                { l: 'State', v: memberProfile.member.state },
                                                { l: 'District', v: memberProfile.member.district },
                                                { l: 'Taluka', v: memberProfile.member.taluka },
                                                { l: 'RTO', v: memberProfile.member.rto },
                                            ].map(f => (
                                                <div key={f.l}>
                                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                        {f.l}
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                                                        {f.v || '—'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Member ID */}
                                    <div className="bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl p-4">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                            Member ID
                                        </div>
                                        <a
                                            href={`/app/${slug}/members/${lead.customerId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            {memberProfile.member.display_id || lead.customerId}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {!lead.customerId && (
                                <div className="text-xs text-slate-400">No linked member profile.</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'TRANSACTIONS' && (
                    <div className="p-6">
                        <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] overflow-hidden">
                            <TransactionSection
                                title="Quotes"
                                count={quoteCount}
                                expanded={groups.transactionQuotes}
                                onToggle={() => setGroups(g => ({ ...g, transactionQuotes: !g.transactionQuotes }))}
                            >
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[700px] text-left border-collapse">
                                        <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                            <tr className="border-b border-slate-100 dark:border-white/5">
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    ID
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(profile.quotes || []).map((quote: any) => (
                                                <tr
                                                    key={quote.id}
                                                    className="border-b border-slate-50 dark:border-white/[0.02] last:border-b-0 group"
                                                >
                                                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                        {formatDate(quote.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {formatDisplayId(quote.display_id || quote.id)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-widest">
                                                            {quote.status || 'DRAFT'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            onClick={() =>
                                                                slug && router.push(`/app/${slug}/quotes/${quote.id}`)
                                                            }
                                                            className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-opacity"
                                                        >
                                                            View →
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(profile.quotes || []).length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                                    >
                                                        No quotes found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </TransactionSection>

                            <TransactionSection
                                title="Sales Orders"
                                count={bookingCount}
                                expanded={groups.transactionBookings}
                                onToggle={() => setGroups(g => ({ ...g, transactionBookings: !g.transactionBookings }))}
                            >
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[600px] text-left border-collapse">
                                        <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                            <tr className="border-b border-slate-100 dark:border-white/5">
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Sales Order
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Amount
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(profile.bookings || []).map((booking: any) => (
                                                <tr
                                                    key={booking.id}
                                                    className="border-b border-slate-50 dark:border-white/[0.02] last:border-b-0 group"
                                                >
                                                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                        {formatDate(booking.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {formatDisplayId(booking.display_id || booking.id)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[8px] font-black uppercase tracking-widest">
                                                            {booking.status || 'BOOKED'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-[10px] font-black text-slate-900 dark:text-white">
                                                        {formatMoney(booking.booking_amount_received || 0)}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <button
                                                            onClick={() =>
                                                                slug &&
                                                                router.push(`/app/${slug}/sales-orders/${booking.id}`)
                                                            }
                                                            className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            Manage
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(profile.bookings || []).length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                                    >
                                                        No sales orders found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </TransactionSection>

                            <TransactionSection
                                title="Receipts"
                                count={receiptCount}
                                expanded={groups.transactionReceipts}
                                onToggle={() => setGroups(g => ({ ...g, transactionReceipts: !g.transactionReceipts }))}
                            >
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[600px] text-left border-collapse">
                                        <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                            <tr className="border-b border-slate-100 dark:border-white/5">
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Receipt ID
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Method
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Amount
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(profile.receipts || []).map((receipt: any) => (
                                                <tr
                                                    key={receipt.id}
                                                    className="border-b border-slate-50 dark:border-white/[0.02] last:border-b-0 group cursor-pointer"
                                                    onClick={() =>
                                                        slug && router.push(`/app/${slug}/receipts/${receipt.id}`)
                                                    }
                                                >
                                                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                        {formatDate(receipt.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {formatDisplayId(receipt.display_id || receipt.id)}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">
                                                        {receipt.method || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white">
                                                        {formatMoney(receipt.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span
                                                            className={cn(
                                                                'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest',
                                                                receipt.status === 'captured' ||
                                                                    receipt.status === 'success'
                                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                                    : 'bg-amber-500/10 text-amber-600'
                                                            )}
                                                        >
                                                            {receipt.status || 'pending'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(profile.receipts || []).length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                                    >
                                                        No receipts found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </TransactionSection>
                        </div>
                    </div>
                )}

                {activeTab === 'TASKS' && (
                    <div className="mx-4 mt-4 bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Lead Tasks
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">
                                {tasks.filter(task => !task.completed).length} Open
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2 mb-4">
                            <input
                                value={taskDraft}
                                onChange={e => setTaskDraft(e.target.value)}
                                placeholder="Add follow-up task..."
                                className="h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 text-xs font-bold"
                            />
                            <input
                                type="date"
                                value={taskDueDate}
                                onChange={e => setTaskDueDate(e.target.value)}
                                className="h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 text-xs font-bold"
                            />
                            <select
                                value={taskPriority}
                                onChange={e => setTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                                className="h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 text-xs font-black uppercase"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                            <button
                                onClick={handleAddTask}
                                disabled={savingTask}
                                className="h-11 px-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                            >
                                {savingTask ? 'Saving...' : 'Add Task'}
                            </button>
                        </div>
                        {moduleLoading ? (
                            <div className="text-xs text-slate-400">Loading tasks...</div>
                        ) : (
                            <div className="space-y-2">
                                {tasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => handleToggleTask(task.id, !task.completed)}
                                        className="w-full text-left bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-xl p-3"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className={cn(
                                                        'text-sm font-black tracking-tight',
                                                        task.completed
                                                            ? 'line-through text-slate-400'
                                                            : 'text-slate-900 dark:text-white'
                                                    )}
                                                >
                                                    {task.title}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-[10px] text-slate-400">
                                                        Due: {task.due_date ? formatDate(task.due_date) : 'Not set'}
                                                    </span>
                                                    {task.assigned_to_name && (
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                                            → {task.assigned_to_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {task.priority && task.priority !== 'MEDIUM' && (
                                                    <span
                                                        className={cn(
                                                            'px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest',
                                                            task.priority === 'URGENT' &&
                                                                'bg-rose-500/10 text-rose-600',
                                                            task.priority === 'HIGH' &&
                                                                'bg-amber-500/10 text-amber-600',
                                                            task.priority === 'LOW' &&
                                                                'bg-emerald-500/10 text-emerald-600'
                                                        )}
                                                    >
                                                        {task.priority}
                                                    </span>
                                                )}
                                                <span
                                                    className={cn(
                                                        'px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest',
                                                        task.completed
                                                            ? 'bg-emerald-500/10 text-emerald-600'
                                                            : 'bg-amber-500/10 text-amber-600'
                                                    )}
                                                >
                                                    {task.completed ? 'Done' : 'Open'}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {tasks.length === 0 && (
                                    <div className="text-xs text-slate-400">No tasks available.</div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'NOTES' && (
                    <div className="mx-4 mt-4 bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                            Lead Notes
                        </div>
                        <div className="space-y-3">
                            <textarea
                                value={noteDraft}
                                onChange={e => setNoteDraft(e.target.value)}
                                placeholder="Write internal note for this lead..."
                                className="w-full h-28 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 text-sm font-medium text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">
                                    <Paperclip size={13} />
                                    Attach Files
                                    <input
                                        ref={noteAttachmentInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleNoteAttachmentSelection}
                                        accept="image/*,.pdf,.doc,.docx"
                                    />
                                </label>
                                {noteAttachments.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNoteAttachments([]);
                                            if (noteAttachmentInputRef.current)
                                                noteAttachmentInputRef.current.value = '';
                                        }}
                                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-500"
                                    >
                                        <X size={13} />
                                        Clear {noteAttachments.length} file(s)
                                    </button>
                                )}
                            </div>
                            {noteAttachments.length > 0 && (
                                <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Ready To Upload
                                    </div>
                                    <div className="space-y-1">
                                        {noteAttachments.map(file => (
                                            <div
                                                key={`${file.name}_${file.size}`}
                                                className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate"
                                            >
                                                {file.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={handleAddNote}
                                disabled={savingNote}
                                className="h-10 px-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                            >
                                {savingNote ? 'Saving...' : 'Save Note'}
                            </button>
                        </div>
                        {moduleLoading ? (
                            <div className="text-xs text-slate-400 mt-4">Loading notes...</div>
                        ) : (
                            <div className="space-y-2 mt-4">
                                {notes.map(note => (
                                    <div
                                        key={note.id}
                                        className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-xl p-3"
                                    >
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                {note.created_by_name || 'Team'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {formatDateTime(note.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {note.body}
                                        </p>
                                        {(note.attachments || []).length > 0 && (
                                            <div className="mt-3 space-y-1">
                                                {(note.attachments || []).map(attachment => {
                                                    const signedUrl = noteAttachmentUrls[attachment.path] || null;
                                                    return (
                                                        <a
                                                            key={`${note.id}-${attachment.path}`}
                                                            href={signedUrl || '#'}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className={cn(
                                                                'inline-flex items-center gap-1.5 text-xs font-bold',
                                                                signedUrl
                                                                    ? 'text-indigo-600 hover:underline'
                                                                    : 'text-slate-400 pointer-events-none'
                                                            )}
                                                        >
                                                            <FileText size={13} />
                                                            {attachment.name}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {notes.length === 0 && <div className="text-xs text-slate-400">No notes yet.</div>}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'DOCUMENTS' && (
                    <div className="mx-4 mt-4">
                        {memberId && leadTenantId ? (
                            <DocumentManager memberId={memberId} tenantId={leadTenantId} />
                        ) : (
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6 text-xs text-slate-400">
                                Member not linked yet. Attach documents after member linkage.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'TIMELINE' && (
                    <div className="mx-4 mt-4 bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Timeline
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {leadEventsLoading && timelineEntries.length === 0 ? (
                                <div className="px-6 py-6 text-xs text-slate-400">Loading timeline events...</div>
                            ) : timelineEntries.length === 0 ? (
                                <div className="px-6 py-6 text-xs text-slate-400">No timeline events.</div>
                            ) : (
                                timelineEntries.map((event, idx) => (
                                    <div key={`${event.id || event.timestamp || 'event'}-${idx}`} className="px-6 py-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-black text-slate-900 dark:text-white">
                                                {event.title || 'System Event'}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest',
                                                        event.source === 'EVENT_LOG'
                                                            ? 'bg-indigo-500/10 text-indigo-600'
                                                            : 'bg-slate-100 text-slate-500'
                                                    )}
                                                >
                                                    {event.source === 'EVENT_LOG' ? 'EVENT' : 'LEGACY'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {event.timestamp ? formatDate(event.timestamp) : '—'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {event.description || 'No details available'}
                                            {event.actorName ? (
                                                <span className="text-slate-400"> • by {event.actorName}</span>
                                            ) : null}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'OCLUB' && (
                    <div className="mx-4 mt-4 space-y-4">
                        {!memberId ? (
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6 text-xs text-slate-400">
                                Member not linked yet. O Club wallet becomes available after member linkage.
                            </div>
                        ) : walletLoading ? (
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6 text-xs text-slate-400">
                                Loading O Club wallet...
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            System Coins
                                        </div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                                            {(wallet?.available_system || 0).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Referral Coins
                                        </div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                                            {(wallet?.available_referral || 0).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Lifetime Earned
                                        </div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                                            {(wallet?.lifetime_earned || 0).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            O Club Ledger
                                        </div>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                                        {ledger.length === 0 ? (
                                            <div className="px-6 py-6 text-xs text-slate-400">
                                                No ledger entries found.
                                            </div>
                                        ) : (
                                            ledger.map((entry: any) => (
                                                <div
                                                    key={entry.id}
                                                    className="px-6 py-3 flex items-center justify-between gap-3"
                                                >
                                                    <div>
                                                        <div className="text-xs font-black text-slate-900 dark:text-white">
                                                            {entry.source_type || entry.coin_type || 'ENTRY'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">
                                                            {formatDate(entry.created_at)}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            'text-sm font-black',
                                                            Number(entry.delta || 0) >= 0
                                                                ? 'text-emerald-600'
                                                                : 'text-rose-600'
                                                        )}
                                                    >
                                                        {Number(entry.delta || 0) > 0 ? '+' : ''}
                                                        {Number(entry.delta || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
