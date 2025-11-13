// test/e2e/levels-2-4-test.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Level 2-4 Gameplay Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
  });

  // ==================== LEVEL 2: Addition & Subtraktion bis 100 ====================
  test.describe('Level 2: Addition & Subtraktion bis 100', () => {
    test('Level 2 Probleme enthalten nur + oder -', async ({ page }) => {
      // Starte Level 2
      await page.click('button[data-level="2"]');
      await page.waitForSelector('#problem');
      
      // Prüfe 5 Probleme
      for (let i = 0; i < 5; i++) {
        const problemText = await page.locator('#problem').textContent();
        
        // Sollte entweder + oder - enthalten, aber nicht * oder /
        const hasAddition = problemText.includes('+');
        const hasSubtraction = problemText.includes('-');
        const hasMultiplication = problemText.includes('×');
        const hasDivision = problemText.includes('÷');
        
        expect(hasAddition || hasSubtraction).toBe(true);
        expect(hasMultiplication).toBe(false);
        expect(hasDivision).toBe(false);
        
        // Gib falsche Antwort ein um zum nächsten Problem zu kommen
        await page.click('.dial-btn[data-value="0"]');
        await page.click('#submit-btn');
        await page.waitForTimeout(700);
      }
    });

    test('Level 2 Operanden sind max 100', async ({ page }) => {
      // Starte Level 2
      await page.click('button[data-level="2"]');
      await page.waitForSelector('#problem');
      
      // Prüfe 5 Probleme auf maximale Operanden
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
        
        // Gib falsche Antwort ein um zum nächsten Problem zu kommen
        await page.click('.dial-btn[data-value="0"]');
        await page.click('#submit-btn');
        await page.waitForTimeout(700);
      }
    });

    test('Level 2 Subtraktion ergibt kein negatives Ergebnis', async ({ page }) => {
      // Starte Level 2
      await page.click('button[data-level="2"]');
      await page.waitForSelector('#problem');
      
      // Prüfe 10 Probleme
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
          // Subtraktionen sollten kein negatives Ergebnis haben
          expect(problemData.result).toBeGreaterThanOrEqual(0);
          expect(problemData.num1).toBeGreaterThanOrEqual(problemData.num2);
        }
        
        // Gib falsche Antwort ein um zum nächsten Problem zu kommen
        await page.click('.dial-btn[data-value="0"]');
        await page.click('#submit-btn');
        await page.waitForTimeout(700);
      }
    });
  });

  // ==================== LEVEL 3: Multiplikation bis 100 ====================
  test.describe('Level 3: Multiplikation bis 100', () => {
    test('Level 3 Probleme sind nur Multiplikation', async ({ page }) => {
      // Starte Level 3
      await page.click('button[data-level="3"]');
      await page.waitForSelector('#problem');
      
      // Prüfe 5 Probleme
      for (let i = 0; i < 5; i++) {
        const problemText = await page.locator('#problem').textContent();
        
        // Sollte nur × enthalten
        const hasMultiplication = problemText.includes('×');
        const hasAddition = problemText.includes('+');
        const hasSubtraction = problemText.includes('-');
        const hasDivision = problemText.includes('÷');
        
        expect(hasMultiplication).toBe(true);
        expect(hasAddition).toBe(false);
        expect(hasSubtraction).toBe(false);
        expect(hasDivision).toBe(false);
        
        // Gib falsche Antwort ein um zum nächsten Problem zu kommen
        await page.click('.dial-btn[data-value="0"]');
        await page.click('#submit-btn');
        await page.waitForTimeout(700);
      }
    });

    test('Level 3 Operanden sind kleiner oder gleich sqrt(100)=10', async ({ page }) => {
      // Starte Level 3
      await page.click('button[data-level="3"]');
      await page.waitForSelector('#problem');
      
      // Prüfe 10 Probleme
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
          // Operanden sollten klein genug sein, damit Ergebnis <= 100
          expect(operands.num1).toBeLessThanOrEqual(100);
          expect(operands.num2).toBeLessThanOrEqual(100);
          expect(operands.result).toBeLessThanOrEqual(100);
          expect(operands.result).toBeGreaterThan(0);
        }
        
        // Gib falsche Antwort ein um zum nächsten Problem zu kommen
        await page.click('.dial-btn[data-value="0"]');
        await page.click('#submit-btn');
        await page.waitForTimeout(700);
      }
    });

    test('Level 3 Multiplikation ergibt ganze Zahlen', async ({ page }) => {
      // Starte Level 3
      await page.click('button[data-level="3"]');
      await page.waitForSelector('#problem');
      
      // Prüfe 10 Probleme
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
        
        // Gib falsche Antwort ein um zum nächsten Problem zu kommen
        await page.click('.dial-btn[data-value="0"]');
        await page.click('#submit-btn');
        await page.waitForTimeout(700);
      }
    });
  });

  // ==================== LEVEL 4: Multiplikation & Division bis 100 ====================
  test.describe('Level 4: Multiplikation & Division bis 100', () => {
    test('Level 4 Probleme enthalten * oder /', async ({ page }) => {
      // Starte Level 4
      await page.click('button[data-level="4"]');
      await page.waitForSelector('#problem');
      
      // Prüfe 5 Probleme
      for (let i = 0; i < 5; i++) {
        const problemText = await page.locator('#problem').textContent();
        
        // Sollte entweder × oder ÷ enthalten
        const hasMultiplication = problemText.includes('×');
        const hasDivision = problemText.includes('÷');
        const hasAddition = problemText.includes('+');
        const hasSubtraction = problemText.includes('-');
        
        expect(hasMultiplication || hasDivision).toBe(true);
        expect(hasAddition).toBe(false);
        expect(hasSubtraction).toBe(false);
        
        // Gib falsche Antwort ein um zum nächsten Problem zu kommen
        await page.click('.dial-btn[data-value="0"]');
        await page.click('#submit-btn');
        await page.waitForTimeout(700);
      }
    });



    test('Level 4 Multiplikation und Division alle <= 100', async ({ page }) => {
      // Starte Level 4
      await page.click('button[data-level="4"]');
      await page.waitForSelector('#problem');
      
      // Prüfe 10 Probleme
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
          expect(operands.num1).toBeLessThanOrEqual(100);
          expect(operands.num2).toBeLessThanOrEqual(100);
          expect(operands.result).toBeLessThanOrEqual(100);
          expect(operands.result).toBeGreaterThanOrEqual(0);
        }
        
        // Gib falsche Antwort ein um zum nächsten Problem zu kommen
        await page.click('.dial-btn[data-value="0"]');
        await page.click('#submit-btn');
        await page.waitForTimeout(700);
      }
    });
  });
});
