// test/e2e/weighting-integration.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Fehlertracking und Adaptive Learning Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // Lösche vorherige Fehler aus localStorage
    await page.evaluate(() => {
      localStorage.removeItem('schnechnen-mistakes');
      localStorage.removeItem('schnechnen-highscores');
    });
  });

  test('window.Weighting ist im Browser verfügbar', async ({ page }) => {
    // Prüfe, dass window.Weighting existiert
    const weightingExists = await page.evaluate(() => {
      return typeof window.Weighting !== 'undefined';
    });
    
    expect(weightingExists).toBe(true);
    
    // Prüfe, dass alle benötigten Funktionen existieren
    const hasFunctions = await page.evaluate(() => {
      return (
        typeof window.Weighting.addMistake === 'function' &&
        typeof window.Weighting.getMistakes === 'function' &&
        typeof window.Weighting.peekMistake === 'function' &&
        typeof window.Weighting.removeMistake === 'function' &&
        typeof window.Weighting.clear === 'function'
      );
    });
    
    expect(hasFunctions).toBe(true);
  });

  test('Fehler werden in localStorage gespeichert', async ({ page }) => {
    // Starte Level 1
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');
    
    // Gib absichtlich eine falsche Antwort
    await page.click('.dial-btn[data-value="9"]');
    await page.click('.dial-btn[data-value="9"]');
    await page.click('#submit-btn');
    
    // Warte kurz für die Verarbeitung
    await page.waitForTimeout(700);
    
    // Prüfe, dass Fehler in localStorage gespeichert wurden
    const mistakes = await page.evaluate(() => {
      const data = localStorage.getItem('schnechnen-mistakes');
      return data ? JSON.parse(data) : {};
    });
    
    // Level 1 sollte mindestens einen Fehler haben
    expect(mistakes['1']).toBeDefined();
    expect(mistakes['1'].length).toBeGreaterThan(0);
    expect(mistakes['1'][0]).toHaveProperty('num1');
    expect(mistakes['1'][0]).toHaveProperty('num2');
    expect(mistakes['1'][0]).toHaveProperty('operation');
    expect(mistakes['1'][0]).toHaveProperty('result');
    expect(mistakes['1'][0]).toHaveProperty('wrongCount');
    expect(mistakes['1'][0].wrongCount).toBe(1);
  });

  test('Häufig falsche Aufgaben werden am Ende angezeigt', async ({ page }) => {
    // Starte Level 1
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');
    
    // Gib mehrere falsche Antworten
    for (let i = 0; i < 3; i++) {
      await page.click('.dial-btn[data-value="9"]');
      await page.click('.dial-btn[data-value="9"]');
      await page.click('#submit-btn');
      await page.waitForTimeout(700);
    }
    
    // Beende das Spiel
    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.endGame === 'function') {
        window.__TEST__.endGame();
      }
    });
    
    // Warte auf Result-Screen
    await page.waitForSelector('#result-screen:not(.hidden)');
    
    // Prüfe, dass die Fehler-Liste angezeigt wird
    await expect(page.locator('#mistake-list')).toBeVisible();
    
    // Prüfe, dass mindestens ein Fehler angezeigt wird
    const mistakeItems = page.locator('#mistake-list li');
    const count = await mistakeItems.count();
    expect(count).toBeGreaterThan(0);
    
    // Prüfe, dass die Fehler das Format "num1 op num2 = result (Nx falsch)" haben
    const firstMistake = await mistakeItems.first().textContent();
    expect(firstMistake).toMatch(/\d+\s+[+\-×÷]\s+\d+\s+=\s+\d+\s+\(\d+×\s+falsch\)/);
  });

  test('Korrekte Antworten entfernen Fehler aus der Liste', async ({ page }) => {
    // Füge manuell einen Fehler hinzu
    await page.evaluate(() => {
      window.Weighting.addMistake(1, {
        num1: 5,
        num2: 3,
        operation: '+',
        result: 8
      });
    });
    
    // Prüfe, dass der Fehler existiert
    let mistakes = await page.evaluate(() => {
      return window.Weighting.getMistakes(1);
    });
    expect(mistakes.length).toBe(1);
    
    // Entferne den Fehler
    await page.evaluate(() => {
      window.Weighting.removeMistake(1, {
        num1: 5,
        num2: 3,
        operation: '+',
        result: 8
      });
    });
    
    // Prüfe, dass der Fehler entfernt wurde
    mistakes = await page.evaluate(() => {
      return window.Weighting.getMistakes(1);
    });
    expect(mistakes.length).toBe(0);
  });

  test('wrongCount wird korrekt inkrementiert', async ({ page }) => {
    // Starte Level 1 und hole das erste Problem
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');
    
    // Gib 5x falsche Antworten (verschiedene Probleme)
    for (let i = 0; i < 5; i++) {
      // Gib falsche Antwort
      await page.click('.dial-btn[data-value="9"]');
      await page.click('.dial-btn[data-value="9"]');
      await page.click('#submit-btn');
      await page.waitForTimeout(700);
    }
    
    // Prüfe, dass Fehler mit verschiedenen wrongCounts existieren
    const mistakes = await page.evaluate(() => {
      return window.Weighting.getMistakes(1);
    });
    
    expect(mistakes.length).toBeGreaterThan(0);
    
    // Die Summe aller wrongCounts sollte mindestens 5 sein (da wir 5 Fehler gemacht haben)
    const totalWrongCount = mistakes.reduce((sum, m) => sum + (m.wrongCount || 0), 0);
    expect(totalWrongCount).toBeGreaterThanOrEqual(5);
    
    // Mindestens ein Fehler sollte existieren (auch wenn wrongCount nur 1 ist)
    expect(mistakes.every(m => m.wrongCount >= 1)).toBe(true);
  });
});
