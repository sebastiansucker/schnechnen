// test/e2e/level4-test.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Level 4 Test: Multiplikation & Division bis 100', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
  });

  test('Level 4 ist verfügbar und funktional', async ({ page }) => {
    // Verify Level 4 button is present (scoped to start-screen to avoid stats buttons)
    const level4Button = page.locator('#start-screen button[data-level="4"]');
    await expect(level4Button).toBeVisible();
    await expect(level4Button).toHaveText('Level 4: Multiplikation & Division bis 100');
    
    // Start Level 4
    await page.click('button[data-level="4"]');
    
    // Verify game screen is shown
    await expect(page.locator('#game-screen')).not.toHaveClass('hidden');
    
    // Verify problem is displayed
    await expect(page.locator('#problem')).toBeVisible();
    
    // Verify dial pad is visible
    await page.waitForSelector('#dial-pad');
    await expect(page.locator('#dial-pad')).toBeVisible();
    
    // Verify timer is running
    await expect(page.locator('#time')).toHaveText('60');
    
    // Verify problems contain either * or /
    const problemText = await page.locator('#problem').textContent();
    const hasMultiplicationOrDivision = problemText.includes(' × ') || problemText.includes(' ÷ ');
    expect(hasMultiplicationOrDivision).toBe(true);
    
    // Go back to start screen
    await page.click('#back-btn');
    
    // Verify we're back on start screen
    await expect(page.locator('#start-screen')).not.toHaveClass('hidden');
  });

  test('Level 4 Probleme enthalten * oder /', async ({ page }) => {
    // Start Level 4
    await page.click('button[data-level="4"]');
    await page.waitForSelector('#problem');
    
    // Check 5 problems
    for (let i = 0; i < 5; i++) {
      const problemText = await page.locator('#problem').textContent();
      
      // Validate that problem does not contain NaN or null
      expect(problemText).not.toContain('NaN');
      expect(problemText).not.toContain('null');
      
      // Extract operands and verify they are valid numbers
      const operands = await page.evaluate(() => {
        if (window.gameState && window.gameState.currentProblem) {
          return {
            num1: window.gameState.currentProblem.num1,
            num2: window.gameState.currentProblem.num2,
            result: window.gameState.currentProblem.result
          };
        }
        return null;
      });
      
      if (operands) {
        expect(Number.isNaN(operands.num1)).toBe(false);
        expect(Number.isNaN(operands.num2)).toBe(false);
        expect(Number.isNaN(operands.result)).toBe(false);
        expect(operands.num1).toBeGreaterThan(0);
        expect(operands.num2).toBeGreaterThan(0);
      }
      
      // Should contain either × or ÷
      const hasMultiplication = problemText.includes('×');
      const hasDivision = problemText.includes('÷');
      const hasAddition = problemText.includes('+');
      const hasSubtraction = problemText.includes('-');
      
      expect(hasMultiplication || hasDivision).toBe(true);
      expect(hasAddition).toBe(false);
      expect(hasSubtraction).toBe(false);
      
      // Submit wrong answer to move to next problem
      await page.click('.dial-btn[data-value="0"]');
      await page.click('#submit-btn');
      await page.waitForTimeout(700);
    }
  });

  test('Level 4 Multiplikation und Division alle <= 100', async ({ page }) => {
    // Start Level 4
    await page.click('button[data-level="4"]');
    await page.waitForSelector('#problem');
    
    // Check 10 problems
    for (let i = 0; i < 10; i++) {
      const operands = await page.evaluate(() => {
        if (window.gameState && window.gameState.currentProblem) {
          const p = window.gameState.currentProblem;
          return {
            num1: p.num1,
            num2: p.num2,
            result: p.result,
            operation: p.operation
          };
        }
        return null;
      });
      
      if (operands) {
        expect(operands.num1).toBeLessThanOrEqual(100);
        expect(operands.num2).toBeLessThanOrEqual(100);
        expect(operands.result).toBeLessThanOrEqual(100);
        expect(operands.result).toBeGreaterThanOrEqual(0);
        
        // If division, then it should divide evenly
        if (operands.operation === '/') {
          expect(Number.isInteger(operands.result)).toBe(true);
          expect(operands.num1 % operands.num2).toBe(0);
        }
      }
      
      // Submit wrong answer to move to next problem
      await page.click('.dial-btn[data-value="0"]');
      await page.click('#submit-btn');
      await page.waitForTimeout(700);
    }
  });

  test('Level 4 mit korrekten Antworten bestanden', async ({ page }) => {
    // Start Level 4
    await page.click('button[data-level="4"]');
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
