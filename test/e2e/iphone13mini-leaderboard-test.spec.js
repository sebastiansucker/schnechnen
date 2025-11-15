import { test, expect } from '@playwright/test';

test.describe('iPhone 13 Mini - Leaderboard Back Button Visibility', () => {
  test.beforeEach(async ({ page }) => {
    // Set iPhone 13 mini viewport (375x812 - smaller than standard iPhone)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:8080');
  });

  test('Back button should be visible on iPhone 13 mini leaderboard', async ({ page }) => {
    // Open leaderboard
    await page.click('#leaderboard-btn');
    await page.waitForSelector('#leaderboard-screen:not(.hidden)');
    
    // The back button should be visible
    const backButton = page.locator('#leaderboard-back-btn');
    await expect(backButton).toBeVisible();
    
    // The button should be clickable (not hidden by overflow)
    const boundingBox = await backButton.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox.y).toBeGreaterThan(0);
    
    // The button should be within the viewport
    const viewport = page.viewportSize();
    expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(viewport.height);
  });

  test('Back button is clickable on iPhone 13 mini leaderboard', async ({ page }) => {
    // Open leaderboard
    await page.click('#leaderboard-btn');
    await page.waitForSelector('#leaderboard-screen:not(.hidden)');
    
    // Scroll to make sure back button is visible (if needed)
    const backButton = page.locator('#leaderboard-back-btn');
    await backButton.scrollIntoViewIfNeeded();
    
    // Click back button
    await backButton.click();
    
    // Should return to start screen
    await page.waitForSelector('#start-screen:not(.hidden)');
    await expect(page.locator('#start-screen')).not.toHaveClass('hidden');
    await expect(page.locator('#leaderboard-screen')).toHaveClass('hidden');
  });

  test('All leaderboard elements should be accessible on iPhone 13 mini', async ({ page }) => {
    // Open leaderboard
    await page.click('#leaderboard-btn');
    await page.waitForSelector('#leaderboard-screen:not(.hidden)');
    
    // Check that all important elements are present
    await expect(page.locator('#leaderboard-screen h2')).toBeVisible();
    await expect(page.locator('.leaderboard-level-selector')).toBeVisible();
    await expect(page.locator('.leaderboard-container')).toBeVisible();
    await expect(page.locator('.leaderboard-info')).toBeVisible();
    
    // The back button should be visible without scrolling
    const backButton = page.locator('#leaderboard-back-btn');
    const isVisible = await backButton.isVisible();
    
    if (!isVisible) {
      // If not visible, it means there's an overflow issue
      console.log('Back button not visible - overflow issue detected!');
    }
    
    await expect(backButton).toBeVisible();
  });
});
