/**
 * Playwright Configuration
 */

module.exports = {
    testDir: '.',
    timeout: 60000,
    expect: {
        timeout: 10000
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'https://productdescriptions.io',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...require('@playwright/test').devices['Desktop Chrome'],
            },
        },
        {
            name: 'Mobile Chrome',
            use: {
                ...require('@playwright/test').devices['iPhone 15'],
            },
        },
    ],
};