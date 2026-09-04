// test/e2e/pwa.spec.js
const { test, expect } = require('@playwright/test');

test.describe('PWA: Offline-Betrieb', () => {
  test('Manifest und Service Worker sind verlinkt', async ({ page }) => {
    await page.goto('http://localhost:8080');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBe('manifest.webmanifest');

    const manifestResponse = await page.request.get('http://localhost:8080/manifest.webmanifest');
    expect(manifestResponse.ok()).toBeTruthy();
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe('Schnechnen');
    expect(manifest.display).toBe('standalone');

    const swResponse = await page.request.get('http://localhost:8080/sw.js');
    expect(swResponse.ok()).toBeTruthy();
  });

  test('Spiel bleibt nach Reload offline spielbar', async ({ browser }) => {
    // Eigener Context mit erlaubten Service Workern (global per Playwright-Config
    // geblockt, damit sie die übrigen Tests nicht beeinflussen).
    const context = await browser.newContext({ serviceWorkers: 'allow' });
    const page = await context.newPage();

    // Ohne "?e2e-test" navigieren, damit script.js den Service Worker registriert
    // (die Registrierung wird im Test-Modus übersprungen).
    await page.goto('http://localhost:8080/');

    await page.waitForFunction(() => (
      navigator.serviceWorker && navigator.serviceWorker.controller !== null
    ), { timeout: 15000 });

    // Alle Netzwerk-Requests kappen, um "kein Netz" zu simulieren. Playwrights
    // context.setOffline() greift auf CDP-Ebene *vor* dem Service Worker und
    // verhindert damit auch gecachte Antworten - deshalb wird hier stattdessen
    // jeder Request abgebrochen, sobald er das Netzwerk erreichen würde. Von der
    // App-Shell bedient der Service Worker alles aus dem Cache, bevor es soweit kommt.
    await page.route('**/*', (route) => route.abort());

    await page.reload();

    await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);

    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem', { timeout: 5000 });
    await expect(page.locator('#game-screen')).not.toHaveClass(/hidden/);

    await page.click('.dial-btn[data-value="5"]');
    await expect(page.locator('#user-answer')).toHaveText('5');

    await context.close();
  });
});
