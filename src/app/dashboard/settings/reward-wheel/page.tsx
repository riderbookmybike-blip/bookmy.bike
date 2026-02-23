'use client';

import React, { useEffect, useState } from 'react';
import { Gift, Save, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';
import { WHEEL_REWARDS, type WheelReward } from '@/lib/rewards/wheel';
import { normalizeIndianPhone } from '@/lib/utils/inputFormatters';

const formatRewards = (rewards: WheelReward[]) => JSON.stringify(rewards, null, 2);

const parseRewards = (raw: string) => {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Rewards must be a non-empty JSON array.');
    }

    const normalized = parsed.map((item: any) => ({
        id: typeof item?.id === 'string' ? item.id.trim() : '',
        label: typeof item?.label === 'string' ? item.label.trim() : '',
        weight: typeof item?.weight === 'number' ? item.weight : Number(item?.weight),
        value: typeof item?.value === 'number' ? item.value : item?.value ? Number(item.value) : undefined,
        kind: typeof item?.kind === 'string' ? item.kind.trim() : '',
    }));

    normalized.forEach((item, index) => {
        if (!item.id || !item.label || !item.kind || !Number.isFinite(item.weight) || item.weight <= 0) {
            throw new Error(`Invalid reward at index ${index}.`);
        }
    });

    const ids = new Set(normalized.map(item => item.id));
    if (ids.size !== normalized.length) {
        throw new Error('Reward ids must be unique.');
    }

    return normalized as WheelReward[];
};

export default function RewardWheelSettingsPage() {
    const { tenantId, tenantName } = useTenant();
    const [rewardsJson, setRewardsJson] = useState(formatRewards(WHEEL_REWARDS));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [phone, setPhone] = useState('');
    const [granting, setGranting] = useState(false);
    const [grantMessage, setGrantMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!tenantId) return;
        const supabase = createClient();
        let active = true;

        const fetchConfig = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await (supabase as any)
                    .from('id_tenant_reward_wheel_configs')
                    .select('rewards')
                    .eq('tenant_id', tenantId)
                    .maybeSingle();

                if (fetchError) throw fetchError;
                const rewards = Array.isArray(data?.rewards) && data?.rewards.length ? data?.rewards : WHEEL_REWARDS;

                if (active) {
                    setRewardsJson(formatRewards(rewards as WheelReward[]));
                }
            } catch (err) {
                if (active) {
                    setError('Failed to load reward wheel config.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchConfig();
        return () => {
            active = false;
        };
    }, [tenantId]);

    const handleSave = async () => {
        if (!tenantId) return;
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const rewards = parseRewards(rewardsJson);
            const supabase = createClient();
            const { error: saveError } = await (supabase as any).from('id_tenant_reward_wheel_configs').upsert(
                {
                    tenant_id: tenantId,
                    rewards,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'tenant_id' }
            );

            if (saveError) throw saveError;
            setSuccess('Reward wheel configuration saved.');
        } catch (err: unknown) {
            setError(err?.message || 'Failed to save rewards.');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setRewardsJson(formatRewards(WHEEL_REWARDS));
        setSuccess(null);
        setError(null);
    };

    const handleGrantSpin = async () => {
        if (!tenantId) return;
        setGranting(true);
        setGrantMessage(null);
        try {
            const response = await fetch('/api/admin/reward-wheel/grant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    tenantId,
                    reason: 'MANUAL_TEST',
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'Failed to grant spin');
            }
            setGrantMessage('Spin granted successfully.');
        } catch (err: unknown) {
            setGrantMessage(err?.message || 'Failed to grant spin.');
        } finally {
            setGranting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-600/10 text-rose-600 rounded-2xl border border-rose-200">
                    <Gift size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reward Wheel</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Configure spin rewards for {tenantName || 'this tenant'}.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Rewards JSON</h3>
                            <p className="text-xs text-slate-500">
                                Edit reward list + weights (one spin uses weighted random).
                            </p>
                        </div>
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900"
                        >
                            <RefreshCw size={14} /> Reset
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                            <Loader2 className="animate-spin" size={20} />
                        </div>
                    ) : (
                        <textarea
                            value={rewardsJson}
                            onChange={e => setRewardsJson(e.target.value)}
                            className="w-full min-h-[360px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                    )}

                    {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
                    {success && <p className="text-xs text-emerald-500 font-bold">{success}</p>}

                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <>
                                    <Save size={16} /> Save Rewards
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <Sparkles size={18} className="text-rose-500" />
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">Grant Test Spin</h3>
                            <p className="text-[11px] text-slate-500">Give an eligible spin to a phone number.</p>
                        </div>
                    </div>

                    <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(normalizeIndianPhone(e.target.value))}
                        onPaste={e => {
                            const text = e.clipboardData.getData('text');
                            const normalized = normalizeIndianPhone(text);
                            if (normalized) {
                                e.preventDefault();
                                setPhone(normalized);
                            }
                        }}
                        placeholder="Phone number"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                    <button
                        onClick={handleGrantSpin}
                        disabled={!phone || granting}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        {granting ? <Loader2 className="animate-spin" size={16} /> : 'Grant Spin'}
                    </button>
                    {grantMessage && <p className="text-[11px] text-slate-500">{grantMessage}</p>}
                </div>
            </div>
        </div>
    );
}
