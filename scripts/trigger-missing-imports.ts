
// scripts/trigger-missing-imports.ts
import fs from 'fs';
import path from 'path';

async function run() {
    console.log('🚀 Starting Automated Bulk Import for MISSING collections...');

    // 1. Read Report
    const reportPath = path.join(process.cwd(), 'report.json');
    if (!fs.existsSync(reportPath)) {
        console.error('❌ report.json not found!');
        process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const missing = report.raw.filter((r: any) => !r.match && r.fbCount > 0);

    console.log(`Found ${missing.length} missing/incomplete collections.`);

    // 2. Trigger Imports Sequentially (to avoid overwhelming server/network)
    for (const item of missing) {
        const collectionPath = item.path;
        console.log(`\n📦 Importing: ${collectionPath} (Missing: ${item.fbCount - item.sbCount})`);

        try {
            const url = `http://localhost:3000/api/run-migration?collection=${encodeURIComponent(collectionPath)}`;
            const res = await fetch(url);
            const json = await res.json();

            if (json.success) {
                console.log(`   ✅ Done. Imported ${json.count} docs.`);
            } else {
                console.error(`   ❌ Failed: ${json.error}`);
            }
        } catch (e: any) {
            console.error(`   ❌ Network/Script Error: ${e.message}`);
        }
    }

    console.log('\n✨ All operations completed.');
}

run();
