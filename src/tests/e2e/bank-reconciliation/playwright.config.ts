/**
 * Playwright e2e tests for bank-reconciliation Angular component.
 *
 * Run from src/front/myb.front (where @playwright/test is installed):
 *   cd src/front/myb.front
 *   npx playwright test --config=../../tests/e2e/bank-reconciliation/playwright.config.ts
 *   npx playwright test --config=../../tests/e2e/bank-reconciliation/playwright.config.ts --ui
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 1,
  timeout: 60_000,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? 'github' : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:4300',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Don't navigate to external Keycloak (all mocked via page.route)
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  // Start the Angular dev server before running tests
  webServer: {
    command: 'npx nx run admin:serve --port 4300',
    url: 'http://localhost:4300',
    reuseExistingServer: true,
    timeout: 120_000,
    cwd: '../../../front/myb.front',
  },
});
