'use server';

import { execSync } from 'child_process';

interface GitStatus {
    uncommitted: number;
    unpushed: number;
    lastCommitTime: number; // Unix timestamp
    isLocalhost: boolean;
}

export async function getGitStatus(): Promise<GitStatus> {
    // This action should only run and return meaningful data in development
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev) {
        return { uncommitted: 0, unpushed: 0, lastCommitTime: 0, isLocalhost: false };
    }

    try {
        // Count uncommitted changes (tracked and untracked)
        // git status --porcelain returns one line per change
        const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
        const uncommittedCount = statusOutput.trim() ? statusOutput.trim().split('\n').length : 0;

        // Count unpushed commits relative to origin/main
        // This might fail if origin/main is not fetched or doesn't exist locally
        let unpushedCount = 0;
        try {
            const revListOutput = execSync('git rev-list --count origin/main..HEAD', { encoding: 'utf8' });
            unpushedCount = parseInt(revListOutput.trim(), 10) || 0;
        } catch (e) {
            // If origin/main isn't found, we just return 0 for unpushed
        }

        // Get last commit timestamp
        let lastCommitTime = 0;
        try {
            const timeOutput = execSync('git log -1 --format=%ct', { encoding: 'utf8' });
            lastCommitTime = parseInt(timeOutput.trim(), 10) * 1000; // Convert to ms
        } catch (e) {}

        return {
            uncommitted: uncommittedCount,
            unpushed: unpushedCount,
            lastCommitTime,
            isLocalhost: true,
        };
    } catch (error) {
        console.error('Failed to get git status:', error);
        return { uncommitted: 0, unpushed: 0, lastCommitTime: 0, isLocalhost: true };
    }
}
