import { execSync } from 'child_process';
import fs from 'fs';

function run() {
    try {
        console.log('Listing migrations...');
        const output = execSync('npx supabase migration list', { encoding: 'utf8' });
        const lines = output.split('\n');

        // Find migrations that are Remote only (Middle column exists, Left column empty)
        const remoteOnly = lines
            .filter(line => line.includes('|') && !line.includes('Local'))
            .map(line => {
                const parts = line.split('|').map(p => p.trim());
                if (parts.length >= 2 && parts[0] === '' && parts[1] !== '') {
                    return parts[1];
                }
                return null;
            })
            .filter(Boolean) as string[];

        console.log(`Found ${remoteOnly.length} remote-only migrations to repair.`);

        for (const id of remoteOnly) {
            console.log(`Repairing migration ${id} as applied...`);
            try {
                execSync(`npx supabase migration repair --status applied ${id}`, { stdio: 'inherit' });
            } catch (e) {
                console.error(`Failed to repair ${id}, skipping...`);
            }
        }

        console.log('Done repairing.');
    } catch (error) {
        console.error('Fatal error:', error);
    }
}

run();
