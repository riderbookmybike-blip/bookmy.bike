import React from 'react';
import { adminClient } from '@/lib/supabase/admin';
import { TRANSLATION_LANGUAGES } from '@/i18n/languages';
import { syncAllMarketplaceAction, syncMarketplaceLanguageAction } from './actions';
import { Languages, RefreshCcw, Clock, CheckCircle2, AlertTriangle, Database } from 'lucide-react';

export const dynamic = 'force-dynamic';

type SyncRun = {
    id: string;
    language_code: string;
    scope: string;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    total_strings: number | null;
    new_strings: number | null;
    translated_strings: number | null;
    errors: number | null;
    details?: { newStrings?: Array<{ text: string; hash: string }> } | null;
};

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const getStatusBadge = (status?: string | null) => {
    const normalized = status?.toUpperCase() || 'UNKNOWN';
    if (normalized === 'COMPLETED') return 'bg-emerald-100 text-emerald-600';
    if (normalized === 'COMPLETED_WITH_ERRORS') return 'bg-amber-100 text-amber-700';
    if (normalized === 'RUNNING') return 'bg-blue-100 text-blue-600';
    return 'bg-slate-100 text-slate-500';
};

export default async function TranslationsAdminPage({
    params,
}: {
    params: { slug: string } | Promise<{ slug: string }>;
}) {
    const resolvedParams = await Promise.resolve(params);
    const basePath = resolvedParams?.slug
        ? `/app/${resolvedParams.slug}/dashboard/admin/translations`
        : '/dashboard/admin/translations';

    const { data: dbLanguages } = await adminClient
        .from('i18n_languages')
        .select('*')
        .order('code');

    const languages = (dbLanguages && dbLanguages.length > 0)
        ? dbLanguages
        : TRANSLATION_LANGUAGES.map(lang => ({
            code: lang.code,
            name: lang.name,
            native_name: lang.nativeName,
            status: lang.status,
            provider: lang.provider,
            is_active: lang.status === 'ACTIVE',
        }));

    const { data: runs } = await adminClient
        .from('i18n_sync_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(30);

    const { count: sourceCount } = await adminClient
        .from('i18n_source_strings')
        .select('hash', { count: 'exact', head: true });

    const runList = (runs || []) as SyncRun[];
    const lastRunByLang = new Map<string, SyncRun>();
    runList.forEach(run => {
        if (!lastRunByLang.has(run.language_code)) {
            lastRunByLang.set(run.language_code, run);
        }
    });

    const translationCounts = await Promise.all(
        languages.map(async (lang) => {
            const { count } = await adminClient
                .from('i18n_translations')
                .select('id', { count: 'exact', head: true })
                .eq('language_code', lang.code);
            return { code: lang.code, count: count || 0 };
        })
    );

    const translationCountMap = new Map(translationCounts.map(item => [item.code, item.count]));

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-slate-500">
                        <Languages size={20} />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Translation Control</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Marketplace Language Sync</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sync and monitor marketplace UI translations across Hindi, Marathi, Gujarati and more.</p>
                </div>

                <form action={syncAllMarketplaceAction} className="flex items-center gap-3">
                    <input type="hidden" name="path" value={basePath} />
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-[0.25em] hover:bg-slate-800 transition-colors"
                    >
                        <RefreshCcw size={16} />
                        Sync Marketplace
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <Database size={16} /> Total Source Strings
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-4">
                        {sourceCount ?? 0}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <Clock size={16} /> Last Global Sync
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-4">
                        {formatDate(runList[0]?.started_at || null)}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <CheckCircle2 size={16} /> Active Languages
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-4">
                        {languages.filter(lang => lang.status === 'ACTIVE').length}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {languages.map(lang => {
                    const lastRun = lastRunByLang.get(lang.code);
                    const translatedCount = translationCountMap.get(lang.code) || 0;
                    const pending = Math.max(0, (sourceCount || 0) - translatedCount);
                    const newStrings = lastRun?.details?.newStrings || [];
                    const isSource = lang.code === 'en';
                    const canSync = lang.status === 'ACTIVE' && !isSource;

                    return (
                        <div key={lang.code} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{lang.code}</div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{lang.name}</h3>
                                    <p className="text-xs text-slate-500">{lang.native_name}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${lang.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {lang.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                                <div>
                                    <div className="uppercase tracking-widest text-[10px]">Last Sync</div>
                                    <div className="text-slate-900 dark:text-white font-bold mt-1">{formatDate(lastRun?.completed_at || lastRun?.started_at)}</div>
                                </div>
                                <div>
                                    <div className="uppercase tracking-widest text-[10px]">Status</div>
                                    <div className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mt-1 ${getStatusBadge(lastRun?.status)}`}>
                                        {lastRun?.status || '—'}
                                    </div>
                                </div>
                                <div>
                                    <div className="uppercase tracking-widest text-[10px]">Translated</div>
                                    <div className="text-slate-900 dark:text-white font-bold mt-1">{translatedCount}</div>
                                </div>
                                <div>
                                    <div className="uppercase tracking-widest text-[10px]">Pending</div>
                                    <div className="text-slate-900 dark:text-white font-bold mt-1">{pending}</div>
                                </div>
                            </div>

                            {newStrings.length > 0 && (
                                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/10">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">New Strings</div>
                                    <ul className="space-y-1 max-h-24 overflow-auto text-xs text-slate-600 dark:text-slate-300">
                                        {newStrings.slice(0, 6).map(item => (
                                            <li key={item.hash} className="truncate">• {item.text}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <form action={syncMarketplaceLanguageAction} className="pt-2">
                                <input type="hidden" name="languageCode" value={lang.code} />
                                <input type="hidden" name="path" value={basePath} />
                                <button
                                    type="submit"
                                    disabled={!canSync}
                                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-colors ${canSync ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                >
                                    {isSource ? <CheckCircle2 size={14} /> : <RefreshCcw size={14} />}
                                    {isSource ? 'Source Language' : 'Sync Now'}
                                </button>
                            </form>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-black uppercase tracking-widest mb-4">
                    <AlertTriangle size={16} /> Sync History (Latest 30)
                </div>
                <div className="overflow-auto">
                    <table className="min-w-full text-left text-xs">
                        <thead className="text-[10px] uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="py-2 pr-4">Language</th>
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2 pr-4">Started</th>
                                <th className="py-2 pr-4">Completed</th>
                                <th className="py-2 pr-4">New</th>
                                <th className="py-2 pr-4">Translated</th>
                                <th className="py-2 pr-4">Errors</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-600 dark:text-slate-300">
                            {runList.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-6 text-center text-slate-400">
                                        No sync runs yet.
                                    </td>
                                </tr>
                            )}
                            {runList.map(run => (
                                <tr key={run.id} className="border-t border-slate-100 dark:border-white/5">
                                    <td className="py-3 pr-4 font-bold uppercase text-slate-700 dark:text-white">{run.language_code}</td>
                                    <td className="py-3 pr-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusBadge(run.status)}`}>
                                            {run.status}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4">{formatDate(run.started_at)}</td>
                                    <td className="py-3 pr-4">{formatDate(run.completed_at)}</td>
                                    <td className="py-3 pr-4">{run.new_strings ?? 0}</td>
                                    <td className="py-3 pr-4">{run.translated_strings ?? 0}</td>
                                    <td className="py-3 pr-4">{run.errors ?? 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
