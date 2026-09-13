import { defineConfig, devices } from '@playwright/test'

// Default 3002 for a dedicated test server; set PLAYWRIGHT_PORT=3000 to reuse `npm run dev`.
const devPort = process.env.PLAYWRIGHT_PORT ?? '3002'
const defaultBase = process.env.PLAYWRIGHT_TEST_BASE_URL ?? `http://127.0.0.1:${devPort}`
const useProdServer =
  process.env.PLAYWRIGHT_NEXT_START === '1' || process.env.CI === 'true'

/**
 * Playwright E2E config for Next.js.
 * Set PLAYWRIGHT_NEXT_START=1 and run `next build` first to use `next start` (closer to production hydration).
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    // Default 3002 so Playwright’s webServer does not collide with a normal `next dev` on 3000.
    baseURL: defaultBase,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1'
    ? undefined
    : {
    command: useProdServer
      ? `npx next start -p ${devPort}`
      : `npx next dev -p ${devPort}`,
    url: defaultBase,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
