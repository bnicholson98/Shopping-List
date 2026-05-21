const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
  },
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: true,
    env: { BROWSER: 'none' },
  },
});