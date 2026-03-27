import fs from 'node:fs/promises';
import path from 'node:path';
import { parseVahanWorkbookFile } from '@/lib/server/vahan/parser';

async function main() {
    const inputFiles = process.argv.slice(2);
    if (inputFiles.length === 0) {
        throw new Error('Usage: tsx scripts/vahan/build-seed.ts <xlsx1> <xlsx2> ...');
    }

    const parsedSheets = inputFiles.map(filePath => parseVahanWorkbookFile(path.resolve(filePath)));
    const rows = parsedSheets.flatMap(sheet => sheet.rows);

    const payload = {
        generatedAt: new Date().toISOString(),
        rows,
        years: Array.from(new Set(rows.map(r => r.year))).sort((a, b) => a - b),
        axes: Array.from(new Set(rows.map(r => r.axis))).sort(),
    };

    const outputPath = path.resolve('src/data/vahan/mh_two_wheeler_seed.json');
    await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    console.log(`Seed file written: ${outputPath}`);
    console.log(`Rows: ${rows.length}`);
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
