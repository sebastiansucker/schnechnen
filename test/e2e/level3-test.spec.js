// test/e2e/level3-test.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Level 3 Test: Multiplikation bis 100', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
  });

  test('Level 3 ist verfügbar und funktional', async ({ page }) => {
    // Verify Level 3 button is present (scoped to start-screen to avoid stats buttons)
    const level3Button = page.locator('#start-screen button[data-level="3"]');
    await expect(level3Button).toBeVisible();
    await expect(level3Button).toHaveText('Level 3: Multiplikation bis 100');
    
    // Start Level 3
    await page.click('button[data-level="3"]');
    
    // Verify game screen is shown
    await expect(page.locator('#game-screen')).not.toHaveClass('hidden');
    
    // Verify problem is displayed
    await expect(page.locator('#problem')).toBeVisible();
    
    // Verify dial pad is visible
    await page.waitForSelector('#dial-pad');
    await expect(page.locator('#dial-pad')).toBeVisible();
    
    // Verify timer is running
    await expect(page.locator('#time')).toHaveText('60');
    
    // Verify problems contain only multiplication
    const problemText = await page.locator('#problem').textContent();
    expect(problemText).toContain(' × ');
    
    // Go back to start screen
    await page.click('#back-btn');
    
    // Verify we're back on start screen
    await expect(page.locator('#start-screen')).not.toHaveClass('hidden');
  });

  test('Level 3 Probleme sind nur Multiplikation', async ({ page }) => {
    // Start Level 3
    await page.click('button[data-level="3"]');
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
      
      // Should contain only ×
      const hasMultiplication = problemText.includes('×');
      const hasAddition = problemText.includes('+');
      const hasSubtraction = problemText.includes('-');
      const hasDivision = problemText.includes('÷');
      
      expect(hasMultiplication).toBe(true);
      expect(hasAddition).toBe(false);
      expect(hasSubtraction).toBe(false);
      expect(hasDivision).toBe(false);
      
      // Submit wrong answer to move to next problem
      await page.click('.dial-btn[data-value="0"]');
      await page.click('#submit-btn');
      await page.waitForTimeout(700);
    }
  });

  test('Level 3 Operanden ergeben Ergebnisse <= 100', async ({ page }) => {
    // Start Level 3
    await page.click('button[data-level="3"]');
    await page.waitForSelector('#problem');
    
    // Check 10 problems
    for (let i = 0; i < 10; i++) {
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
        // Operands should be small enough so that result <= 100
        expect(operands.num1).toBeLessThanOrEqual(100);
        expect(operands.num2).toBeLessThanOrEqual(100);
        expect(operands.result).toBeLessThanOrEqual(100);
        expect(operands.result).toBeGreaterThan(0);
      }
      
      // Submit wrong answer to move to next problem
      await page.click('.dial-btn[data-value="0"]');
      await page.click('#submit-btn');
      await page.waitForTimeout(700);
    }
  });

  test('Level 3 Multiplikation ergibt ganze Zahlen', async ({ page }) => {
    // Start Level 3
    await page.click('button[data-level="3"]');
    await page.waitForSelector('#problem');
    
    // Check 10 problems
    for (let i = 0; i < 10; i++) {
      const problemData = await page.evaluate(() => {
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
      
      if (problemData) {
        const expectedResult = problemData.num1 * problemData.num2;
        expect(problemData.result).toBe(expectedResult);
        expect(Number.isInteger(problemData.result)).toBe(true);
      }
      
      // Submit wrong answer to move to next problem
      await page.click('.dial-btn[data-value="0"]');
      await page.click('#submit-btn');
      await page.waitForTimeout(700);
    }
  });

  test('Level 3 mit korrekten Antworten bestanden', async ({ page }) => {
    // Start Level 3
    await page.click('button[data-level="3"]');
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
