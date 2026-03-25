'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendCampaignBatchWhatsApp } from '@/lib/sms/msg91-whatsapp';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WaCampaign {
    id: string;
    name: string;
    template_name: string;
    template_status: 'PENDING' | 'APPROVED';
    status: 'DRAFT' | 'TEST' | 'ACTIVE' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'DONE';
    offer_start: string | null;
    offer_end: string | null;
    batch_size: number;
    batch_delay_min: number;
    eligible_count: number | null;
    sent_count: number;
    failed_count: number;
    test_batch_approved: boolean;
    created_at: string;
    updated_at: string;
}

export interface WaCampaignLog {
    id: string;
    campaign_id: string;
    batch_number: number;
    is_test: boolean;
    status: 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED' | 'PAUSED';
    recipient_count: number;
    sent_count: number;
    failed_count: number;
    // Aggregated from cam_whatsapp_recipients (webhook-populated)
    delivered_count: number;
    read_count: number;
    clicked_count: number;
    started_at: string | null;
    completed_at: string | null;
    error_summary: string | null;
    created_at: string;
}

/**
 * Per-recipient row returned from cam_whatsapp_recipients.
 *
 * Source contract (locked):
 *  - delivered_at / read_at  → MSG91 webhook (Phase 2, not yet wired)
 *  - clicked_at              → CTA tracked URL param ?uid=<member_id> (Phase 2)
 *  - signup_at / login_at    → app events on session creation (Phase 2)
 */
export interface WaCampaignRecipient {
    id: string;
    campaign_id: string;
    batch_log_id: string;
    member_id: string | null;
    phone: string;
    full_name: string | null;
    pincode: string | null;
    area: string | null;
    district: string | null;
    distance_km: number | null;
    send_status: 'SENT' | 'FAILED';
    sent_at: string;
    // Phase 2 — not yet wired
    delivered_at: string | null;
    read_at: string | null;
    clicked_at: string | null;
    signup_at: string | null;
    login_at: string | null;
}

export interface ActionResult {
    success: boolean;
    error?: string;
    too_soon?: boolean;
    retry_after_seconds?: number;
    busy?: boolean;
    risk_blocked?: boolean;
    failed_rate_pct?: number;
    threshold_pct?: number;
    data?: unknown;
}

// Full member row resolved at batch time
interface EligibleMemberRow {
    id: string | null;
    full_name: string | null;
    whatsapp: string | null;
    pincode: string | null;
    aadhaar_pincode: string | null;
    latitude: number | null;
    longitude: number | null;
    district: string | null;
    created_at: string | null;
}

interface PincodeGeoRow {
    pincode: string;
    latitude: number | null;
    longitude: number | null;
    area: string | null;
}

// Resolved batch member, ready to insert into cam_whatsapp_recipients
interface MemberBatchRow {
    member_id: string | null;
    phone: string;
    full_name: string | null;
    pincode: string | null;
    area: string | null;
    district: string | null;
    distance_km: number | null;
}

const WA_SERVICE_CENTER_PINCODE = '401203';
const WA_SERVICE_RADIUS_KM = 200;
const WA_FAILURE_ALERT_THRESHOLD_PCT = Number(process.env.WA_FAILURE_ALERT_THRESHOLD_PCT || 30);
const WA_ECOSYSTEM_131049_BLOCK = (process.env.WA_ECOSYSTEM_131049_BLOCK || 'true').toLowerCase() !== 'false';

function digits6(value: string | null | undefined): string | null {
    const d = String(value || '')
        .replace(/\D/g, '')
        .slice(0, 6);
    return d.length === 6 ? d : null;
}

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth guard
// ─────────────────────────────────────────────────────────────────────────────

