import { adminClient } from './src/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

async function executeMigration(filePath: string) {
    console.log(`Reading migration: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // We can't run raw SQL via the client easily unless we have a helper
    // or use a specific RPC.
    // Since I can't find an exec_sql rpc, I'll check the database for one first.

    console.log('Attempting to execute via adminClient.rpc("exec_sql")...');
    const { data, error } = await adminClient.rpc('exec_sql' as any, { query: sql });

    if (error) {
        console.error('Execution failed:', error);
        return false;
    }
    console.log('Success!');
    return true;
}

const migrationFile = process.argv[2];
if (!migrationFile) {
    console.error('Please provide a migration file path.');
    process.exit(1);
}

executeMigration(path.resolve(migrationFile))
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
