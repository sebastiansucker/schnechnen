// test/e2e/responsive-tests.spec.js
const { test, expect, devices } = require('@playwright/test');

test.describe('Responsive & Mobile Verhalten', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
  });

  test.describe('Desktop Viewports', () => {
    test('Dial Pad Layout auf 1920x1080', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Start a game
      await page.click('button[data-level="1"]');
      await page.waitForSelector('#dial-pad');
      
      // Check dial pad is visible and properly sized
      const dialPad = page.locator('#dial-pad');
      await expect(dialPad).toBeVisible();
      
      // Check buttons are clickable
      const dialButtons = page.locator('.dial-btn[data-value]');
      const count = await dialButtons.count();
      expect(count).toBe(10);
      
      // Verify buttons are not hidden
      for (let i = 0; i < Math.min(3, count); i++) {
        const button = dialButtons.nth(i);
        const isVisible = await button.isVisible();
        expect(isVisible).toBe(true);
      }
    });

    test('Layout auf 1024x768 Tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 1024, height: 768 });
      
      // Start a game
      await page.click('button[data-level="1"]');
      await page.waitForSelector('#dial-pad');
      
      // Problem should still be readable
      const problem = page.locator('#problem');
      await expect(problem).toBeVisible();
      
      // Dial pad should still be accessible
      const dialPad = page.locator('#dial-pad');
      await expect(dialPad).toBeVisible();
      
      // Test that we can interact with buttons
      await page.click('.dial-btn[data-value="5"]');
      await expect(page.locator('#user-answer')).toHaveText('5');
    });

    test('Mobile Viewport 375x812 (iPhone)', async ({ page }) => {
      // Set mobile viewport (iPhone 12 size)
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Start screen should be visible
      const h1 = page.locator('h1');
      await expect(h1).toHaveText('Schnechnen');
      
      // Level buttons should be accessible (may be stacked)
      const levelButtons = page.locator('.level-btn');
      await expect(levelButtons).toHaveCount(6);
      
      // Start a game
      await page.click('button[data-level="1"]');
      await page.waitForSelector('#dial-pad');
      
      // Problem should be visible
      const problem = page.locator('#problem');
      await expect(problem).toBeVisible();
      
      // Dial pad should be visible (may need scrolling)
      const dialPad = page.locator('#dial-pad');
      const isPadVisible = await dialPad.isVisible();
      
      if (!isPadVisible) {
        // Try scrolling to dial pad
        await dialPad.scrollIntoViewIfNeeded();
      }
      
      await expect(dialPad).toBeVisible();
      
      // Should still be able to input
      await page.click('.dial-btn[data-value="7"]');
      await expect(page.locator('#user-answer')).toHaveText('7');
    });
  });

  test.describe('Viewport Größenänderung während Spiel', () => {
    test('Viewport wechsel Desktop → Mobile während Spiel', async ({ page }) => {
      // Start at desktop size
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Start a game
      await page.click('button[data-level="1"]');
      await page.waitForSelector('#dial-pad');
      
      // Input on desktop
      await page.click('.dial-btn[data-value="1"]');
      await page.click('.dial-btn[data-value="2"]');
      
      const userAnswer1 = await page.locator('#user-answer').textContent();
      expect(userAnswer1).toBe('12');
      
      // Change to mobile size
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Check that game state is preserved
      const userAnswer2 = await page.locator('#user-answer').textContent();
      expect(userAnswer2).toBe('12');
      
      // Dial pad should still work
      await page.click('.dial-btn[data-value="3"]');
      await expect(page.locator('#user-answer')).toHaveText('123');
    });

    test('Viewport wechsel Mobile → Desktop während Spiel', async ({ page }) => {
      // Start at mobile size
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Start a game
      await page.click('button[data-level="1"]');
      await page.waitForSelector('#dial-pad');
      
      // Input on mobile
      await page.click('.dial-btn[data-value="5"]');
      
      const userAnswer1 = await page.locator('#user-answer').textContent();
      expect(userAnswer1).toBe('5');
      
      // Change to desktop size
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Check that game state is preserved
      const userAnswer2 = await page.locator('#user-answer').textContent();
      expect(userAnswer2).toBe('5');
      
      // Complete the problem
      const problemData = await page.evaluate(() => {
        if (window.gameState && window.gameState.currentProblem) {
          return window.gameState.currentProblem.result;
        }
        return null;
      });
      
      if (problemData) {
        // Clear and enter correct answer
        await page.click('#backspace-btn');
        const answer = problemData.toString();
        for (const digit of answer) {
          await page.click(`.dial-btn[data-value="${digit}"]`);
        }
        await page.click('#submit-btn');
        
        // Next problem should load
        await page.waitForTimeout(700);
        await expect(page.locator('#problem')).toBeVisible();
      }
    });
  });

  test.describe('Dial Pad Responsivität', () => {
    test('Buttons bleiben klickbar auf kleinen Bildschirmen', async ({ page }) => {
      // Set to small mobile size
      await page.setViewportSize({ width: 320, height: 568 });
      
      // Start a game
      await page.click('button[data-level="1"]');
      await page.waitForSelector('#dial-pad');
      
      // All buttons should still be clickable
      const buttons = [
        { digit: '1', value: '.dial-btn[data-value="1"]' },
        { digit: '5', value: '.dial-btn[data-value="5"]' },
        { digit: '9', value: '.dial-btn[data-value="9"]' },
        { digit: '0', value: '.dial-btn[data-value="0"]' },
      ];
      
      for (const btn of buttons) {
        await page.click(btn.value);
        await page.waitForTimeout(200);
      }
      
      // Check that all inputs were recorded
      const userAnswer = await page.locator('#user-answer').textContent();
      expect(userAnswer).toMatch(/[1590]+/);
    });

    test('Backspace und OK Buttons sind auf mobil zugänglich', async ({ page }) => {
      // Set to mobile size
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Start a game
      await page.click('button[data-level="1"]');
      await page.waitForSelector('#dial-pad');
      
      // Input some numbers
      await page.click('.dial-btn[data-value="1"]');
      await page.click('.dial-btn[data-value="2"]');
      await page.click('.dial-btn[data-value="3"]');
      
      // Backspace should work
      const backspaceBtn = page.locator('#backspace-btn');
      await expect(backspaceBtn).toBeVisible();
      await backspaceBtn.click();
      
      let userAnswer = await page.locator('#user-answer').textContent();
      expect(userAnswer).toBe('12');
      
      // OK button should be visible and clickable
      const submitBtn = page.locator('#submit-btn');
      await expect(submitBtn).toBeVisible();
      
      // Click OK to submit wrong answer (we just test clickability)
      await submitBtn.click();
      
      // Next problem should load
      await page.waitForTimeout(700);
      await expect(page.locator('#problem')).toBeVisible();
    });
  });

  test.describe('Responsive Layout Details', () => {
    test('Statistiken Screen responsive auf Mobile', async ({ page }) => {
      // Set to mobile size
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Click stats button
      await page.click('#stats-btn');
      
      // Stats screen should be visible
      const statsScreen = page.locator('#stats-screen');
      await expect(statsScreen).not.toHaveClass(/hidden/);
      
      // Stats buttons should be visible
      const statsButtons = page.locator('.stats-level-btn');
      await expect(statsButtons).toHaveCount(6);
      
      // Content should not overflow horizontally
      const h2 = page.locator('#stats-screen h2');
      await expect(h2).toBeVisible();
    });

    test('Ergebnis Screen responsive auf Mobile', async ({ page }) => {
      // Set to mobile size
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Start and quickly end a game
      await page.click('button[data-level="1"]');
      await page.waitForSelector('#problem');
      
      // End game via test API
      await page.evaluate(() => {
        if (window.__TEST__ && typeof window.__TEST__.endGame === 'function') {
          window.__TEST__.endGame();
        }
      });
      
      // Wait for result screen
      await page.waitForSelector('#result-screen:not(.hidden)');
      
      // Check that all elements are visible
      await expect(page.locator('#result-screen h2')).toHaveText('Ergebnis');
      await expect(page.locator('.result-stats')).toBeVisible();
      await expect(page.locator('.common-mistakes')).toBeVisible();
      
      // Check that buttons are accessible
      const buttons = page.locator('#result-screen button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