async function requireAumsAdmin(): Promise<{ ok: true } | { ok: false; result: ActionResult }> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, result: { success: false, error: 'unauthorized' } };

    const { data: membership } = await supabase
        .from('id_team')
        .select('role, id_tenants!inner(slug)')
        .eq('user_id', user.id)
        .eq('id_tenants.slug', 'aums')
        .eq('status', 'ACTIVE')
        .maybeSingle();

    const role = (membership?.role ?? '').toUpperCase();
    if (!['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(role)) {
        return { ok: false, result: { success: false, error: 'forbidden' } };
    }

    return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

export async function getCampaign(campaignId: string): Promise<WaCampaign | null> {
    const { data, error } = await adminClient
        .from('cam_whatsapp_campaigns')
        .select('*')
        .eq('id', campaignId)
        .maybeSingle();
    if (error) {
        console.error('[WaCampaign] getCampaign error:', error);
        return null;
    }
    return data as WaCampaign | null;
}

export async function getCampaignLogs(campaignId: string): Promise<WaCampaignLog[]> {
    const [logsRes, recipientsRes] = await Promise.all([
        adminClient
            .from('cam_whatsapp_logs')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('batch_number', { ascending: false }),
        adminClient
            .from('cam_whatsapp_recipients')
            .select('batch_log_id, delivered_at, read_at, clicked_at')
            .eq('campaign_id', campaignId)
            .not('batch_log_id', 'is', null),
    ]);

    if (logsRes.error) {
        console.error('[WaCampaign] getCampaignLogs error:', logsRes.error);
        return [];
    }

    // Aggregate delivery counts per batch_log_id
    const deliveredMap = new Map<string, { delivered: number; read: number; clicked: number }>();
    for (const r of recipientsRes.data ?? []) {
        if (!r.batch_log_id) continue;
        const prev = deliveredMap.get(r.batch_log_id) ?? { delivered: 0, read: 0, clicked: 0 };
        if (r.delivered_at) prev.delivered++;
        if (r.read_at) prev.read++;
        if (r.clicked_at) prev.clicked++;
        deliveredMap.set(r.batch_log_id, prev);
    }

    return (logsRes.data ?? []).map(row => {
        const agg = deliveredMap.get(row.id) ?? { delivered: 0, read: 0, clicked: 0 };
        return {
            ...row,
            delivered_count: agg.delivered,
            read_count: agg.read,
            clicked_count: agg.clicked,
        } as WaCampaignLog;
    });
}

/** Per-recipient rows for a campaign, newest first. */
export async function getCampaignRecipients(campaignId: string): Promise<WaCampaignRecipient[]> {
    const { data, error } = await adminClient
        .from('cam_whatsapp_recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sent_at', { ascending: false });
    if (error) {
        console.error('[WaCampaign] getCampaignRecipients error:', error);
        return [];
    }
    return (data ?? []) as WaCampaignRecipient[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Serviceability helpers — now returns full MemberBatchRow objects
// ─────────────────────────────────────────────────────────────────────────────

async function loadPincodeGeoMap(pincodes: string[]): Promise<Map<string, PincodeGeoRow>> {
    const map = new Map<string, PincodeGeoRow>();
    if (pincodes.length === 0) return map;

    // NOTE: Large `.in(...)` lists can exceed PostgREST query limits and silently
    // degrade mapping coverage. Chunk requests to keep lookup deterministic.
    const CHUNK_SIZE = 400;
    for (let i = 0; i < pincodes.length; i += CHUNK_SIZE) {
        const chunk = pincodes.slice(i, i + CHUNK_SIZE);
        const { data, error } = await adminClient
            .from('loc_pincodes')
            .select('pincode, latitude, longitude, area')
            .in('pincode', chunk);

        if (error) {
            console.error('[WaCampaign] loadPincodeGeoMap chunk error:', error);
            continue;
        }

        for (const row of (data ?? []) as PincodeGeoRow[]) {
            map.set(row.pincode, row);
        }
    }

    return map;
}

async function getCenterCoordinates(): Promise<{ lat: number; lon: number } | null> {
    const { data, error } = await adminClient
        .from('loc_pincodes')
        .select('latitude, longitude')
        .eq('pincode', WA_SERVICE_CENTER_PINCODE)
        .maybeSingle();

    if (error) {
        console.error('[WaCampaign] center pincode lookup error:', error);
        return null;
    }
    if (typeof data?.latitude !== 'number' || typeof data?.longitude !== 'number') {
        console.error('[WaCampaign] center pincode coordinates missing:', WA_SERVICE_CENTER_PINCODE);
        return null;
    }
    return { lat: data.latitude, lon: data.longitude };
}

/**
 * Returns all serviceable members as full MemberBatchRow objects,
 * ordered by created_at ASC (for deterministic batching).
 */
async function getServiceableEligibleMembers(): Promise<MemberBatchRow[]> {
    const center = await getCenterCoordinates();
    if (!center) return [];

    const members: EligibleMemberRow[] = [];
    const PAGE_SIZE = 1000;
    let from = 0;

    while (true) {
        const to = from + PAGE_SIZE - 1;
        const { data, error } = await adminClient
            .from('id_members')
            .select('id, full_name, whatsapp, pincode, aadhaar_pincode, latitude, longitude, district, created_at')
            .not('whatsapp', 'is', null)
            .order('created_at', { ascending: true })
            .range(from, to);

        if (error) {
            console.error('[WaCampaign] getServiceableEligibleMembers page error:', error);
            return [];
        }

        const page = (data ?? []) as EligibleMemberRow[];
        if (page.length === 0) break;
        members.push(...page);
        if (page.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    if (members.length === 0 || !center) return [];

    const pinSet = new Set<string>();
    for (const m of members) {
        const p = digits6(m.pincode) || digits6(m.aadhaar_pincode);
        if (p) pinSet.add(p);
    }
    const pinMap = await loadPincodeGeoMap(Array.from(pinSet));

    const result: MemberBatchRow[] = [];

    for (const m of members) {
        const wa = (m.whatsapp || '').trim();
        if (!wa) continue;

        let lat: number | null = null;
        let lon: number | null = null;
        let area: string | null = null;
        const resolvedPincode = digits6(m.pincode) || digits6(m.aadhaar_pincode);

        // Deterministic policy:
        // 1) If pincode exists and has geo, always use pincode centroid (same pin => same distance)
        // 2) Else fallback to member lat/lon
        if (resolvedPincode) {
            const geo = pinMap.get(resolvedPincode);
            if (typeof geo?.latitude === 'number' && typeof geo?.longitude === 'number') {
                lat = geo.latitude;
                lon = geo.longitude;
                area = geo.area ?? null;
            }
        }

        if (lat === null || lon === null) {
            lat = m.latitude ?? null;
            lon = m.longitude ?? null;
        }

        if (typeof lat !== 'number' || typeof lon !== 'number') continue;

        const distanceKm = haversineDistanceKm(center.lat, center.lon, lat, lon);
        if (distanceKm > WA_SERVICE_RADIUS_KM) continue;

        result.push({
            member_id: m.id ?? null,
            phone: wa,
            full_name: m.full_name ?? null,
            pincode: resolvedPincode ?? m.pincode ?? null,
            area,
            district: m.district ?? null,
            distance_km: Math.round(distanceKm * 100) / 100,
        });
    }

    return result;
}

// Phones-only version (used by refreshEligibleCount — no change to that UX)
async function getServiceableEligiblePhones(): Promise<string[]> {
    const members = await getServiceableEligibleMembers();
    return members.map(m => m.phone);
}

// ─────────────────────────────────────────────────────────────────────────────
// Eligible count
// ─────────────────────────────────────────────────────────────────────────────

export async function refreshEligibleCount(campaignId: string): Promise<ActionResult> {
    const auth = await requireAumsAdmin();
    if (!auth.ok) return auth.result;

    const phones = await getServiceableEligiblePhones();
    const eligibleCount = phones.length;

    const { error: updateError } = await adminClient
        .from('cam_whatsapp_campaigns')
        .update({ eligible_count: eligibleCount })
        .eq('id', campaignId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    return { success: true, data: { eligible_count: eligibleCount } };
}

// ─────────────────────────────────────────────────────────────────────────────
// Guard helpers
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCampaignForAction(campaignId: string): Promise<WaCampaign | { error: string }> {
    const campaign = await getCampaign(campaignId);
    if (!campaign) return { error: 'Campaign not found' };
    return campaign;
}

// ─────────────────────────────────────────────────────────────────────────────
// Eligible recipient fetch (batch-aware)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchEligibleBatch(alreadySent: number, batchSize: number, isTest: boolean): Promise<MemberBatchRow[]> {
    if (isTest) {
        const testPhone = process.env.MSG91_WA_TEST_PHONE;
        if (!testPhone) {
            console.warn('[WaCampaign] MSG91_WA_TEST_PHONE not set — test batch will have 0 recipients');
            return [];
        }
        return [
            {
                member_id: null,
                phone: testPhone,
                full_name: 'Test Recipient',
                pincode: null,
                area: null,
                district: null,
                distance_km: null,
            },
        ];
    }

    const members = await getServiceableEligibleMembers();
    return members.slice(alreadySent, alreadySent + batchSize);
}

// ─────────────────────────────────────────────────────────────────────────────
// Insert recipient rows after a batch send
// ─────────────────────────────────────────────────────────────────────────────

async function insertRecipientRows(
    campaignId: string,
    batchLogId: string,
    members: MemberBatchRow[],
    sentPhones: Set<string>
): Promise<void> {
    if (members.length === 0) return;

    const rows = members.map(m => ({
        campaign_id: campaignId,
        batch_log_id: batchLogId,
        member_id: m.member_id,
        phone: m.phone,
        full_name: m.full_name,
        pincode: m.pincode,
        area: m.area,
        district: m.district,
        distance_km: m.distance_km,
        send_status: sentPhones.has(m.phone) ? 'SENT' : 'FAILED',
        sent_at: new Date().toISOString(),
    }));

    const { error } = await adminClient.from('cam_whatsapp_recipients').insert(rows);
    if (error) {
        console.error('[WaCampaign] insertRecipientRows error:', error);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Next batch number
// ─────────────────────────────────────────────────────────────────────────────

async function nextBatchNumber(campaignId: string): Promise<number> {
    const { data } = await adminClient
        .from('cam_whatsapp_logs')
        .select('batch_number')
        .eq('campaign_id', campaignId)
        .order('batch_number', { ascending: false })
        .limit(1)
        .maybeSingle();
    return ((data as { batch_number: number } | null)?.batch_number ?? 0) + 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/** Send test batch — only valid from DRAFT status */
export async function sendTestBatch(campaignId: string): Promise<ActionResult> {
    const auth = await requireAumsAdmin();
    if (!auth.ok) return auth.result;

    const result = await fetchCampaignForAction(campaignId);
    if ('error' in result) return { success: false, error: result.error };
    const campaign = result;

    if (campaign.status !== 'DRAFT') {
        return { success: false, error: `Cannot send test batch from status "${campaign.status}"` };
    }

    const { error: statusError } = await adminClient
        .from('cam_whatsapp_campaigns')
        .update({ status: 'TEST' })
        .eq('id', campaignId)
        .eq('status', 'DRAFT');

    if (statusError) {
        return { success: false, error: statusError.message };
    }

    const batchNumber = await nextBatchNumber(campaignId);
    const recipients = await fetchEligibleBatch(0, 1, true);

    const { data: logRow, error: logError } = await adminClient
        .from('cam_whatsapp_logs')
        .insert({
            campaign_id: campaignId,
            batch_number: batchNumber,
            is_test: true,
            status: 'RUNNING',
            recipient_count: recipients.length,
            started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

    if (logError) {
        return { success: false, error: logError.message };
    }

    const phones = recipients.map(r => r.phone);
    const { sent, failed } = await sendCampaignBatchWhatsApp(phones, campaign.template_name);

    const sentPhones = new Set(sent > 0 ? phones : []);

    await Promise.all([
        adminClient
            .from('cam_whatsapp_logs')
            .update({
                status: failed > 0 && sent === 0 ? 'FAILED' : 'DONE',
                sent_count: sent,
                failed_count: failed,
                completed_at: new Date().toISOString(),
            })
            .eq('id', logRow.id),
        insertRecipientRows(campaignId, logRow.id, recipients, sentPhones),
    ]);

    return { success: true, data: { batch_number: batchNumber, sent, failed } };
}

/** Approve test batch — gates production batches */
export async function approveTestBatch(campaignId: string): Promise<ActionResult> {
    const auth = await requireAumsAdmin();
    if (!auth.ok) return auth.result;

    const result = await fetchCampaignForAction(campaignId);
    if ('error' in result) return { success: false, error: result.error };
    const campaign = result;

    if (campaign.status !== 'TEST') {
        return { success: false, error: `Cannot approve from status "${campaign.status}"` };
    }

    const { error } = await adminClient
        .from('cam_whatsapp_campaigns')
        .update({ status: 'ACTIVE', test_batch_approved: true })
        .eq('id', campaignId)
        .eq('status', 'TEST');

    if (error) return { success: false, error: error.message };
    return { success: true };
}

/** Run next production batch — only if ACTIVE + test approved. */
export async function runNextBatch(campaignId: string, options?: { force?: boolean }): Promise<ActionResult> {
    const auth = await requireAumsAdmin();
    if (!auth.ok) return auth.result;

    const result = await fetchCampaignForAction(campaignId);
    if ('error' in result) return { success: false, error: result.error };
    const campaign = result;

    if (campaign.status !== 'ACTIVE') {
        if (campaign.status === 'RUNNING') {
            return { success: false, busy: true, error: 'A batch is already in progress' };
        }
        return { success: false, error: `Cannot run batch from status "${campaign.status}"` };
    }
    if (!campaign.test_batch_approved) {
        return { success: false, error: 'Test batch must be approved before running production batches' };
    }

    // Alert gate: if last production batch failed-rate is high, block until override.
    if (!options?.force) {
        const { data: lastProdLog } = await adminClient
            .from('cam_whatsapp_logs')
            .select('recipient_count, failed_count, error_summary')
            .eq('campaign_id', campaignId)
            .eq('is_test', false)
            .order('batch_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (lastProdLog && Number(lastProdLog.recipient_count || 0) > 0) {
            const failedRatePct =
                (Number(lastProdLog.failed_count || 0) / Number(lastProdLog.recipient_count || 1)) * 100;
            if (failedRatePct >= WA_FAILURE_ALERT_THRESHOLD_PCT) {
                return {
                    success: false,
                    risk_blocked: true,
                    failed_rate_pct: Number(failedRatePct.toFixed(1)),
                    threshold_pct: WA_FAILURE_ALERT_THRESHOLD_PCT,
                    error: `High failed rate ${failedRatePct.toFixed(1)}%`,
                };
            }
        }

        if (
            WA_ECOSYSTEM_131049_BLOCK &&
            typeof lastProdLog?.error_summary === 'string' &&
            lastProdLog.error_summary.includes('131049')
        ) {
            return {
                success: false,
                risk_blocked: true,
                failed_rate_pct: Number(
                    (
                        (Number(lastProdLog.failed_count || 0) / Number(lastProdLog.recipient_count || 1)) * 100 || 0
                    ).toFixed(1)
                ),
                threshold_pct: WA_FAILURE_ALERT_THRESHOLD_PCT,
                error: 'Meta ecosystem block detected (131049) in previous batch',
            };
        }
    }

    // Enforce batch_delay_min
    if (campaign.batch_delay_min > 0) {
        const { data: lastLog } = await adminClient
            .from('cam_whatsapp_logs')
            .select('completed_at')
            .eq('campaign_id', campaignId)
            .eq('is_test', false)
            .not('completed_at', 'is', null)
            .order('batch_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (lastLog?.completed_at) {
            const elapsedSec = (Date.now() - new Date(lastLog.completed_at).getTime()) / 1000;
            const requiredSec = campaign.batch_delay_min * 60;
            if (elapsedSec < requiredSec) {
                const retry_after_seconds = Math.ceil(requiredSec - elapsedSec);
                return { success: false, too_soon: true, retry_after_seconds };
            }
        }
    }

    // Atomic RUNNING lock
    const { data: lockData, error: lockError } = await adminClient
        .from('cam_whatsapp_campaigns')
        .update({ status: 'RUNNING' })
        .eq('id', campaignId)
        .eq('status', 'ACTIVE')
        .select('id');

    if (lockError) {
        console.error('[WaCampaign] runNextBatch lock error:', lockError);
        return { success: false, error: `Lock failed: ${lockError.message}` };
    }
    if (!lockData || lockData.length === 0) {
        const latest = await getCampaign(campaignId);
        if (latest?.status === 'RUNNING') {
            return { success: false, busy: true, error: 'A batch is already in progress' };
        }
        return { success: false, error: `Unable to acquire batch lock from status "${latest?.status ?? 'UNKNOWN'}"` };
    }

    try {
        const batchNumber = await nextBatchNumber(campaignId);
        const recipients = await fetchEligibleBatch(campaign.sent_count, campaign.batch_size, false);

        if (recipients.length === 0) {
            await adminClient.from('cam_whatsapp_campaigns').update({ status: 'DONE' }).eq('id', campaignId);
            return { success: true, data: { done: true, message: 'All eligible recipients reached' } };
        }

        const { data: logRow, error: logError } = await adminClient
            .from('cam_whatsapp_logs')
            .insert({
                campaign_id: campaignId,
                batch_number: batchNumber,
                is_test: false,
                status: 'RUNNING',
                recipient_count: recipients.length,
                started_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (logError) throw new Error(logError.message);

        const phones = recipients.map(r => r.phone);
        const batchResult = await sendCampaignBatchWhatsApp(phones, campaign.template_name);
        const { sent, failed, errors: batchErrors } = batchResult;

        // Build sent-phones set: MSG91 doesn't return per-phone status,
        // so we optimistically mark all as SENT if sent > 0, or all FAILED.
        const sentPhones = new Set(sent > 0 ? phones : []);

        // Capture error summary — surfaces 131049 / other MSG91 codes in UI
        const errorSummary =
            batchErrors.length > 0
                ? batchErrors
                      .map(e => e.message)
                      .slice(0, 3)
                      .join('; ')
                : null;

        await Promise.all([
            adminClient
                .from('cam_whatsapp_campaigns')
                .update({
                    status: 'ACTIVE',
                    sent_count: campaign.sent_count + sent,
                    failed_count: campaign.failed_count + failed,
                })
                .eq('id', campaignId),
            adminClient
                .from('cam_whatsapp_logs')
                .update({
                    status: failed > 0 && sent === 0 ? 'FAILED' : 'DONE',
                    sent_count: sent,
                    failed_count: failed,
                    completed_at: new Date().toISOString(),
                    ...(errorSummary ? { error_summary: errorSummary } : {}),
                })
                .eq('id', logRow.id),
            insertRecipientRows(campaignId, logRow.id, recipients, sentPhones),
        ]);

        return { success: true, data: { batch_number: batchNumber, sent, failed } };
    } catch (err) {
        console.error('[WaCampaign] runNextBatch error, releasing lock:', err);
        await adminClient.from('cam_whatsapp_campaigns').update({ status: 'ACTIVE' }).eq('id', campaignId);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/** Pause campaign */
export async function pauseCampaign(campaignId: string): Promise<ActionResult> {
    const auth = await requireAumsAdmin();
    if (!auth.ok) return auth.result;

    const { error } = await adminClient
        .from('cam_whatsapp_campaigns')
        .update({ status: 'PAUSED' })
        .eq('id', campaignId)
        .eq('status', 'ACTIVE');
    if (error) return { success: false, error: error.message };
    return { success: true };
}

/** Resume campaign (must be PAUSED) */
export async function resumeCampaign(campaignId: string): Promise<ActionResult> {
    const auth = await requireAumsAdmin();
    if (!auth.ok) return auth.result;

    const { error } = await adminClient
        .from('cam_whatsapp_campaigns')
        .update({ status: 'ACTIVE' })
        .eq('id', campaignId)
        .eq('status', 'PAUSED');
    if (error) return { success: false, error: error.message };
    return { success: true };
}

/** Stop campaign (terminal state) */
export async function stopCampaign(campaignId: string): Promise<ActionResult> {
    const auth = await requireAumsAdmin();
    if (!auth.ok) return auth.result;

    const { error } = await adminClient
        .from('cam_whatsapp_campaigns')
        .update({ status: 'STOPPED' })
        .eq('id', campaignId)
        .not('status', 'in', '("DONE","STOPPED")');
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export interface CreateCampaignInput {
    name: string;
    template_name: string;
    offer_start?: string;
    offer_end?: string;
    batch_size?: number;
    batch_delay_min?: number;
}

export async function createCampaign(input: CreateCampaignInput): Promise<ActionResult & { id?: string }> {
    const auth = await requireAumsAdmin();
    if (!auth.ok) return auth.result;

    const { name, template_name, offer_start, offer_end, batch_size, batch_delay_min } = input;
    if (!name?.trim()) return { success: false, error: 'Campaign name is required' };
    if (!template_name?.trim()) return { success: false, error: 'Template name is required' };

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await adminClient
        .from('cam_whatsapp_campaigns')
        .insert({
            name: name.trim(),
            template_name: template_name.trim(),
            template_status: 'PENDING',
            status: 'DRAFT',
            offer_start: offer_start || null,
            offer_end: offer_end || null,
            batch_size: batch_size ?? 100,
            batch_delay_min: batch_delay_min ?? 0,
            sent_count: 0,
            failed_count: 0,
            test_batch_approved: false,
            created_by: user?.id ?? null,
        })
        .select('id')
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, id: data.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// Backfill: Pull delivery status from MSG91 Reports API
// Use this to populate delivered_at / read_at for messages already sent
// before the webhook was configured.
//
// MSG91 Reports API:
//   GET https://api.msg91.com/api/v5/report/whatsapp/logs
//   Headers: authkey: YOUR_KEY
//   Query:   startDate, endDate, perPageData (max 100), pageNo
//
// Response: { data: [{ requestId, to, status, sentAt, deliveredAt, readAt }] }
// ─────────────────────────────────────────────────────────────────────────────

interface Msg91ReportRow {
    requestId?: string;
    campaignRequestId?: string;
    customerNumber?: string; // confirmed from live API
    to?: string;
    mobile?: string;
    phone?: string;
    status?: string;
    // MSG91 returns these as { value: 'ISO string' } objects OR null
    sentTime?: { value: string } | string | null;
    deliveryTime?: { value: string } | string | null;
    readTime?: { value: string } | string | null;
    // legacy aliases
    deliveredAt?: string | null;
    readAt?: string | null;
    delivered_time?: string | null;
    read_time?: string | null;
}

/** Unwrap MSG91 timestamp: either { value: 'ISO' } object or plain string */
function extractTs(v: { value: string } | string | null | undefined): string | null {
    if (!v) return null;
    const raw = typeof v === 'object' && 'value' in v ? v.value : String(v);
    if (!raw) return null;
    // MSG91 timestamps are in IST but have no timezone suffix.
    // Append +05:30 so Postgres stores the correct UTC value (avoids 5.5hr offset in display).
    if (!raw.includes('+') && !raw.includes('Z') && !raw.endsWith('z')) {
        return raw.replace(' ', 'T') + '+05:30';
    }
    return raw;
}

export interface BackfillResult {
    success: boolean;
    error?: string;
    data?: { updated: number; scanned: number };
}

export async function backfillCampaignStatus(
    campaignId: string,
    options?: { daysBack?: number }
): Promise<BackfillResult> {
    const auth = await requireAumsAdmin();
    if (!auth.ok) return { success: false, error: auth.result.error };

    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) return { success: false, error: 'MSG91_AUTH_KEY not configured' };

    // Date range: default last 30 days
    const daysBack = options?.daysBack ?? 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const fmt = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD

    // Fetch all recipient phones for this campaign
    const { data: recipientRows, error: rErr } = await adminClient
        .from('cam_whatsapp_recipients')
        .select('id, phone, delivered_at, read_at')
        .eq('campaign_id', campaignId)
        .eq('send_status', 'SENT');

    if (rErr) return { success: false, error: rErr.message };
    if (!recipientRows || recipientRows.length === 0) {
        return { success: true, data: { updated: 0, scanned: 0 } };
    }

    // Build a phone → recipient-id map (10-digit normalized)
    const phoneMap = new Map<string, { id: string; delivered_at: string | null; read_at: string | null }>();
    for (const r of recipientRows) {
        const digits = (r.phone || '').replace(/\D/g, '');
        const ten = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10);
        if (ten.length === 10) phoneMap.set(ten, { id: r.id, delivered_at: r.delivered_at, read_at: r.read_at });
    }

    // ── Paginated fetch — max 20 pages (10,000 records max for safety) ───────
    let rows: Msg91ReportRow[] = [];
    let scanned = 0;

    try {
        for (let page = 1; page <= 20; page++) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 8000);

            const res = await fetch('https://control.msg91.com/api/v5/report/logs/wa', {
                method: 'POST',
                headers: { authkey: authKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: fmt(startDate),
                    endDate: fmt(endDate),
                    perPageData: 500,
                    pageNo: page,
                }),
                signal: controller.signal,
                cache: 'no-store',
            });
            clearTimeout(timer);

            const json = await res.json();
            const pageRows = Array.isArray(json?.data)
                ? json.data
                : Array.isArray(json?.logs)
                  ? json.logs
                  : Array.isArray(json?.message)
                    ? json.message
                    : Array.isArray(json)
                      ? json
                      : [];

            rows.push(...pageRows);

            if (page === 1) {
                console.log(
                    `[WaCampaign] backfill payload: 30-days, page ${page} response keys:`,
                    Object.keys(json ?? {})
                );
            }

            // Stop fetching if this page returned fewer than max records
            if (pageRows.length < 500) break;
        }
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[WaCampaign] backfill fetch error:', msg);
        return { success: false, error: `MSG91 fetch failed: ${msg}` };
    }

    scanned = rows.length;
    console.log(`[WaCampaign] backfill scanned ${scanned} rows from MSG91`);

    // ── Match rows → recipients ──────────────────────────────────────────────
    const deliveredIds: Array<{ id: string; delivered_at: string }> = [];
    const readIds: Array<{ id: string; read_at: string }> = [];
    const failedIds: Array<{ id: string; send_status: string }> = [];

    for (const row of rows) {
        const rawPhone = row.customerNumber || row.to || row.mobile || row.phone || '';
        const digits = rawPhone.replace(/\D/g, '');
        const ten = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10);
        if (ten.length !== 10) continue;

        const recipient = phoneMap.get(ten);
        if (!recipient) continue;

        const status = (row.status || '').toLowerCase();
        if (status === 'failed' || status === 'undelivered' || status === 'rejected' || status === 'bounced') {
            failedIds.push({ id: recipient.id, send_status: 'FAILED' });
            // Remove from phoneMap so we don't attempt to match read/delivered below
            phoneMap.delete(ten);
            continue;
        }

        const deliveredAt = extractTs(row.deliveryTime) ?? row.deliveredAt ?? row.delivered_time ?? null;
        const readAt = extractTs(row.readTime) ?? row.readAt ?? row.read_time ?? null;

        if (!recipient.delivered_at && deliveredAt) deliveredIds.push({ id: recipient.id, delivered_at: deliveredAt });
        if (!recipient.read_at && readAt) readIds.push({ id: recipient.id, read_at: readAt });
    }

    // ── Bulk update in parallel — one query per status type ──────────────────
    let updated = 0;

    const bulkUpdate = async (items: Array<{ id: string } & Record<string, string>>, field: string) => {
        // Supabase doesn't support bulk update with different values per row,
        // so batch by groups of same timestamp — or just do parallel individual updates.
        // With Promise.all they all fire concurrently (not sequential).
        const results = await Promise.all(
            items.map(({ id, ...fields }) => adminClient.from('cam_whatsapp_recipients').update(fields).eq('id', id))
        );
        return results.filter(r => !r.error).length;
    };

    const [d, r, f] = await Promise.all([
        bulkUpdate(deliveredIds as Array<{ id: string } & Record<string, string>>, 'delivered_at'),
        bulkUpdate(readIds as Array<{ id: string } & Record<string, string>>, 'read_at'),
        bulkUpdate(failedIds as Array<{ id: string } & Record<string, string>>, 'send_status'),
    ]);
    updated = d + r + f;

    console.log(`[WaCampaign] Backfill done — scanned:${scanned} updated:${updated}`);
    return { success: true, data: { updated, scanned } };
}
