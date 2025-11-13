// test/e2e/level2-test.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Level 2 Test: Addition & Subtraktion bis 100', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
  });

  test('Level 2 ist verfügbar und funktional', async ({ page }) => {
    // Verify Level 2 button is present
    const level2Button = page.locator('button[data-level="2"]');
    await expect(level2Button).toBeVisible();
    await expect(level2Button).toHaveText('Level 2: Addition & Subtraktion bis 100');
    
    // Start Level 2
    await page.click('button[data-level="2"]');
    
    // Verify game screen is shown
    await expect(page.locator('#game-screen')).not.toHaveClass('hidden');
    
    // Verify problem is displayed
    await expect(page.locator('#problem')).toBeVisible();
    
    // Verify dial pad is visible
    await page.waitForSelector('#dial-pad');
    await expect(page.locator('#dial-pad')).toBeVisible();
    
    // Verify timer is running
    await expect(page.locator('#time')).toHaveText('60');
    
    // Verify problems contain only + or -
    const problemText = await page.locator('#problem').textContent();
    const hasAdditionOrSubtraction = problemText.includes(' + ') || problemText.includes(' - ');
    expect(hasAdditionOrSubtraction).toBe(true);
    
    // Go back to start screen
    await page.click('#back-btn');
    
    // Verify we're back on start screen
    await expect(page.locator('#start-screen')).not.toHaveClass('hidden');
  });

  test('Level 2 Probleme enthalten nur + oder -', async ({ page }) => {
    // Start Level 2
    await page.click('button[data-level="2"]');
    await page.waitForSelector('#problem');
    
    // Check 5 problems
    for (let i = 0; i < 5; i++) {
      const problemText = await page.locator('#problem').textContent();
      
      // Should contain either + or -, but not * or /
      const hasAddition = problemText.includes('+');
      const hasSubtraction = problemText.includes('-');
      const hasMultiplication = problemText.includes('×');
      const hasDivision = problemText.includes('÷');
      
      expect(hasAddition || hasSubtraction).toBe(true);
      expect(hasMultiplication).toBe(false);
      expect(hasDivision).toBe(false);
      
      // Submit wrong answer to move to next problem
      await page.click('.dial-btn[data-value="0"]');
      await page.click('#submit-btn');
      await page.waitForTimeout(700);
    }
  });

  test('Level 2 Operanden sind max 100', async ({ page }) => {
    // Start Level 2
    await page.click('button[data-level="2"]');
    await page.waitForSelector('#problem');
    
    // Check 5 problems for max operands
    for (let i = 0; i < 5; i++) {
      const operands = await page.evaluate(() => {
        if (window.gameState && window.gameState.currentProblem) {
          const p = window.gameState.currentProblem;
          return {
            num1: p.num1,
            num2: p.num2,
            result: p.result
          };
        }
        return null;
      });
      
      if (operands) {
        expect(operands.num1).toBeLessThanOrEqual(100);
        expect(operands.num2).toBeLessThanOrEqual(100);
        expect(operands.result).toBeGreaterThanOrEqual(0);
      }
      
      // Submit wrong answer to move to next problem
      await page.click('.dial-btn[data-value="0"]');
      await page.click('#submit-btn');
      await page.waitForTimeout(700);
    }
  });

  test('Level 2 Subtraktion ergibt kein negatives Ergebnis', async ({ page }) => {
    // Start Level 2
    await page.click('button[data-level="2"]');
    await page.waitForSelector('#problem');
    
    // Check 10 problems
    for (let i = 0; i < 10; i++) {
      const problemData = await page.evaluate(() => {
        if (window.gameState && window.gameState.currentProblem) {
          const p = window.gameState.currentProblem;
          return {
            operation: p.operation,
            num1: p.num1,
            num2: p.num2,
            result: p.result
          };
        }
        return null;
      });
      
      if (problemData && problemData.operation === '-') {
        // Subtractions should not have negative result
        expect(problemData.result).toBeGreaterThanOrEqual(0);
        expect(problemData.num1).toBeGreaterThanOrEqual(problemData.num2);
      }
      
      // Submit wrong answer to move to next problem
      await page.click('.dial-btn[data-value="0"]');
      await page.click('#submit-btn');
      await page.waitForTimeout(700);
    }
  });

  test('Level 2 mit korrekten Antworten bestanden', async ({ page }) => {
    // Start Level 2
    await page.click('button[data-level="2"]');
    await page.waitForSelector('#problem');
    
    // Solve 3 problems correctly
    for (let i = 0; i < 3; i++) {
      const problemData = await page.evaluate(() => {
        if (window.gameState && window.gameState.currentProblem) {
          return window.gameState.currentProblem.result;
        }
        return null;
      });
      
      if (problemData) {
        // Enter correct answer
        const answer = problemData.toString();
        for (const digit of answer) {
          await page.click(`.dial-btn[data-value="${digit}"]`);
        }
        await page.click('#submit-btn');
        await page.waitForTimeout(700);
      }
    }
    
    // Verify problem still displayed (game continuing)
    await expect(page.locator('#problem')).toBeVisible();
  });
});
