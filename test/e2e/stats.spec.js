// test/e2e/stats.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Statistik-Seite Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // Lösche vorherige Daten aus localStorage
    await page.evaluate(() => {
      localStorage.removeItem('schnechnen-history');
      localStorage.removeItem('schnechnen-highscores');
    });
  });

  test('Statistik-Button ist sichtbar und funktioniert', async ({ page }) => {
    // Prüfe, dass der Statistik-Button sichtbar ist
    await expect(page.locator('#stats-btn')).toBeVisible();
    
    // Klicke auf den Statistik-Button
    await page.click('#stats-btn');
    
    // Prüfe, dass der Statistik-Screen angezeigt wird
    await expect(page.locator('#stats-screen')).not.toHaveClass(/hidden/);
    
    // Prüfe, dass Level-Buttons vorhanden sind
    const statsLevelButtons = page.locator('.stats-level-btn');
    await expect(statsLevelButtons).toHaveCount(4);
    
    // Prüfe, dass Statistik-Karten vorhanden sind
    await expect(page.locator('.stat-card')).toHaveCount(3);
  });

  test('Zurück-Button funktioniert', async ({ page }) => {
    // Gehe zur Statistik-Seite
    await page.click('#stats-btn');
    await expect(page.locator('#stats-screen')).not.toHaveClass(/hidden/);
    
    // Klicke auf Zurück
    await page.click('#stats-back-btn');
    
    // Prüfe, dass wir zurück zum Start-Screen sind
    await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
    await expect(page.locator('#stats-screen')).toHaveClass(/hidden/);
  });

  test('Statistik zeigt 0 bei keinen Spielen', async ({ page }) => {
    // Gehe zur Statistik-Seite
    await page.click('#stats-btn');
    
    // Prüfe Statistik-Werte
    await expect(page.locator('#stat-highscore')).toHaveText('0');
    await expect(page.locator('#stat-total-games')).toHaveText('0');
    await expect(page.locator('#stat-avg-score')).toHaveText('0');
  });

  test('Spiel-History wird gespeichert und angezeigt', async ({ page }) => {
    // Spiele ein kurzes Spiel
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');
    
    // Beende das Spiel sofort
    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.endGame === 'function') {
        window.__TEST__.endGame();
      }
    });
    
    // Warte auf Result-Screen
    await page.waitForSelector('#result-screen:not(.hidden)');
    
    // Gehe zurück zum Start und dann zu den Statistiken
    await page.click('#restart-btn');
    await page.click('#stats-btn');
    
    // Prüfe, dass mindestens 1 Spiel gespielt wurde
    const totalGames = await page.locator('#stat-total-games').textContent();
    expect(parseInt(totalGames)).toBeGreaterThan(0);
  });

  test('Level-Wechsel in Statistik funktioniert', async ({ page }) => {
    // Gehe zur Statistik-Seite
    await page.click('#stats-btn');
    
    // Level 1 ist standardmäßig aktiv
    await expect(page.locator('.stats-level-btn[data-level="1"]')).toHaveClass(/active/);
    
    // Klicke auf Level 2
    await page.click('.stats-level-btn[data-level="2"]');
    
    // Prüfe, dass Level 2 jetzt aktiv ist
    await expect(page.locator('.stats-level-btn[data-level="2"]')).toHaveClass(/active/);
    await expect(page.locator('.stats-level-btn[data-level="1"]')).not.toHaveClass(/active/);
  });

  test('Chart.js wird korrekt geladen', async ({ page }) => {
    // Prüfe, dass Chart.js global verfügbar ist
    await page.goto('http://localhost:8080');
    
    const chartExists = await page.evaluate(() => {
      return typeof Chart !== 'undefined';
    });
    
    expect(chartExists).toBe(true);
  });

  test('Chart-Container ist vorhanden', async ({ page }) => {
    await page.click('#stats-btn');
    
    // Prüfe, dass der Chart-Container vorhanden ist
    await expect(page.locator('.chart-container')).toBeVisible();
    await expect(page.locator('#highscore-chart')).toBeVisible();
  });

  test('Statistiken werden nach mehreren Spielen korrekt berechnet', async ({ page }) => {
    // Füge manuell mehrere Spiele zur History hinzu
    await page.evaluate(() => {
      const history = {
        '1': [
          { timestamp: Date.now() - 3000, score: 10, totalProblems: 15, percentage: 67 },
          { timestamp: Date.now() - 2000, score: 12, totalProblems: 15, percentage: 80 },
          { timestamp: Date.now() - 1000, score: 15, totalProblems: 15, percentage: 100 }
        ]
      };
      localStorage.setItem('schnechnen-history', JSON.stringify(history));
      
      const highscores = { '1': 15 };
      localStorage.setItem('schnechnen-highscores', JSON.stringify(highscores));
    });
    
    // Lade die Seite neu, damit die Daten geladen werden
    await page.reload();
    
    // Gehe zur Statistik-Seite
    await page.click('#stats-btn');
    
    // Prüfe Statistik-Werte
    await expect(page.locator('#stat-highscore')).toHaveText('15');
    await expect(page.locator('#stat-total-games')).toHaveText('3');
    
    // Durchschnitt sollte (10 + 12 + 15) / 3 = 12.33 ≈ 12 sein
    const avgScore = await page.locator('#stat-avg-score').textContent();
    expect(parseInt(avgScore)).toBe(12);
  });
});
