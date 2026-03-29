import { chromium, Page } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

type SeriesStatusRow = {
    stateCode: string;
    rtoCode: string;
    rtoName: string;
    seriesName: string;
    seriesType: string;
    statusText: string;
    isActive: boolean;
    startRange: number;
    endRange: number;
    openOnText: string;
};

type SeriesProgressRow = SeriesStatusRow & {
    firstOpenNumber: number | null;
    filledTill: number | null;
    runningOpenCount: number;
    availableCount: number;
    activeOnDate: string | null;
    scrapedAt: string;
};

const SERIES_URL = 'https://fancy.parivahan.gov.in/fancy/faces/public/seriesOpenStatus.xhtml';
const AVAILABLE_URL = 'https://fancy.parivahan.gov.in/fancy/faces/public/availableAllNumbers.xhtml';

const STATE_CODE = (process.env.FANCY_STATE_CODE || 'MH').toUpperCase();
const STATE_NAME = process.env.FANCY_STATE_NAME || 'Maharashtra';
const RTO_FILTER = (process.env.FANCY_RTO_FILTER || '').trim().toUpperCase();
const HEADLESS = process.env.HEADLESS !== 'false';
const WRITE_DB = process.env.WRITE_DB === 'true';
const MAX_RTOS = Number(process.env.FANCY_MAX_RTOS || '9999');
const ONLY_ACTIVE = process.env.FANCY_ONLY_ACTIVE !== 'false';
const BATCH_SIZE = Math.max(1, Number(process.env.FANCY_BATCH_SIZE || '5'));
const STRICT_BATCH_VERIFY = process.env.FANCY_STRICT_BATCH_VERIFY !== 'false';
const MIN_COVERAGE = Math.max(1, Number(process.env.FANCY_MIN_COVERAGE || '50'));
const MAX_SAME_FILLED = Math.max(2, Number(process.env.FANCY_MAX_SAME_FILLED || '8'));
const FAIL_ON_QUALITY = process.env.FANCY_FAIL_ON_QUALITY !== 'false';
const PUBLISH_RESULTS = process.env.FANCY_PUBLISH === 'true';

function cleanText(value: unknown): string {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim();
}

function toInt(value: unknown): number {
    const parsed = Number(
        String(value || '')
            .replace(/,/g, '')
            .trim()
    );
    return Number.isFinite(parsed) ? parsed : 0;
}

