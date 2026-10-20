import { defineConfig, devices } from '@playwright/test';

const KC_URL = process.env['KEYCLOAK_URL'] ?? 'http://localhost:8080';
const KC_REALM = process.env['KEYCLOAK_REALM'] ?? 'MYB';
const KC_CLIENT = process.env['KEYCLOAK_CLIENT_ID'] ?? 'MYB-client';

export const KEYCLOAK = { url: KC_URL, realm: KC_REALM, clientId: KC_CLIENT };

export default defineConfig({
  testDir: './e2e-visual',
  snapshotDir: './__screenshots__',
  outputDir: './e2e-visual-results',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : 2,
  reporter: [['html', { outputFolder: 'e2e-visual-report' }], ['list']],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Auth setup runs first
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    // Admin app — desktop
    {
      name: 'admin-desktop',
      testMatch: /admin\/.+\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:4200',
        storageState: 'e2e-visual/.auth/syndic.json',
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ['setup'],
    },

    // Admin app — mobile
    {
      name: 'admin-mobile',
      testMatch: /admin\/.+\.spec\.ts/,
      use: {
        ...devices['iPhone 14'],
        baseURL: 'http://localhost:4200',
        storageState: 'e2e-visual/.auth/syndic.json',
      },
      dependencies: ['setup'],
    },

    // Client (owner portal) — desktop
    {
      name: 'client-desktop',
      testMatch: /client\/.+\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:4300',
        storageState: 'e2e-visual/.auth/owner.json',
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ['setup'],
    },

    // Client — mobile
    {
      name: 'client-mobile',
      testMatch: /client\/.+\.spec\.ts/,
      use: {
        ...devices['iPhone 14'],
        baseURL: 'http://localhost:4300',
        storageState: 'e2e-visual/.auth/owner.json',
      },
      dependencies: ['setup'],
    },
  ],
});
