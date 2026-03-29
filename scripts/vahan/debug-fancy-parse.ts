import { chromium } from 'playwright';

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

async function primeSelect(page: any, id: string, value: string) {
    const sel = page.locator(`select#${id}`);
    await sel.selectOption(value, { force: true });
    await sel.dispatchEvent('change');
}

async function run(rto = '48') {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://fancy.parivahan.gov.in/fancy/faces/public/availableAllNumbers.xhtml', {
        waitUntil: 'domcontentloaded',
        timeout: 120000,
    });
    await wait(2000);
    await primeSelect(page, 'ib_state123_input', 'MH');
    await wait(4500);
    await primeSelect(page, 'ib_rto123_input', rto);
    await wait(5500);

    const options = await page.$$eval('#ib_Veh_Seri_input option', (ops: HTMLOptionElement[]) =>
        ops
            .map(o => ({ value: o.getAttribute('value') || '', text: (o.textContent || '').trim() }))
            .filter(o => o.value && o.value !== '-1')
    );
    const selected = options[0] || null;
    if (selected) {
        await primeSelect(page, 'ib_Veh_Seri_input', selected.value);
        await wait(7000);
    }

    const debug = await page.evaluate(() => {
        const numNodes = Array.from(document.querySelectorAll('*'))
            .map(el => {
                const txt = (el.textContent || '').trim();
                if (!/^\d{4}$/.test(txt)) return null;
                const st = getComputedStyle(el);
                const parent = el.parentElement;
                const pst = parent ? getComputedStyle(parent) : null;
                return {
                    tag: el.tagName,
                    className: String((el as HTMLElement).className || ''),
                    text: txt,
                    color: st.color,
                    bg: st.backgroundColor,
                    border: st.borderColor,
                    pTag: parent ? parent.tagName : '',
                    pClass: parent ? String((parent as HTMLElement).className || '') : '',
                    pColor: pst ? pst.color : '',
                    pBg: pst ? pst.backgroundColor : '',
                    pBorder: pst ? pst.borderColor : '',
                };
            })
            .filter(Boolean)
            .slice(0, 300);

        const styleBuckets = new Map<string, number>();
        for (const n of numNodes as any[]) {
            const k = `${n.color}|${n.bg}|${n.pColor}|${n.pBg}|${n.pClass}`;
            styleBuckets.set(k, (styleBuckets.get(k) || 0) + 1);
        }

        const htmlSnippet =
            (document.querySelector('.ui-datagrid-content') || document.body).innerHTML.slice(0, 4000) || '';

        return {
            title: document.title,
            seriesSelectValue: ((document.querySelector('#ib_Veh_Seri_input') as HTMLSelectElement | null)?.value ||
                null) as string | null,
            count4DigitNodes: numNodes.length,
            styleBuckets: Array.from(styleBuckets.entries()).slice(0, 30),
            sample: (numNodes as any[]).slice(0, 80),
            htmlSnippet,
        };
    });

    console.log(JSON.stringify({ rto, selected, options: options.slice(0, 8), debug }, null, 2));
    await browser.close();
}

const rto = process.argv[2] || '48';
run(rto).catch(err => {
    console.error(err);
    process.exit(1);
});
