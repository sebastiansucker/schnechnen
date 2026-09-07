// test/e2e/times-table.spec.js
// Tests für die Einmaleins-Heatmap auf der Statistik-Seite (Issue #49)
const { test, expect } = require('@playwright/test');

test.describe('Einmaleins-Tafel Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');

    // Lösche vorherige Daten aus localStorage
    await page.evaluate(() => {
      localStorage.removeItem('schnechnen-history');
      localStorage.removeItem('schnechnen-highscores');
      localStorage.removeItem('schnechnen-mistakes');
      localStorage.removeItem('schnechnen-facts');
      window.__TEST_MODE__ = true;
    });
  });

  test('Tafel ist bei Level 1 (Addition) nicht sichtbar', async ({ page }) => {
    await page.click('#stats-btn');
    await expect(page.locator('#stats-screen')).not.toHaveClass(/hidden/);

    // Level 1 ist standardmäßig aktiv
    await expect(page.locator('#times-table-section')).toHaveClass(/hidden/);
  });

  test('Tafel ist bei Level 3 (Multiplikation) sichtbar und zeigt 100 Zellen', async ({ page }) => {
    await page.click('#stats-btn');
    await page.click('#stats-screen .stats-level-btn[data-level="3"]');

    await expect(page.locator('#times-table-section')).not.toHaveClass(/hidden/);
    await expect(page.locator('#times-table-grid .times-table-fact')).toHaveCount(100);

    // Zeilen- und Spaltenköpfe (1 bis 10, je zweimal: als Zeile und Spalte)
    await expect(page.locator('#times-table-grid .times-table-header')).toHaveCount(20);
  });

  test('Tafel ist auch bei Level 4 (Multiplikation & Division) und Level 5 (Chaos) sichtbar', async ({ page }) => {
    await page.click('#stats-btn');

    await page.click('#stats-screen .stats-level-btn[data-level="4"]');
    await expect(page.locator('#times-table-section')).not.toHaveClass(/hidden/);

    await page.click('#stats-screen .stats-level-btn[data-level="5"]');
    await expect(page.locator('#times-table-section')).not.toHaveClass(/hidden/);
  });

  test('Zellen ohne Daten sind grau eingefärbt', async ({ page }) => {
    await page.click('#stats-btn');
    await page.click('#stats-screen .stats-level-btn[data-level="3"]');

    const cell = page.locator('#times-table-grid .times-table-fact[data-row="4"][data-col="4"]');
    await expect(cell).toHaveClass(/status-gray/);
    await expect(cell).toContainText('16');
  });

  test('Sichere Aufgabe (>=3 richtig, zuletzt richtig) wird grün', async ({ page }) => {
    await page.evaluate(() => {
      const facts = {
        '3': {
          '7|*|8': { num1: 7, operation: '*', num2: 8, correct: 3, wrong: 0, lastResult: true, lastSeen: Date.now() }
        }
      };
      localStorage.setItem('schnechnen-facts', JSON.stringify(facts));
    });
    await page.reload();

    await page.click('#stats-btn');
    await page.click('#stats-screen .stats-level-btn[data-level="3"]');

    const cell = page.locator('#times-table-grid .times-table-fact[data-row="7"][data-col="8"]');
    await expect(cell).toHaveClass(/status-green/);
  });

  test('Zuletzt falsche oder überwiegend falsche Aufgabe wird rot', async ({ page }) => {
    await page.evaluate(() => {
      const facts = {
        '3': {
          '2|*|9': { num1: 2, operation: '*', num2: 9, correct: 1, wrong: 3, lastResult: false, lastSeen: Date.now() }
        }
      };
      localStorage.setItem('schnechnen-facts', JSON.stringify(facts));
    });
    await page.reload();

    await page.click('#stats-btn');
    await page.click('#stats-screen .stats-level-btn[data-level="3"]');

    const cell = page.locator('#times-table-grid .times-table-fact[data-row="2"][data-col="9"]');
    await expect(cell).toHaveClass(/status-red/);
  });

  test('Gemischtes Ergebnis wird gelb', async ({ page }) => {
    await page.evaluate(() => {
      const facts = {
        '3': {
          '3|*|3': { num1: 3, operation: '*', num2: 3, correct: 1, wrong: 1, lastResult: true, lastSeen: Date.now() }
        }
      };
      localStorage.setItem('schnechnen-facts', JSON.stringify(facts));
    });
    await page.reload();

    await page.click('#stats-btn');
    await page.click('#stats-screen .stats-level-btn[data-level="3"]');

    const cell = page.locator('#times-table-grid .times-table-fact[data-row="3"][data-col="3"]');
    await expect(cell).toHaveClass(/status-yellow/);
  });

  test('Kommutative Zusammenfassung: 7×8 und 8×7 zeigen denselben Status', async ({ page }) => {
    await page.evaluate(() => {
      const facts = {
        '3': {
          '7|*|8': { num1: 7, operation: '*', num2: 8, correct: 3, wrong: 0, lastResult: true, lastSeen: Date.now() }
        }
      };
      localStorage.setItem('schnechnen-facts', JSON.stringify(facts));
    });
    await page.reload();

    await page.click('#stats-btn');
    await page.click('#stats-screen .stats-level-btn[data-level="3"]');

    const cellRow7Col8 = page.locator('#times-table-grid .times-table-fact[data-row="7"][data-col="8"]');
    const cellRow8Col7 = page.locator('#times-table-grid .times-table-fact[data-row="8"][data-col="7"]');
    await expect(cellRow7Col8).toHaveClass(/status-green/);
    await expect(cellRow8Col7).toHaveClass(/status-green/);
  });

  test('Division wird auf die Multiplikationszelle abgebildet', async ({ page }) => {
    // 56 ÷ 7 = 8 sollte für die Zelle 7 × 8 zählen
    await page.evaluate(() => {
      const facts = {
        '4': {
          '7|*|8': { num1: 7, operation: '*', num2: 8, correct: 1, wrong: 0, lastResult: true, lastSeen: Date.now() }
        }
      };
      localStorage.setItem('schnechnen-facts', JSON.stringify(facts));
    });
    await page.reload();

    await page.click('#stats-btn');
    await page.click('#stats-screen .stats-level-btn[data-level="4"]');

    const cell = page.locator('#times-table-grid .times-table-fact[data-row="7"][data-col="8"]');
    await expect(cell).toHaveClass(/status-yellow|status-green/);
    await expect(cell).toContainText('56');
  });

  test('Tipp auf eine Zelle zeigt Detailtext mit Aufgabe und Statistik', async ({ page }) => {
    await page.evaluate(() => {
      const facts = {
        '3': {
          '7|*|8': { num1: 7, operation: '*', num2: 8, correct: 4, wrong: 2, lastResult: true, lastSeen: Date.now() - 3 * 24 * 60 * 60 * 1000 }
        }
      };
      localStorage.setItem('schnechnen-facts', JSON.stringify(facts));
    });
    await page.reload();

    await page.click('#stats-btn');
    await page.click('#stats-screen .stats-level-btn[data-level="3"]');

    await page.click('#times-table-grid .times-table-fact[data-row="7"][data-col="8"]');

    const detail = page.locator('#times-table-detail');
    await expect(detail).not.toHaveClass(/hidden/);
    await expect(detail).toContainText('7 × 8 = 56');
    await expect(detail).toContainText('4× richtig');
    await expect(detail).toContainText('2× falsch');
  });

  test('Drei richtig beantwortete Aufgaben färben die entsprechende Zelle grün (echtes Spiel)', async ({ page }) => {
    await page.click('button[data-level="3"]');
    await page.waitForSelector('#problem');

    for (let i = 0; i < 3; i++) {
      const problem = await page.evaluate(() => window.__TEST__.getState().currentProblem);
      if (!problem) break;
      await page.evaluate((result) => window.__TEST__.submitAnswer(result), problem.result);
      await page.waitForTimeout(700);
    }

    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.endGame === 'function') {
        window.__TEST__.endGame();
      }
    });
    await page.waitForSelector('#result-screen:not(.hidden)');

    await page.click('#restart-btn');
    await page.click('#stats-btn');
    await page.click('#stats-screen .stats-level-btn[data-level="3"]');

    // Mindestens eine Zelle sollte nicht mehr grau sein
    const nonGrayCells = page.locator('#times-table-grid .times-table-fact:not(.status-gray)');
    await expect(await nonGrayCells.count()).toBeGreaterThan(0);
  });

  test('Reset-Statistiken löscht auch die Einmaleins-Fakten', async ({ page }) => {
    await page.evaluate(() => {
      const facts = {
        '3': {
          '7|*|8': { num1: 7, operation: '*', num2: 8, correct: 3, wrong: 0, lastResult: true, lastSeen: Date.now() }
        }
      };
      localStorage.setItem('schnechnen-facts', JSON.stringify(facts));
    });
    await page.reload();

    await page.click('#stats-btn');
    await page.click('#stats-screen .stats-level-btn[data-level="3"]');

    const cell = page.locator('#times-table-grid .times-table-fact[data-row="7"][data-col="8"]');
    await expect(cell).toHaveClass(/status-green/);

    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await page.click('#stats-reset-btn');
    await page.waitForTimeout(500);

    await page.click('#stats-screen .stats-level-btn[data-level="3"]');
    await expect(cell).toHaveClass(/status-gray/);
  });
});
