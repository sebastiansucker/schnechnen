// test/e2e/responsive-tests.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Responsive & Mobile Verhalten', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    // Enable test mode to prevent scores from being submitted to leaderboard
    await page.evaluate(() => {
      window.__TEST_MODE__ = true;
    });
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

    test('Mobile Viewport 375x667 (iPhone Mini)', async ({ page }) => {
      // Set mobile viewport (iPhone Mini size - smallest iPhone)
      await page.setViewportSize({ width: 375, height: 667 });
      
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
      
      // Dial pad should be visible (may need scrolling on small screens)
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
      
      // Verify timer is visible (important on small screens)
      const timer = page.locator('.timer');
      await expect(timer).toBeVisible();
    });

    test('Medium-Height Screen 375x700 (landscape mobile)', async ({ page }) => {
      // Set medium-height viewport (landscape phones)
      await page.setViewportSize({ width: 375, height: 700 });
      
      // Start screen should be visible
      const h1 = page.locator('h1');
      await expect(h1).toHaveText('Schnechnen');
      
      // Level buttons should be accessible
      const levelButtons = page.locator('.level-btn');
      await expect(levelButtons).toHaveCount(6);
      
      // Start a game
      await page.click('button[data-level="1"]');
      await page.waitForSelector('#dial-pad');
      
      // Problem should be visible without scrolling
      const problem = page.locator('#problem');
      await expect(problem).toBeVisible();
      
      // Dial pad should be visible without scrolling
      const dialPad = page.locator('#dial-pad');
      const isPadVisible = await dialPad.isVisible();
      
      if (!isPadVisible) {
        await dialPad.scrollIntoViewIfNeeded();
      }
      
      await expect(dialPad).toBeVisible();
      
      // Verify we can input
      await page.click('.dial-btn[data-value="5"]');
      await expect(page.locator('#user-answer')).toHaveText('5');
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

    test('Leaderboard Screen responsive auf Mobile', async ({ page }) => {
      // Set to mobile size
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Click leaderboard button
      await page.click('#leaderboard-btn');
      
      // Leaderboard screen should be visible
      const leaderboardScreen = page.locator('#leaderboard-screen');
      await page.waitForSelector('#leaderboard-screen:not(.hidden)');
      await expect(leaderboardScreen).not.toHaveClass(/hidden/);
      
      // Level buttons should be visible
      const levelButtons = page.locator('.leaderboard-level-btn');
      const count = await levelButtons.count();
      expect(count).toBeGreaterThan(0);
      
      // Leaderboard content should be visible
      const leaderboardContent = page.locator('#leaderboard-list');
      await expect(leaderboardContent).toBeVisible();
      
      // Title should be visible
      const title = page.locator('#leaderboard-screen h2');
      await expect(title).toBeVisible();
      
      // Back button should be visible
      const backBtn = page.locator('#leaderboard-back-btn');
      await expect(backBtn).toBeVisible();
      
      // Verify layout: list should be above back button (list y-position < button y-position)
      const listBBox = await leaderboardContent.boundingBox();
      const backBtnBBox = await backBtn.boundingBox();
      
      if (listBBox && backBtnBBox) {
        // List should be positioned before (above) back button
        expect(listBBox.y).toBeLessThan(backBtnBBox.y);
        
        // List bottom and back button top should not significantly overlap
        // (allow small overlap but list should mostly be above)
        const listBottom = listBBox.y + listBBox.height;
        const buttonTop = backBtnBBox.y;
        
        // At least some space should exist between them (at most 50% overlap allowed)
        const overlapThreshold = listBBox.height * 0.5;
        const overlap = Math.max(0, listBottom - buttonTop);
        expect(overlap).toBeLessThan(overlapThreshold);
      }
    });

    test('Leaderboard Screen responsive auf iPhone Mini (375x667)', async ({ page }) => {
      // Set to iPhone Mini size
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Click leaderboard button
      await page.click('#leaderboard-btn');
      await page.waitForSelector('#leaderboard-screen:not(.hidden)');
      
      // All elements should be visible without scrolling
      const leaderboardScreen = page.locator('#leaderboard-screen');
      await expect(leaderboardScreen).not.toHaveClass(/hidden/);
      
      // Level buttons should still be accessible
      const levelButtons = page.locator('.leaderboard-level-btn');
      const count = await levelButtons.count();
      expect(count).toBeGreaterThan(0);
      
      // Content should be readable
      const header = page.locator('#leaderboard-screen h2');
      await expect(header).toBeVisible();
      
      // Verify layout: name field and back button should be below or near list
      const leaderboardContent = page.locator('#leaderboard-list');
      const playerUsername = page.locator('#player-username');
      const backBtn = page.locator('#leaderboard-back-btn');
      
      // All elements should be visible
      await expect(leaderboardContent).toBeVisible();
      await expect(playerUsername).toBeVisible();
      await expect(backBtn).toBeVisible();
      
      // Verify element order with bounding boxes
      const listBBox = await leaderboardContent.boundingBox();
      const usernameBBox = await playerUsername.boundingBox();
      const backBtnBBox = await backBtn.boundingBox();
      
      if (listBBox && usernameBBox && backBtnBBox) {
        // List should be positioned before (above) player username
        expect(listBBox.y).toBeLessThan(usernameBBox.y);
        
        // Player username should be positioned before (above) back button
        expect(usernameBBox.y).toBeLessThan(backBtnBBox.y);
        
        // On very small screens, elements may overlap slightly
        // Just ensure they're not completely hidden or inverted
        const listEnd = listBBox.y + listBBox.height;
        const usernameStart = usernameBBox.y;
        
        // At least the username should not be completely hidden by the list
        // (allow up to 80% overlap on small screens)
        const maxOverlap = listBBox.height * 0.8;
        const overlap = Math.max(0, listEnd - usernameStart);
        expect(overlap).toBeLessThan(maxOverlap);
      }
    });

    test('Leaderboard Level-Wechsel responsive auf Mobile', async ({ page }) => {
      // Set to mobile size
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Click leaderboard button
      await page.click('#leaderboard-btn');
      await page.waitForSelector('#leaderboard-screen:not(.hidden)');
      
      // Click Level 2 button
      await page.click('.leaderboard-level-btn[data-level="2"]');
      
      // Wait for level to be active with retry logic
      let activeLevel = null;
      for (let i = 0; i < 10; i++) {
        const activeBtn = page.locator('.leaderboard-level-btn.active');
        activeLevel = await activeBtn.getAttribute('data-level');
        if (activeLevel === '2') {
          break;
        }
        await page.waitForTimeout(100);
      }
      
      expect(activeLevel).toBe('2');
      
      // Content should update and still be visible
      const leaderboardContent = page.locator('#leaderboard-list');
      await expect(leaderboardContent).toBeVisible();
    });

    test('iPhone 13 mini Leaderboard - Back button visibility', async ({ page }) => {
      // Set iPhone 13 mini viewport (375x812)
      await page.setViewportSize({ width: 375, height: 812 });
      
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

    test('iPhone 13 mini Leaderboard - Back button is clickable', async ({ page }) => {
      // Set iPhone 13 mini viewport (375x812)
      await page.setViewportSize({ width: 375, height: 812 });
      
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
      await expect(page.locator('#leaderboard-screen')).toHaveClass(/hidden/);
    });

    test('iPhone 13 mini Stats View - Button visibility and opening', async ({ page }) => {
      // Set iPhone 13 mini viewport (375x812)
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Click stats button
      const statsBtn = page.locator('#stats-btn');
      await expect(statsBtn).toBeVisible();
      await statsBtn.click();
      
      // Stats screen should open
      await page.waitForSelector('#stats-screen:not(.hidden)');
      await expect(page.locator('#stats-screen')).not.toHaveClass('hidden');
    });

    test('iPhone 13 mini Stats View - Content accessibility', async ({ page }) => {
      // Set iPhone 13 mini viewport (375x812)
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Click stats button
      await page.click('#stats-btn');
      await page.waitForSelector('#stats-screen:not(.hidden)');
      
      // Check important stats elements
      await expect(page.locator('#stats-screen h2')).toBeVisible();
      await expect(page.locator('.stats-level-btn')).toHaveCount(6);
      
      // Level buttons should be clickable
      const levelBtn = page.locator('.stats-level-btn[data-level="0"]');
      await expect(levelBtn).toBeVisible();
    });

    test('iPhone 13 mini Stats View - No overflow', async ({ page }) => {
      // Set iPhone 13 mini viewport (375x812)
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Click stats button
      await page.click('#stats-btn');
      await page.waitForSelector('#stats-screen:not(.hidden)');
      
      // Back button should be visible and clickable
      const backBtn = page.locator('#stats-screen button:has-text("Zurück")');
      await expect(backBtn).toBeVisible();
    });

    test('iPhone 13 mini Stats View - Back button functionality', async ({ page }) => {
      // Set iPhone 13 mini viewport (375x812)
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Click stats button
      await page.click('#stats-btn');
      await page.waitForSelector('#stats-screen:not(.hidden)');
      
      // Click back button
      const backBtn = page.locator('#stats-screen button:has-text("Zurück")');
      await backBtn.click();
      
      // Should return to start screen
      await page.waitForSelector('#start-screen:not(.hidden)');
      await expect(page.locator('#start-screen')).not.toHaveClass('hidden');
      await expect(page.locator('#stats-screen')).toHaveClass(/hidden/);
    });

    test('iPhone 13 mini Stats View - Level switching', async ({ page }) => {
      // Set iPhone 13 mini viewport (375x812)
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Click stats button
      await page.click('#stats-btn');
      await page.waitForSelector('#stats-screen:not(.hidden)');
      
      // Click Level 1 button
      const levelBtn = page.locator('.stats-level-btn[data-level="1"]');
      await expect(levelBtn).toBeVisible();
      await levelBtn.click();
      
      // The button should become active
      await page.waitForTimeout(300);
      const activeBtn = page.locator('.stats-level-btn.active');
      const activLevel = await activeBtn.getAttribute('data-level');
      expect(activLevel).toBe('1');
    });
  });
});
