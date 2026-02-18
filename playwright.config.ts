import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'desktop-chrome',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile-safari',
            use: { ...devices['iPhone 14'] },
        },
    ],
    webServer: process.env.CI
        ? undefined
        : {
              command: 'npm run dev',
              url: 'http://localhost:3000',
              reuseExistingServer: true,
              timeout: 60_000,
          },
});