function parseFancyDate(value: string): string | null {
    const raw = cleanText(value).toUpperCase();
    const datePrefix = raw.match(/^(\d{1,2}[-\/ ][A-Z]{3}[-\/ ]\d{2,4}|\d{1,2}[-\/ ]\d{1,2}[-\/ ]\d{2,4})/);
    const t = datePrefix ? datePrefix[1] : raw;
    const m = t.match(/^(\d{1,2})[-\/ ]([A-Z]{3}|\d{1,2})[-\/ ](\d{2,4})$/);
    if (!m) return null;
    const day = Number(m[1]);
    const monthToken = m[2];
    const yearNum = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
    if (!Number.isFinite(day) || !Number.isFinite(yearNum)) return null;
    const monthMap: Record<string, number> = {
        JAN: 1,
        FEB: 2,
        MAR: 3,
        APR: 4,
        MAY: 5,
        JUN: 6,
        JUL: 7,
        AUG: 8,
        SEP: 9,
        OCT: 10,
        NOV: 11,
        DEC: 12,
    };
    const month = monthMap[monthToken] || Number(monthToken);
    if (!Number.isFinite(month) || month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${String(yearNum).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseRtoDisplay(text: string): { rtoCode: string; rtoName: string } {
    const t = cleanText(text);
    const m = t.match(/^(.+?)\s*\((\d{1,3})\)$/);
    if (!m) return { rtoCode: '', rtoName: t };
    return {
        rtoCode: normalizeRtoCode(`${STATE_CODE}${m[2]}`),
        rtoName: m[1].trim(),
    };
}

function normalizeRtoCode(code: string): string {
    const t = cleanText(code).toUpperCase();
    const m = t.match(/^([A-Z]{2})(\d{1,3})$/);
    if (!m) return t;
    const prefix = m[1];
    const num = Number(m[2]);
    if (!Number.isFinite(num)) return t;
    const width = prefix === 'MH' && num <= 99 ? 2 : 3;
    return `${prefix}${String(num).padStart(width, '0')}`;
}

async function primeSelect(page: Page, selectId: string, value: string) {
    const sel = page.locator(`select#${selectId}`);
    await sel.selectOption(value, { force: true });
    await sel.dispatchEvent('change');
}

async function openSeriesPageAndSetState(page: Page) {
    await page.goto(SERIES_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(1500);
    await primeSelect(page, 'ib_statestaus_input', STATE_CODE);
    await page.waitForTimeout(4500);
}

async function getRtoOptions(
    page: Page
): Promise<Array<{ value: string; label: string; rtoCode: string; rtoName: string }>> {
    const opts = await page.$$eval('#ib_rtostaus_input option', nodes =>
        nodes
            .map(n => ({
                value: n.getAttribute('value') || '',
                label: (n.textContent || '').replace(/\s+/g, ' ').trim(),
            }))
            .filter(n => n.value && n.value !== '-1' && n.label && !n.label.includes('Select RTO'))
    );

    const parsed = opts.map(o => {
        const parts = o.label.match(/^(.+?)\s*\((\d{1,3})\)$/);
        return {
            value: o.value,
            label: o.label,
            rtoCode: parts ? normalizeRtoCode(`${STATE_CODE}${parts[2]}`) : '',
            rtoName: parts ? parts[1].trim() : o.label,
        };
    });

    const filtered = parsed.filter(
        o => !!o.rtoCode && (!RTO_FILTER || o.rtoCode === RTO_FILTER || o.label.toUpperCase().includes(RTO_FILTER))
    );
    return filtered.slice(0, Math.max(0, MAX_RTOS));
}

async function parseSeriesRowsForRto(
    page: Page,
    rtoValue: string,
    rtoCode: string,
    rtoName: string
): Promise<SeriesStatusRow[]> {
    await primeSelect(page, 'ib_rtostaus_input', rtoValue);
    await page.waitForTimeout(4000);

    const rawRows = await page.$$eval('table tbody tr', trs =>
        trs
            .map(tr => [...tr.querySelectorAll('td')].map(td => (td.textContent || '').replace(/\s+/g, ' ').trim()))
            .filter(cols => cols.length >= 6)
    );

    return rawRows
        .map(cols => {
            const statusText = cleanText((cols[0] || '').replace(/^Series Id\s*:\s*/i, ''));
            const seriesName = cleanText((cols[1] || '').replace(/^Series Name\s*:\s*/i, ''));
            const openOnText = cleanText((cols[2] || '').replace(/^Open On\s*:\s*/i, ''));
            const seriesType = cleanText((cols[3] || '').replace(/^Series Type\s*:\s*/i, ''));
            const startRange = toInt((cols[4] || '').replace(/^Start range\s*:\s*/i, ''));
            const endRange = toInt((cols[5] || '').replace(/^End Range\s*:\s*/i, ''));
            const isActive = /active/i.test(statusText);
            return {
                stateCode: STATE_CODE,
                rtoCode,
                rtoName,
                seriesName,
                seriesType,
                statusText,
                isActive,
                startRange,
                endRange,
                openOnText,
            };
        })
        .filter(r => /2w/i.test(r.seriesType))
        .filter(r => (ONLY_ACTIVE ? r.isActive : true));
}

async function goToAvailablePage(page: Page) {
    await page.goto(AVAILABLE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(1500);
    await primeSelect(page, 'ib_state123_input', STATE_CODE);
    await page.waitForTimeout(4500);
}

async function resolveAvailableRtoValueByCode(page: Page, rtoCode: string): Promise<string | null> {
    const target = normalizeRtoCode(rtoCode);
    return page.$$eval(
        '#ib_rto123_input option',
        (ops, code) => {
            const pick = ops.find(o => {
                const txt = (o.textContent || '').replace(/\s+/g, ' ').trim();
                const m = txt.match(/\((\d{1,3})\)\s*$/);
                if (!m) return false;
                const n = Number(m[1]);
                if (!Number.isFinite(n)) return false;
                const mhCode = `MH${String(n).padStart(n <= 99 ? 2 : 3, '0')}`;
                return mhCode === code;
            });
            return pick ? pick.getAttribute('value') || null : null;
        },
        target
    );
}

async function setAvailableRto(page: Page, rtoCode: string) {
    const optionValue = await resolveAvailableRtoValueByCode(page, rtoCode);
    if (!optionValue) throw new Error(`RTO option not found on available page for ${rtoCode}`);

    await primeSelect(page, 'ib_rto123_input', optionValue);
    await page.waitForTimeout(5000);
    await page.waitForFunction(
        (target: string) => {
            const sel = document.querySelector('#ib_rto123_input') as HTMLSelectElement | null;
            if (!sel) return false;
            const txt = (sel.options[sel.selectedIndex]?.textContent || '').replace(/\s+/g, ' ').trim();
            const m = txt.match(/\((\d{1,3})\)\s*$/);
            if (!m) return false;
            const n = Number(m[1]);
            const code = `MH${String(n).padStart(n <= 99 ? 2 : 3, '0')}`;
            return code === target;
        },
        rtoCode,
        { timeout: 15000 }
    );
}

async function getSeriesOptionValue(page: Page, seriesName: string): Promise<string | null> {
    const upperSeries = seriesName.toUpperCase().trim();
    return page.$$eval(
        '#ib_Veh_Seri_input option',
        (ops, target) => {
            const match = ops.find(o => (o.textContent || '').replace(/\s+/g, ' ').toUpperCase().includes(target));
            return match ? match.getAttribute('value') || null : null;
        },
        upperSeries
    );
}

async function parseAvailableNumbers(
    page: Page
): Promise<{ firstOpenNumber: number | null; runningOpenCount: number; availableCount: number }> {
    const maxScanPages = Number(process.env.FANCY_SCAN_PAGES || '15');
    const minRunLen = Math.max(3, Number(process.env.FANCY_MIN_RUN_LEN || '5'));
    const maxRunGap = Math.max(1, Number(process.env.FANCY_MAX_RUN_GAP || '2'));
    const collectCurrentPage = async () =>
        page.evaluate(() => {
            const allNumbers: number[] = [];
            const nodes = Array.from(document.querySelectorAll('.ui-datagrid *'));
            for (const node of nodes) {
                const el = node as HTMLElement;
                if (!el || el.children.length > 0) continue;
                const text = (el.textContent || '').trim();
                const m = text.match(/(\d{4})/);
                if (!m) continue;
                const num = Number(m[1]);
                if (!Number.isFinite(num)) continue;

                allNumbers.push(num);
            }
            return { allNumbers };
        });

    const findBestRun = (values: number[]) => {
        let bestStart: number | null = null;
        let bestLen = 0;
        if (!values.length) return { bestStart, bestLen };
        let curStart = values[0];
        let curLen = 1;
        for (let i = 1; i < values.length; i++) {
            const gap = values[i] - values[i - 1];
            if (gap >= 1 && gap <= maxRunGap) {
                curLen += 1;
            } else {
                if (curLen >= minRunLen) {
                    const better = curLen > bestLen || (curLen === bestLen && curStart > (bestStart || 0));
                    if (better) {
                        bestLen = curLen;
                        bestStart = curStart;
                    }
                }
                curStart = values[i];
                curLen = 1;
            }
        }
        if (curLen >= minRunLen) {
            const better = curLen > bestLen || (curLen === bestLen && curStart > (bestStart || 0));
            if (better) {
                bestLen = curLen;
                bestStart = curStart;
            }
        }
        return { bestStart, bestLen };
    };

    const resolveChoice = (allValues: number[]) => {
        const all = Array.from(new Set(allValues)).sort((a, b) => a - b);
        const bestRun = findBestRun(all);
        let chosenStart: number | null = bestRun.bestStart;
        let chosenLen = bestRun.bestLen;

        if (chosenStart == null && all.length > 0) {
            const tail = all[all.length - 1];
            chosenStart = tail;
            chosenLen = 1;
        }

        return {
            all,
            bestRunStart: bestRun.bestStart,
            chosenStart,
            chosenLen,
        };
    };

    const allSet = new Set<number>();

    const first = await collectCurrentPage();
    first.allNumbers.forEach(n => allSet.add(n));

    let resolved = resolveChoice(Array.from(allSet));

    // Optimization requested: if 5-number sequence is already found on first page, stop.
    // Otherwise keep scanning pages until a running sequence appears.
    if (!(resolved.bestRunStart != null)) {
        for (let i = 1; i < maxScanPages; i++) {
            const nextBtn = page.locator('.ui-paginator-next').first();
            if (!(await nextBtn.isVisible())) break;
            const cls = (await nextBtn.getAttribute('class')) || '';
            if (cls.includes('ui-state-disabled')) break;
            await nextBtn.click({ force: true });
            await page.waitForTimeout(1100);
            const current = await collectCurrentPage();
            current.allNumbers.forEach(n => allSet.add(n));
            resolved = resolveChoice(Array.from(allSet));
            if (resolved.bestRunStart != null) break;
        }
    }

    return {
        firstOpenNumber: resolved.chosenStart,
        runningOpenCount: resolved.chosenLen || 0,
        availableCount: resolved.all.length,
    };
}

async function selectSeriesAndWaitForGrid(page: Page, optionValue: string): Promise<boolean> {
    await primeSelect(page, 'ib_Veh_Seri_input', optionValue);
    await page.waitForTimeout(800);
    try {
        await page.waitForFunction(
            () => {
                const spans = Array.from(document.querySelectorAll('.ui-datagrid *'));
                return spans.some(s => /\d{4}/.test((s.textContent || '').trim()));
            },
            { timeout: 12000 }
        );
        return true;
    } catch {
        return false;
    }
}

async function upsertToDb(rows: SeriesProgressRow[]) {
    if (!rows.length) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('WRITE_DB=true requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    const { adminClient } = await import('@/lib/supabase/admin');

    const today = new Date().toISOString().slice(0, 10);
    const payload = rows.map(r => ({
        snapshot_date: today,
        state_code: r.stateCode,
        rto_code: r.rtoCode,
        rto_name: r.rtoName,
        series_name: r.seriesName,
        series_type: r.seriesType,
        series_status: r.statusText,
        is_active: r.isActive,
        open_on_text: r.activeOnDate || null,
        active_on_date: r.activeOnDate || null,
        start_range: r.startRange,
        end_range: r.endRange,
        first_open_number: r.firstOpenNumber,
        filled_till: r.filledTill,
        running_open_count: r.runningOpenCount,
        available_count: r.availableCount,
        scraped_at: r.scrapedAt,
        run_id: currentRunId,
        published: false,
    }));

    const { error } = await (adminClient as any)
        .from('vahan_fancy_series_daily')
        .upsert(payload, { onConflict: 'snapshot_date,state_code,rto_code,series_name' });

    if (error) {
        throw new Error(`DB upsert failed: ${error.message || 'unknown error'}`);
    }
}

type RunQuality = {
    totalRtos: number;
    activeRtos: number;
    activeWithFilled: number;
    maxSameFilled: number;
    maxSameFilledValue: number | null;
    pass: boolean;
    notes: string[];
};

let currentRunId: string | null = null;

async function createRunRecord(expectedRtoCount: number): Promise<string> {
    const { adminClient } = await import('@/lib/supabase/admin');
    const snapshotDate = new Date().toISOString().slice(0, 10);
    const payload = {
        snapshot_date: snapshotDate,
        state_code: STATE_CODE,
        status: 'running',
        expected_rto_count: expectedRtoCount,
        processed_rto_count: 0,
        active_rto_count: 0,
        anomaly_count: 0,
        notes: '',
        started_at: new Date().toISOString(),
    };
    const { data, error } = await (adminClient as any)
        .from('vahan_fancy_series_runs')
        .insert(payload)
        .select('id')
        .single();
    if (error || !data?.id) {
        throw new Error(`Failed to create run record: ${error?.message || 'unknown error'}`);
    }
    return String(data.id);
}

async function completeRunRecord(runId: string, quality: RunQuality, published: boolean) {
    const { adminClient } = await import('@/lib/supabase/admin');
    const snapshotDate = new Date().toISOString().slice(0, 10);
    if (published) {
        const { error: clearErr } = await (adminClient as any)
            .from('vahan_fancy_series_runs')
            .update({ published: false })
            .eq('state_code', STATE_CODE)
            .eq('snapshot_date', snapshotDate)
            .neq('id', runId);
        if (clearErr)
            throw new Error(`Failed to clear previous published runs: ${clearErr.message || 'unknown error'}`);
    }
    const payload = {
        status: quality.pass ? 'success' : 'failed_quality',
        processed_rto_count: quality.totalRtos,
        active_rto_count: quality.activeRtos,
        anomaly_count: quality.maxSameFilled > MAX_SAME_FILLED ? 1 : 0,
        notes: quality.notes.join(' | '),
        published,
        finished_at: new Date().toISOString(),
    };
    const { error } = await (adminClient as any).from('vahan_fancy_series_runs').update(payload).eq('id', runId);
    if (error) throw new Error(`Failed to update run record: ${error.message || 'unknown error'}`);
}

async function publishRun(runId: string) {
    const { adminClient } = await import('@/lib/supabase/admin');
    const today = new Date().toISOString().slice(0, 10);
    // Step 1: Publish current run first (so UI never sees "no data" gap)
    const { error: publishError } = await (adminClient as any)
        .from('vahan_fancy_series_daily')
        .update({ published: true })
        .eq('state_code', STATE_CODE)
        .eq('snapshot_date', today)
        .eq('run_id', runId);
    if (publishError) throw new Error(`Publish step failed: ${publishError.message || 'unknown error'}`);

    // Step 2: Disable previous published rows for same day, excluding current run
    const { error: clearError } = await (adminClient as any)
        .from('vahan_fancy_series_daily')
        .update({ published: false })
        .eq('state_code', STATE_CODE)
        .eq('snapshot_date', today)
        .neq('run_id', runId);
    if (clearError) throw new Error(`Publish cleanup step failed: ${clearError.message || 'unknown error'}`);
}

function evaluateQuality(rows: SeriesProgressRow[]): RunQuality {
    const bestByRto = new Map<string, SeriesProgressRow>();
    for (const row of rows) {
        const code = normalizeRtoCode(row.rtoCode);
        const prev = bestByRto.get(code);
        if (!prev) {
            bestByRto.set(code, row);
            continue;
        }
        const prevFilled = Number(prev.filledTill || 0);
        const rowFilled = Number(row.filledTill || 0);
        const prevOpen = Number(prev.runningOpenCount || 0);
        const rowOpen = Number(row.runningOpenCount || 0);
        if (rowFilled > prevFilled || (rowFilled === prevFilled && rowOpen > prevOpen)) {
            bestByRto.set(code, row);
        }
    }

    const activeRows = Array.from(bestByRto.values()).filter(r => r.isActive);
    const activeWithFilled = activeRows.filter(r => Number.isFinite(r.filledTill as number));
    const sameFilled = new Map<number, number>();
    for (const row of activeWithFilled) {
        const v = Number(row.filledTill);
        sameFilled.set(v, (sameFilled.get(v) || 0) + 1);
    }
    let maxSameFilled = 0;
    let maxSameFilledValue: number | null = null;
    for (const [k, c] of sameFilled.entries()) {
        if (c > maxSameFilled) {
            maxSameFilled = c;
            maxSameFilledValue = k;
        }
    }

    const notes: string[] = [];
    if (activeRows.length < MIN_COVERAGE) notes.push(`coverage_low:${activeRows.length}<${MIN_COVERAGE}`);
    if (maxSameFilled > MAX_SAME_FILLED) notes.push(`same_filled_spike:${maxSameFilledValue}x${maxSameFilled}`);

    return {
        totalRtos: bestByRto.size,
        activeRtos: activeRows.length,
        activeWithFilled: activeWithFilled.length,
        maxSameFilled,
        maxSameFilledValue,
        pass: notes.length === 0,
        notes,
    };
}

function chunkArray<T>(items: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
}

async function verifyBatchInDb(rows: SeriesProgressRow[]) {
    if (!rows.length || !WRITE_DB) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('WRITE_DB=true requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    const { adminClient } = await import('@/lib/supabase/admin');

    const today = new Date().toISOString().slice(0, 10);
    const batchRtoCodes = Array.from(new Set(rows.map(r => r.rtoCode)));

    const query = (adminClient as any)
        .from('vahan_fancy_series_daily')
        .select('rto_code')
        .eq('state_code', STATE_CODE)
        .eq('snapshot_date', today)
        .in('rto_code', batchRtoCodes);
    if (currentRunId) query.eq('run_id', currentRunId);
    const { data, error } = await query;

    if (error) throw new Error(`Batch verify failed: ${error.message || 'unknown error'}`);

    const present = new Set((Array.isArray(data) ? data : []).map((r: any) => String(r.rto_code || '').toUpperCase()));
    const missing = batchRtoCodes.filter(c => !present.has(c));
    if (missing.length) {
        const msg = `Batch verify missing RTO rows: ${missing.join(', ')}`;
        if (STRICT_BATCH_VERIFY) throw new Error(msg);
        console.warn(msg);
    } else {
        console.log(`Batch verify OK: ${batchRtoCodes.length}/${batchRtoCodes.length} RTOs persisted for ${today}`);
    }
}

async function main() {
    const browser = await chromium.launch({ headless: HEADLESS });
    const page = await browser.newPage();
    const startedAt = new Date().toISOString();

    try {
        console.log(`Starting fancy series scrape for ${STATE_NAME} (${STATE_CODE})`);
        await openSeriesPageAndSetState(page);
        const rtos = await getRtoOptions(page);
        console.log(`RTOs to process: ${rtos.length}`);
        if (WRITE_DB) {
            currentRunId = await createRunRecord(rtos.length);
            console.log(`Run created: ${currentRunId}`);
        }

        const batches = chunkArray(rtos, BATCH_SIZE);
        const progressRows: SeriesProgressRow[] = [];
        for (let bi = 0; bi < batches.length; bi++) {
            const batch = batches[bi];
            console.log(`\nBatch ${bi + 1}/${batches.length} | RTOs: ${batch.map(r => r.rtoCode).join(', ')}`);

            const statusRowsByRto = new Map<string, SeriesStatusRow[]>();
            for (const rto of batch) {
                const rows = await parseSeriesRowsForRto(page, rto.value, rto.rtoCode, rto.rtoName);
                statusRowsByRto.set(rto.value, rows);
                console.log(`[${rto.rtoCode}] 2W series rows: ${rows.length}`);
            }

            const batchProgressRows: SeriesProgressRow[] = [];
            for (const rto of batch) {
                const seriesRows = statusRowsByRto.get(rto.value) || [];
                if (!seriesRows.length) continue;

                // Critical: Fancy portal keeps stale grid state across RTO changes.
                // Always reload available page and re-select state/RTO for each RTO.
                await goToAvailablePage(page);
                await setAvailableRto(page, rto.rtoCode);

                for (const row of seriesRows) {
                    const optionValue = await getSeriesOptionValue(page, row.seriesName);
                    if (!optionValue) {
                        batchProgressRows.push({
                            ...row,
                            firstOpenNumber: null,
                            filledTill: null,
                            runningOpenCount: 0,
                            availableCount: 0,
                            activeOnDate: parseFancyDate(row.openOnText),
                            scrapedAt: new Date().toISOString(),
                        });
                        continue;
                    }

                    const hasGrid = await selectSeriesAndWaitForGrid(page, optionValue);
                    let parsed = hasGrid
                        ? await parseAvailableNumbers(page)
                        : { firstOpenNumber: null, runningOpenCount: 0, availableCount: 0 };
                    if (hasGrid && parsed.availableCount === 0) {
                        await page.waitForTimeout(2000);
                        parsed = await parseAvailableNumbers(page);
                    }
                    const filledTill =
                        parsed.firstOpenNumber && row.startRange > 0
                            ? Math.max(row.startRange - 1, parsed.firstOpenNumber - 1)
                            : null;

                    batchProgressRows.push({
                        ...row,
                        firstOpenNumber: parsed.firstOpenNumber,
                        filledTill,
                        runningOpenCount: parsed.runningOpenCount,
                        availableCount: parsed.availableCount,
                        activeOnDate: parseFancyDate(row.openOnText),
                        scrapedAt: new Date().toISOString(),
                    });
                }
            }

            progressRows.push(...batchProgressRows);

            if (WRITE_DB && batchProgressRows.length) {
                await upsertToDb(batchProgressRows);
                console.log(`Batch upserted ${batchProgressRows.length} rows`);
                await verifyBatchInDb(batchProgressRows);
            }

            if (bi < batches.length - 1) {
                await openSeriesPageAndSetState(page);
            }
        }

        const out = {
            startedAt,
            finishedAt: new Date().toISOString(),
            stateCode: STATE_CODE,
            stateName: STATE_NAME,
            onlyActive: ONLY_ACTIVE,
            rtoCount: rtos.length,
            seriesCount: progressRows.length,
            rows: progressRows,
        };

        const outPath = path.join(process.cwd(), 'tmp', `fancy-series-${STATE_CODE.toLowerCase()}-${Date.now()}.json`);
        await fs.mkdir(path.dirname(outPath), { recursive: true });
        await fs.writeFile(outPath, JSON.stringify(out, null, 2), 'utf8');
        console.log(`Saved JSON: ${outPath}`);

        if (WRITE_DB) {
            const quality = evaluateQuality(progressRows);
            console.log(
                `Quality: active=${quality.activeRtos}, active_with_filled=${quality.activeWithFilled}, max_same_filled=${quality.maxSameFilledValue}:${quality.maxSameFilled}`
            );
            let published = false;
            if (quality.pass && PUBLISH_RESULTS) {
                await publishRun(currentRunId as string);
                published = true;
                console.log('Published current run snapshot');
            } else if (quality.pass && !PUBLISH_RESULTS) {
                console.log('Quality pass, but publish skipped (FANCY_PUBLISH=false)');
            } else {
                console.error(`Quality gates failed: ${quality.notes.join(', ')}`);
                if (FAIL_ON_QUALITY) {
                    await completeRunRecord(currentRunId as string, quality, false);
                    throw new Error(`Quality validation failed: ${quality.notes.join(', ')}`);
                }
            }
            await completeRunRecord(currentRunId as string, quality, published);
            console.log(`All batches completed. Total rows processed: ${progressRows.length}`);
        }

        // quick pointer log for active 2W rows
        const pointers = progressRows
            .filter(r => r.isActive)
            .map(
                r =>
                    `${r.rtoCode} ${r.seriesName} -> firstOpen=${r.firstOpenNumber ?? 'NA'} filledTill=${r.filledTill ?? 'NA'}`
            );
        pointers.slice(0, 20).forEach(p => console.log(p));
    } finally {
        await browser.close();
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
