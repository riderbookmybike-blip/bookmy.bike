import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { WHEEL_REWARDS, type WheelReward } from '@/lib/rewards/wheel';

export const dynamic = 'force-dynamic';

type SpinRow = {
    id: string;
    status: string;
    tenant_id: string | null;
    reward_id: string | null;
    reward_label: string | null;
    reward_value: number | null;
    reward_kind: string | null;
    reward_payload: Record<string, unknown> | null;
    eligible_at: string | null;
    expires_at: string | null;
    spun_at: string | null;
};

const buildReward = (row: SpinRow) => {
    if (!row.reward_id || !row.reward_label) return null;
    return {
        id: row.reward_id,
        label: row.reward_label,
        value: row.reward_value ?? undefined,
        kind: row.reward_kind ?? undefined,
    };
};

const normalizeRewards = (value: unknown): WheelReward[] | null => {
    if (!Array.isArray(value)) return null;
    const rewards = value
        .map((item: any) => ({
            id: typeof item?.id === 'string' ? item.id : null,
            label: typeof item?.label === 'string' ? item.label : null,
            weight: typeof item?.weight === 'number' ? item.weight : null,
            value: typeof item?.value === 'number' ? item.value : undefined,
            kind: typeof item?.kind === 'string' ? item.kind : null,
        }))
        .filter(item => item.id && item.label && item.weight && item.weight > 0 && item.kind) as WheelReward[];

    return rewards.length ? rewards : null;
};

const resolveRewards = async (tenantId?: string | null) => {
    if (!tenantId) return null;
    const { data, error } = await adminClient
        .from('id_tenant_reward_wheel_configs')
        .select('rewards')
        .eq('tenant_id', tenantId)
        .maybeSingle();

    if (error || !data?.rewards) return null;
    return normalizeRewards(data.rewards);
};

const pickReward = (rewards: WheelReward[]) => {
    const total = rewards.reduce((sum, reward) => sum + reward.weight, 0);
    const roll = Math.random() * total;
    let cursor = 0;
    for (const reward of rewards) {
        cursor += reward.weight;
        if (roll <= cursor) return reward;
    }
    return rewards[rewards.length - 1];
};

const isExpired = (spin: SpinRow) => {
    if (!spin.expires_at) return false;
    return new Date(spin.expires_at).getTime() < Date.now();
};

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: eligibleSpins, error: eligibleError } = await supabase
        .from('id_member_spins')
        .select(
            'id, status, tenant_id, reward_id, reward_label, reward_value, reward_kind, reward_payload, eligible_at, expires_at, spun_at'
        )
        .eq('member_id', user.id)
        .eq('status', 'ELIGIBLE')
        .order('eligible_at', { ascending: true })
        .limit(1);

    if (eligibleError) {
        return NextResponse.json({ error: 'Failed to load spin status' }, { status: 500 });
    }

    let spin = eligibleSpins?.[0];
    if (!spin) {
        const { data: latestSpins, error: latestError } = await supabase
            .from('id_member_spins')
            .select(
                'id, status, tenant_id, reward_id, reward_label, reward_value, reward_kind, reward_payload, eligible_at, expires_at, spun_at'
            )
            .eq('member_id', user.id)
            .order('eligible_at', { ascending: false })
            .limit(1);

        if (latestError) {
            return NextResponse.json({ error: 'Failed to load spin status' }, { status: 500 });
        }

        spin = latestSpins?.[0];
    }

    if (!spin) return NextResponse.json({ visible: false });

    if (spin.status === 'ELIGIBLE' && isExpired(spin)) {
        return NextResponse.json({ visible: false, expired: true });
    }

    const rewards = await resolveRewards(spin.tenant_id);

    return NextResponse.json({
        visible: true,
        status: spin.status,
        eligible: spin.status === 'ELIGIBLE',
        spinId: spin.id,
        reward: spin.status === 'SPUN' ? buildReward(spin) : null,
        rewards: rewards ?? WHEEL_REWARDS,
        expiresAt: spin.expires_at,
        spunAt: spin.spun_at,
    });
}

export async function POST() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: eligibleSpin, error } = await adminClient
        .from('id_member_spins')
        .select(
            'id, status, tenant_id, reward_id, reward_label, reward_value, reward_kind, reward_payload, eligible_at, expires_at, spun_at'
        )
        .eq('member_id', user.id)
        .eq('status', 'ELIGIBLE')
        .order('eligible_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: 'Failed to load spin' }, { status: 500 });
    }

    if (!eligibleSpin) {
        const { data: latestSpin } = await adminClient
            .from('id_member_spins')
            .select(
                'id, status, tenant_id, reward_id, reward_label, reward_value, reward_kind, reward_payload, eligible_at, expires_at, spun_at'
            )
            .eq('member_id', user.id)
            .order('eligible_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (latestSpin?.status === 'SPUN') {
            return NextResponse.json({
                visible: true,
                status: 'SPUN',
                eligible: false,
                spinId: latestSpin.id,
                reward: buildReward(latestSpin),
            });
        }

        return NextResponse.json({ visible: false, eligible: false });
    }

    if (eligibleSpin.status === 'ELIGIBLE' && isExpired(eligibleSpin)) {
        await adminClient.from('id_member_spins').update({ status: 'EXPIRED' }).eq('id', eligibleSpin.id);

        return NextResponse.json({ visible: false, expired: true, eligible: false });
    }

    const rewards = (await resolveRewards(eligibleSpin.tenant_id)) ?? WHEEL_REWARDS;
    const reward = pickReward(rewards);
    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await adminClient
        .from('id_member_spins')
        .update({
            status: 'SPUN',
            reward_id: reward.id,
            reward_label: reward.label,
            reward_value: reward.value ?? null,
            reward_kind: reward.kind,
            reward_payload: { kind: reward.kind },
            spun_at: now,
        })
        .eq('id', eligibleSpin.id)
        .eq('status', 'ELIGIBLE')
        .select('id, status, reward_id, reward_label, reward_value, reward_kind, reward_payload, spun_at')
        .maybeSingle();

    if (updateError) {
        return NextResponse.json({ error: 'Spin failed' }, { status: 500 });
    }

    if (!updated) {
        const { data: latest } = await adminClient
            .from('id_member_spins')
            .select('id, status, reward_id, reward_label, reward_value, reward_kind, reward_payload, spun_at')
            .eq('id', eligibleSpin.id)
            .maybeSingle();

        return NextResponse.json({
            visible: !!latest,
            status: latest?.status ?? 'SPUN',
            eligible: false,
            spinId: latest?.id ?? eligibleSpin.id,
            reward: latest ? buildReward(latest) : null,
        });
    }

    return NextResponse.json({
        visible: true,
        status: 'SPUN',
        eligible: false,
        spinId: updated.id,
        reward: buildReward(updated),
    });
}
// @ts-nocheck
