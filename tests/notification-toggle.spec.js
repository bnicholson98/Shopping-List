// @ts-check
const { test, expect } = require('@playwright/test');

/*
  Strategy
  --------
  We mock browser APIs so the notification bell renders, then inject a
  *5-second delay* into serviceWorker.getRegistration().

  - With the optimistic-UI fix the toggle flips BEFORE that 5 s call → passes
    the 500 ms assertion.
  - Without the fix the toggle waits for the full call chain → times out.
*/

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    /* ── 1. Force standalone display-mode (bypass PWA gate) ── */
    const _matchMedia = window.matchMedia.bind(window);
    window.matchMedia = (q) => {
      if (q.includes('standalone')) {
        return {
          matches: true, media: q,
          addEventListener() {}, removeEventListener() {},
          addListener() {},       removeListener() {},
          onchange: null, dispatchEvent() { return false; },
        };
      }
      return _matchMedia(q);
    };

    /* ── 2. Mock Notification API ── */
    // @ts-ignore
    window.Notification = class MockNotification {
      static permission = 'default';
      static requestPermission() {
        MockNotification.permission = 'granted';
        return Promise.resolve('granted');
      }
    };

    /* ── 3. Ensure PushManager exists (isSupported check) ── */
    if (!window.PushManager) window.PushManager = /** @type {any} */ (class {});

    /* ── 4. Delay getRegistration by 5 s — the timing wedge ── */
    if (navigator.serviceWorker) {
      const _getReg = navigator.serviceWorker.getRegistration.bind(
        navigator.serviceWorker,
      );
      navigator.serviceWorker.getRegistration = () =>
        new Promise((resolve) =>
          setTimeout(() => _getReg().then(resolve, () => resolve(undefined)), 5000),
        );
    }
  });
});

test('subscribe toggle flips immediately (optimistic UI)', async ({ page }) => {
  await page.goto('/');

  /* Open the notification panel */
  const bell = page.getByRole('button', { name: 'Notification settings' });
  await expect(bell).toBeVisible({ timeout: 10000 });
  await bell.click();

  /* Target the "Item added" toggle by its label text */
  const toggle = page
    .locator('label', { hasText: 'Item added' })
    .locator('[role="switch"]');

  await expect(toggle).toHaveAttribute('aria-checked', 'false');

  /* Click to subscribe — the moment of truth */
  await toggle.click();

  /*
    500 ms timeout.  The mocked getRegistration takes 5 000 ms, so:
      ✔  With optimistic update → flips in < 50 ms   → PASSES
      ✘  Without it            → blocked for ≥ 5 000 ms → FAILS
  */
  await expect(toggle).toHaveAttribute('aria-checked', 'true', { timeout: 500 });
});