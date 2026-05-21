const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const _mm = window.matchMedia.bind(window);
    window.matchMedia = (q) => {
      if (q.includes('standalone'))
        return { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent() { return false; } };
      return _mm(q);
    };

    window.Notification = class N {
      static permission = 'default';
      static requestPermission() { N.permission = 'granted'; return Promise.resolve('granted'); }
    };

    if (!window.PushManager) window.PushManager = class {};

    if (navigator.serviceWorker) {
      const _gr = navigator.serviceWorker.getRegistration.bind(navigator.serviceWorker);
      navigator.serviceWorker.getRegistration = () =>
        new Promise(r => setTimeout(() => _gr().then(r, () => r(undefined)), 5000));
    }
  });
});

test('clicking All subscribes with every toggle ON', async ({ page }) => {
  await page.goto('/');

  const bell = page.getByRole('button', { name: 'Notification settings' });
  await expect(bell).toBeVisible({ timeout: 10000 });
  await bell.click();

  const allToggle    = page.locator('label', { hasText: 'All' }).locator('[role="switch"]');
  const addToggle    = page.locator('label', { hasText: 'Item added' }).locator('[role="switch"]');
  const removeToggle = page.locator('label', { hasText: 'Item checked off' }).locator('[role="switch"]');

  // starts off
  await expect(allToggle).toHaveAttribute('aria-checked', 'false');
  await expect(addToggle).toHaveAttribute('aria-checked', 'false');
  await expect(removeToggle).toHaveAttribute('aria-checked', 'false');

  // one click on All
  await allToggle.click();

  // all three must flip on within 500 ms (well before the 5 s SW mock)
  await expect(allToggle).toHaveAttribute('aria-checked', 'true', { timeout: 500 });
  await expect(addToggle).toHaveAttribute('aria-checked', 'true', { timeout: 500 });
  await expect(removeToggle).toHaveAttribute('aria-checked', 'true', { timeout: 500 });
});