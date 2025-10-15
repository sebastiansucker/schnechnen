const { test, expect } = require('@playwright/test');

test('check back button and navigation flow', async ({ page }) => {
  await page.goto('/');
  // start level 1
  await page.click('button[data-level="1"]');
  await page.waitForSelector('#game-screen:not(.hidden)');
  const timeBefore = await page.locator('#time').textContent();
  // now click back button
  const backVisible = await page.locator('#back-btn').isVisible().catch(()=>false);
  if (backVisible) {
    await page.click('#back-btn');
    await page.waitForTimeout(300);
  }
  const startVisible = await page.locator('#start-screen').isVisible().catch(()=>false);
  const gameVisible = await page.locator('#game-screen').isVisible().catch(()=>false);

  expect(startVisible).toBeTruthy();
  expect(gameVisible).toBeFalsy();
});
