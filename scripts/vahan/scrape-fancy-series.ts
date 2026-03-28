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
        rtoCode: `${STATE_CODE}${m[2]}`,
        rtoName: m[1].trim(),
    };
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
            rtoCode: parts ? `${STATE_CODE}${parts[2]}` : '',
            rtoName: parts ? parts[1].trim() : o.label,
        };
    });

    const filtered = parsed.filter(
        o => !RTO_FILTER || o.rtoCode === RTO_FILTER || o.label.toUpperCase().includes(RTO_FILTER)
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

async function setAvailableRto(page: Page, rtoValue: string) {
    await primeSelect(page, 'ib_rto123_input', rtoValue);
    await page.waitForTimeout(5000);
}

async function getSeriesOptionValue(page: Page, seriesName: string): Promise<string | null> {
    const upperSeries = seriesName.toUpperCase();
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

    const parseCurrentPage = async () =>
        page.evaluate(() => {
            const allNumbers: number[] = [];
            const runningNumbers: number[] = [];
            const nodes = Array.from(document.querySelectorAll('.ui-datagrid *'));
            for (const node of nodes) {
                const el = node as HTMLElement;
                if (!el || el.children.length > 0) continue;
                const text = (el.textContent || '').trim();
                const m = text.match(/(\d{4})/);
                if (!m) continue;
                const num = Number(m[1]);
                if (!Number.isFinite(num)) continue;

                const st = window.getComputedStyle(el);
                const color = st.color || '';
                const cm = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
                const isLightText = !!cm && Number(cm[1]) > 220 && Number(cm[2]) > 220 && Number(cm[3]) > 220;

                let bg = st.backgroundColor || '';
                let cursor: HTMLElement | null = el;
                for (let i = 0; i < 4; i++) {
                    if (!cursor) break;
                    const cst = window.getComputedStyle(cursor);
                    if (cst.backgroundColor && !/rgba?\(0,\s*0,\s*0,\s*0\)/i.test(cst.backgroundColor)) {
                        bg = cst.backgroundColor;
                        break;
                    }
                    cursor = cursor.parentElement;
                }
                const mm = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
                const isOrange = !!mm && Number(mm[1]) > 180 && Number(mm[2]) > 90 && Number(mm[3]) < 120;

                allNumbers.push(num);
                // Rule: orange chips ignored + white-text labels ignored. Keep only running/green pool.
                const likelyRunning = !isOrange && !isLightText;
                if (likelyRunning) runningNumbers.push(num);
            }

            const all = Array.from(new Set(allNumbers)).sort((a, b) => a - b);
            const running = Array.from(new Set(runningNumbers)).sort((a, b) => a - b);
            return {
                firstOpenNumber: running.length > 0 ? running[0] : null,
                runningOpenCount: running.length,
                availableCount: all.length,
            };
        });

    let best = await parseCurrentPage();
    if (best.firstOpenNumber != null) return best;

    for (let i = 1; i < maxScanPages; i++) {
        const nextBtn = page.locator('.ui-paginator-next').first();
        if (!(await nextBtn.isVisible())) break;
        const cls = (await nextBtn.getAttribute('class')) || '';
        if (cls.includes('ui-state-disabled')) break;

        await nextBtn.click({ force: true });
        await page.waitForTimeout(1100);
        const current = await parseCurrentPage();
        if (current.firstOpenNumber != null) {
            return current;
        }
        best = current;
    }

    return best;
}

async function selectSeriesAndWaitForGrid(page: Page, optionValue: string): Promise<boolean> {
    await primeSelect(page, 'ib_Veh_Seri_input', optionValue);
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
    }));

    const { error } = await (adminClient as any)
        .from('vahan_fancy_series_daily')
        .upsert(payload, { onConflict: 'snapshot_date,state_code,rto_code,series_name' });

    if (error) {
        throw new Error(`DB upsert failed: ${error.message || 'unknown error'}`);
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

        const statusRowsByRto = new Map<string, SeriesStatusRow[]>();
        for (const rto of rtos) {
            const rows = await parseSeriesRowsForRto(page, rto.value, rto.rtoCode, rto.rtoName);
            statusRowsByRto.set(rto.value, rows);
            console.log(`[${rto.rtoCode}] 2W series rows: ${rows.length}`);
        }

        await goToAvailablePage(page);

        const progressRows: SeriesProgressRow[] = [];
        for (const rto of rtos) {
            const seriesRows = statusRowsByRto.get(rto.value) || [];
            if (!seriesRows.length) continue;

            await setAvailableRto(page, rto.value);

            for (const row of seriesRows) {
                const optionValue = await getSeriesOptionValue(page, row.seriesName);
                if (!optionValue) {
                    progressRows.push({
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

                progressRows.push({
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
            await upsertToDb(progressRows);
            console.log(`Upserted ${progressRows.length} rows into public.vahan_fancy_series_daily`);
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
