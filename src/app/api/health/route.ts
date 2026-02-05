import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Health check endpoint for infrastructure monitoring
export async function GET() {
    const startTime = Date.now();

    const checks = {
        timestamp: new Date().toISOString(),
        status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV,
        checks: {
            supabase: { status: 'unknown', latency: 0 },
            env: { status: 'unknown', missing: [] as string[] },
            cache: { status: 'unknown' },
        },
    };

    // 1. Environment Variable Check
    const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

    const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
    checks.checks.env = {
        status: missingEnvVars.length === 0 ? 'ok' : 'error',
        missing: missingEnvVars,
    };

    // 2. Supabase Connection Check
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const pingStart = Date.now();

            // Simple query to verify connection
            const { error } = await supabase.from('id_tenants').select('id').limit(1).single();

            const pingLatency = Date.now() - pingStart;

            checks.checks.supabase = {
                status: error ? 'degraded' : 'ok',
                latency: pingLatency,
            };
        } else {
            checks.checks.supabase = { status: 'error', latency: 0 };
        }
    } catch (err) {
        checks.checks.supabase = { status: 'error', latency: 0 };
    }

    // 3. Cache Revalidation Secret Check
    checks.checks.cache = {
        status: process.env.REVALIDATE_SECRET ? 'ok' : 'warning',
    };

    // Determine overall status
    const hasErrors = Object.values(checks.checks).some(c => c.status === 'error');
    const hasWarnings = Object.values(checks.checks).some(c => c.status === 'degraded' || c.status === 'warning');

    checks.status = hasErrors ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';

    const totalLatency = Date.now() - startTime;

    return NextResponse.json(
        { ...checks, totalLatency },
        {
            status: checks.status === 'healthy' ? 200 : checks.status === 'degraded' ? 200 : 503,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        }
    );
}
