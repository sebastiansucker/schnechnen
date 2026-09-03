// test/e2e/back-navigation.spec.js
// Regressionstests für Issue #33: Browser-Zurück während des Spiels
const { test, expect } = require('@playwright/test');

test.describe('Browser-Zurück während des Spiels (Issue #33)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      window.__TEST_MODE__ = true;
    });
  });

  test('Timer stoppt und Spiel wird nicht gewertet, wenn per Browser-Zurück verlassen', async ({ page }) => {
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem', { timeout: 5000 });
    await expect(page.locator('#game-screen')).toBeVisible();

    await page.goBack();

    // Start-Screen sollte wieder sichtbar sein
    await expect(page.locator('#start-screen')).toBeVisible();
    await expect(page.locator('#game-screen')).toBeHidden();

    // Ehemals 60s Timer: nach kurzem Warten darf die App NICHT von selbst
    // auf den Ergebnisbildschirm springen (Timer muss gestoppt sein).
    await page.waitForTimeout(1500);
    await expect(page.locator('#start-screen')).toBeVisible();
    await expect(page.locator('#result-screen')).toBeHidden();
  });

  test('Browser-Zurück erzeugt keine History-Endlosschleife', async ({ page }) => {
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem', { timeout: 5000 });

    const lengthAfterStart = await page.evaluate(() => window.history.length);

    await page.goBack();
    await expect(page.locator('#start-screen')).toBeVisible();

    const lengthAfterBack = await page.evaluate(() => window.history.length);

    // Ein einzelner Zurück-Schritt darf keine neuen History-Einträge anlegen
    expect(lengthAfterBack).toBe(lengthAfterStart);

    // Ein zweiter Zurück-Druck sollte die App verlassen (kein weiterer
    // History-Eintrag von der App mehr vorhanden) statt in einer Schleife
    // erneut auf dem Start-Screen zu landen.
    await page.goBack();
    await page.waitForTimeout(300);
    const lengthAfterSecondBack = await page.evaluate(() => window.history.length);
    expect(lengthAfterSecondBack).toBe(lengthAfterStart);
  });
});
