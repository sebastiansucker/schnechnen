// test/e2e/level1-test.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Level 1 Test: Addition & Subtraktion bis 10', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
  });

  test('Level 1 ist verfügbar und funktional', async ({ page }) => {
    // Verify Level 1 button is present (scoped to start-screen to avoid stats buttons)
    const level1Button = page.locator('#start-screen button[data-level="1"]');
    await expect(level1Button).toBeVisible();
    await expect(level1Button).toHaveText('Level 1: Addition & Subtraktion bis 10');
    
    // Start Level 1
    await page.click('button[data-level="1"]');
    
    // Verify game screen is shown
    await expect(page.locator('#game-screen')).not.toHaveClass('hidden');
    
    // Verify problem is displayed
    await expect(page.locator('#problem')).toBeVisible();
    
    // Verify user answer field is visible
    await expect(page.locator('#user-answer')).toBeVisible();
    
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

  test('Level 1 Probleme enthalten nur + oder -', async ({ page }) => {
    // Start Level 1
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');
    
    // Check 5 problems
    for (let i = 0; i < 5; i++) {
      const problemText = await page.locator('#problem').textContent();
      
      // Validate that problem does not contain NaN
      expect(problemText).not.toContain('NaN');
      
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
      }
      
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

  test('Level 1 Operanden sind max 10', async ({ page }) => {
    // Start Level 1
    await page.click('button[data-level="1"]');
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
        expect(operands.num1).toBeLessThanOrEqual(10);
        expect(operands.num2).toBeLessThanOrEqual(10);
        expect(operands.result).toBeGreaterThanOrEqual(0);
      }
      
      // Submit wrong answer to move to next problem
      await page.click('.dial-btn[data-value="0"]');
      await page.click('#submit-btn');
      await page.waitForTimeout(700);
    }
  });

  test('Level 1 Subtraktion ergibt kein negatives Ergebnis', async ({ page }) => {
    // Start Level 1
    await page.click('button[data-level="1"]');
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

  test('Level 1 mit korrekten Antworten bestanden', async ({ page }) => {
    // Start Level 1
    await page.click('button[data-level="1"]');
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

  test('Level 1 mit falscher Antwort - Score bleibt gleich', async ({ page }) => {
    // Start Level 1
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');
    
    // Get score before wrong answer
    const scoreBefore = await page.evaluate(() => {
      return window.gameState ? window.gameState.score : 0;
    });
    
    // Submit wrong answer (99)
    await page.click('.dial-btn[data-value="9"]');
    await page.click('.dial-btn[data-value="9"]');
    await page.click('#submit-btn');
    
    await page.waitForTimeout(1000);
    
    // Check that:
    // 1. Score didn't increase
    const scoreAfter = await page.evaluate(() => {
      return window.gameState ? window.gameState.score : 0;
    });
    expect(scoreAfter).toBe(scoreBefore);
    
    // 2. Input was reset
    const userAnswer = await page.locator('#user-answer').textContent();
    expect(userAnswer).toBe('?');
    
    // 3. Mistakes were tracked
    const mistakesStored = await page.evaluate(() => {
      return window.Weighting ? window.Weighting.getMistakes(1).length > 0 : false;
    });
    expect(mistakesStored).toBe(true);
  });

  test('Level 1 mehrere Lösungen hintereinander', async ({ page }) => {
    // Start Level 1 (scoped to start-screen to avoid stats buttons)
    await page.click('#start-screen button[data-level="1"]');
    await page.waitForSelector('#problem');
    
    // Solve 3 problems by entering wrong answers to move to next problem
    for (let i = 0; i < 3; i++) {
      // Submit a wrong answer to move to next problem
      await page.click('.dial-btn[data-value="0"]');
      await page.click('#submit-btn');
      await page.waitForTimeout(700);
    }
    
    // Verify game is still running after 3 problems
    await expect(page.locator('#problem')).toBeVisible();
  });
});
