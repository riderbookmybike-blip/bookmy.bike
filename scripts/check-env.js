const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
];

const productionEnvs = [
    'MIGRATION_PASSWORD_SECRET',
    'MSG91_AUTH_KEY',
    'MSG91_TEMPLATE_ID',
];

function checkEnv() {
    const isProduction = process.env.NODE_ENV === 'production';
    const missing = [];

    // Always check core envs
    requiredEnvs.forEach((key) => {
        if (!process.env[key]) {
            missing.push(key);
        }
    });

    // Check production-only envs
    if (isProduction) {
        productionEnvs.forEach((key) => {
            if (!process.env[key]) {
                missing.push(key);
            }
        });
    }

    if (missing.length > 0) {
        console.error('\x1b[31m%s\x1b[0m', 'CRITICAL: Missing required environment variables:');
        missing.forEach((key) => {
            console.error(`  - ${key}`);
        });
        console.error('\nPlease add these to your environment configuration.');
        process.exit(1);
    }

    console.log('\x1b[32m%s\x1b[0m', '✓ Environment configuration valid.');
}

checkEnv();
