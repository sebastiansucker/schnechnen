// test/e2e/stats.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Statistik-Seite Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // Lösche vorherige Daten aus localStorage
    await page.evaluate(() => {
      localStorage.removeItem('schnechnen-history');
      localStorage.removeItem('schnechnen-highscores');
      // Enable test mode to prevent scores from being submitted to leaderboard
      window.__TEST_MODE__ = true;
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
  await expect(statsLevelButtons).toHaveCount(6);
    
    // Prüfe, dass Statistik-Karten vorhanden sind
    await expect(page.locator('.stat-card')).toHaveCount(2);
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
  });

  test('Highscore wird sofort nach Spiel in Statistik angezeigt', async ({ page }) => {
    // Spiele ein kurzes Spiel
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');
    
    // Beantworte 3 Fragen korrekt
    for (let i = 0; i < 3; i++) {
      const problemData = await page.evaluate(() => {
        if (window.gameState && window.gameState.currentProblem) {
          return { result: window.gameState.currentProblem.result };
        }
        return null;
      });
      
      if (problemData) {
        const answer = problemData.result.toString();
        for (const digit of answer) {
          await page.click(`.dial-btn[data-value="${digit}"]`);
        }
        await page.click('#submit-btn');
        await page.waitForTimeout(700);
      }
    }
    
    // Hole den Score vor dem Beenden
    const finalScore = await page.evaluate(() => {
      return window.gameState ? window.gameState.score : 0;
    });
    
    // Beende das Spiel
    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.endGame === 'function') {
        window.__TEST__.endGame();
      }
    });
    
    // Warte auf Result-Screen
    await page.waitForSelector('#result-screen:not(.hidden)');
    
    // Gehe zurück und zur Statistik
    await page.click('#restart-btn');
    await page.click('#stats-btn');
    
    // Prüfe, dass der Highscore sofort sichtbar ist (ohne Reload!)
    await expect(page.locator('#stat-highscore')).toHaveText(finalScore.toString());
    await expect(page.locator('#stat-total-games')).toHaveText('1');
  });

  test('Fehler-Sektion zeigt "Keine Fehler" bei leeren Daten', async ({ page }) => {
    // Gehe zur Statistik-Seite
    await page.click('#stats-btn');
    
    // Prüfe, dass die Fehler-Liste die "Keine Fehler"-Nachricht zeigt
    await expect(page.locator('#stats-mistake-list .no-mistakes')).toBeVisible();
    await expect(page.locator('#stats-mistake-list .no-mistakes')).toContainText('Keine Fehler');
  });

  test('Fehler-Sektion zeigt Top 5 Fehler an', async ({ page }) => {
    // Füge Fehler in localStorage ein
    await page.evaluate(() => {
      const mistakes = {
        '1': [
          { num1: 7, num2: 8, operation: '+', result: 15, wrongCount: 5 },
          { num1: 9, num2: 4, operation: '-', result: 5, wrongCount: 3 },
          { num1: 6, num2: 7, operation: '*', result: 42, wrongCount: 8 },
          { num1: 12, num2: 3, operation: '/', result: 4, wrongCount: 2 },
          { num1: 5, num2: 5, operation: '+', result: 10, wrongCount: 1 },
          { num1: 8, num2: 2, operation: '*', result: 16, wrongCount: 6 }
        ]
      };
      localStorage.setItem('schnechnen-mistakes', JSON.stringify(mistakes));
    });
    
    // Lade die Seite neu
    await page.reload();
    
    // Gehe zur Statistik-Seite
    await page.click('#stats-btn');
    
    // Prüfe, dass genau 5 Fehler angezeigt werden (nicht die "no-mistakes" Nachricht)
    const mistakeItems = page.locator('#stats-mistake-list li:not(.no-mistakes)');
    await expect(mistakeItems).toHaveCount(5);
    
    // Prüfe, dass die Fehler nach wrongCount sortiert sind
    const firstMistake = mistakeItems.nth(0);
    await expect(firstMistake).toContainText('6 × 7 = 42');
    await expect(firstMistake).toContainText('8× falsch');
  });

  test('Fehler-Sektion zeigt korrekte Operatoren', async ({ page }) => {
    // Füge Fehler mit verschiedenen Operatoren ein
    await page.evaluate(() => {
      const mistakes = {
        '2': [
          { num1: 6, num2: 7, operation: '*', result: 42, wrongCount: 3 },
          { num1: 12, num2: 3, operation: '/', result: 4, wrongCount: 2 }
        ]
      };
      localStorage.setItem('schnechnen-mistakes', JSON.stringify(mistakes));
    });
    
    // Lade die Seite neu
    await page.reload();
    
    // Gehe zur Statistik-Seite
    await page.click('#stats-btn');
    
    // Wechsle zu Level 2
    await page.click('.stats-level-btn[data-level="2"]');
    
    // Prüfe, dass Multiplikation als × angezeigt wird
    await expect(page.locator('#stats-mistake-list li').first()).toContainText('6 × 7 = 42');
    
    // Prüfe, dass Division als ÷ angezeigt wird
    await expect(page.locator('#stats-mistake-list li').nth(1)).toContainText('12 ÷ 3 = 4');
  });

  test('Fehler-Sektion aktualisiert sich beim Level-Wechsel', async ({ page }) => {
    // Füge Fehler für verschiedene Level ein
    await page.evaluate(() => {
      const mistakes = {
        '1': [
          { num1: 5, num2: 3, operation: '+', result: 8, wrongCount: 4 }
        ],
        '2': [
          { num1: 12, num2: 4, operation: '*', result: 48, wrongCount: 6 }
        ]
      };
      localStorage.setItem('schnechnen-mistakes', JSON.stringify(mistakes));
    });
    
    // Lade die Seite neu
    await page.reload();
    
    // Gehe zur Statistik-Seite
    await page.click('#stats-btn');
    
    // Prüfe Level 1 Fehler
    await expect(page.locator('#stats-mistake-list li').first()).toContainText('5 + 3 = 8');
    
    // Wechsle zu Level 2
    await page.click('.stats-level-btn[data-level="2"]');
    
    // Prüfe Level 2 Fehler
    await expect(page.locator('#stats-mistake-list li').first()).toContainText('12 × 4 = 48');
  });

  test('Reset-Statistiken funktioniert und löscht alle Daten', async ({ page }) => {
    // Füge Spiel-History, Highscores und Fehler ein
    await page.evaluate(() => {
      const history = {
        '1': [
          { timestamp: Date.now() - 2000, score: 10, totalProblems: 15, percentage: 67 },
          { timestamp: Date.now() - 1000, score: 15, totalProblems: 15, percentage: 100 }
        ]
      };
      localStorage.setItem('schnechnen-history', JSON.stringify(history));
      
      const highscores = { '1': 15, '2': 20 };
      localStorage.setItem('schnechnen-highscores', JSON.stringify(highscores));
      
      const mistakes = {
        '1': [
          { num1: 7, num2: 8, operation: '+', result: 15, wrongCount: 5 },
          { num1: 9, num2: 4, operation: '-', result: 5, wrongCount: 3 }
        ]
      };
      localStorage.setItem('schnechnen-mistakes', JSON.stringify(mistakes));
    });
    
    // Lade die Seite neu
    await page.reload();
    
    // Gehe zur Statistik-Seite
    await page.click('#stats-btn');
    
    // Verifiziere, dass Daten vorhanden sind
    await expect(page.locator('#stat-highscore')).toHaveText('15');
    await expect(page.locator('#stat-total-games')).toHaveText('2');
    
    // Stelle sicher, dass Fehler vorhanden sind
    const mistakesBefore = page.locator('#stats-mistake-list li:not(.no-mistakes)');
    await expect(mistakesBefore).toHaveCount(2);
    
    // Klicke auf Reset-Button
    const resetBtn = page.locator('#stats-reset-btn');
    await expect(resetBtn).toBeVisible();
    
    // Reagiere auf Dialog - akzeptiere ihn
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Statistiken');
      await dialog.accept();
    });
    
    await page.click('#stats-reset-btn');
    await page.waitForTimeout(500);
    
    // Verifiziere, dass alles zurückgesetzt wurde
    await expect(page.locator('#stat-highscore')).toHaveText('0');
    await expect(page.locator('#stat-total-games')).toHaveText('0');
    
    // Prüfe, dass die "Keine Fehler"-Nachricht wieder sichtbar ist
    await expect(page.locator('#stats-mistake-list .no-mistakes')).toBeVisible();
    await expect(page.locator('#stats-mistake-list .no-mistakes')).toContainText('Keine Fehler');
  });

  test('Reset-Dialog kann abgebrochen werden', async ({ page }) => {
    // Füge Testdaten ein
    await page.evaluate(() => {
      const highscores = { '1': 50 };
      localStorage.setItem('schnechnen-highscores', JSON.stringify(highscores));
    });
    
    // Lade die Seite neu
    await page.reload();
    
    // Gehe zur Statistik-Seite
    await page.click('#stats-btn');
    
    // Verifiziere initiale Daten
    await expect(page.locator('#stat-highscore')).toHaveText('50');
    
    // Lehne Dialog ab
    page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
    
    // Klicke Reset-Button
    await page.click('#stats-reset-btn');
    await page.waitForTimeout(500);
    
    // Verifiziere, dass Daten NICHT gelöscht wurden
    await expect(page.locator('#stat-highscore')).toHaveText('50');
  });

  test('Reset-Button ist nur in Stats-Screen sichtbar', async ({ page }) => {
    // Stelle sicher, dass Reset-Button auf Start-Screen nicht sichtbar ist
    const resetBtnStart = page.locator('#stats-reset-btn');
    await expect(resetBtnStart).not.toBeVisible();
    
    // Gehe zur Statistik-Seite
    await page.click('#stats-btn');
    
    // Jetzt sollte Reset-Button sichtbar sein
    const resetBtnStats = page.locator('#stats-reset-btn');
    await expect(resetBtnStats).toBeVisible();
    
    // Gehe zurück
    await page.click('#stats-back-btn');
    
    // Reset-Button sollte wieder nicht sichtbar sein
    const resetBtnStartAgain = page.locator('#stats-reset-btn');
    await expect(resetBtnStartAgain).not.toBeVisible();
  });

  // === Highscore-Animation Tests (integriert von highscore-animation.spec.js) ===

  test('Highscore-Animation wird angezeigt, wenn Highscore geknackt wird', async ({ page }) => {
    // Spiele ein Spiel auf Level 1
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');
    
    // Beantworte mehrere Fragen korrekt, um einen hohen Score zu bekommen
    let questionsAnswered = 0;
    const maxQuestions = 5;
    
    while (questionsAnswered < maxQuestions) {
      const problemData = await page.evaluate(() => {
        if (window.gameState && window.gameState.currentProblem) {
          return { result: window.gameState.currentProblem.result };
        }
        return null;
      });
      
      if (problemData) {
        const answer = problemData.result.toString();
        for (const digit of answer) {
          await page.click(`.dial-btn[data-value="${digit}"]`);
        }
        await page.click('#submit-btn');
        await page.waitForTimeout(500);
        questionsAnswered++;
      } else {
        break;
      }
    }
    
    // Beende das Spiel
    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.endGame === 'function') {
        window.__TEST__.endGame();
      }
    });
    
    // Warte auf Result-Screen
    await page.waitForSelector('#result-screen:not(.hidden)');
    
    // Prüfe, dass Highscore-Animation sichtbar ist (wenn Score > 0)
    const animationContainer = page.locator('#highscore-animation');
    const isHidden = await animationContainer.evaluate(el => 
      el.classList.contains('hidden')
    );
    
    const score = await page.evaluate(() => window.gameState?.score || 0);
    if (score > 0) {
      expect(isHidden).toBe(false);
      await expect(animationContainer).toContainText('Neue Highscore!');
      
      // Animation sollte nach ~5 Sekunden verschwinden
      await page.waitForTimeout(5500);
      
      const isHiddenAfter = await animationContainer.evaluate(el => 
        el.classList.contains('hidden')
      );
      expect(isHiddenAfter).toBe(true);
    }
  });

  test('Highscore-Animation zeigt nicht, wenn Score nicht besser ist', async ({ page }) => {
    // Setze einen Highscore von 100 für Level 1
    await page.evaluate(() => {
      const highscores = { '1': 100 };
      localStorage.setItem('schnechnen-highscores', JSON.stringify(highscores));
    });
    
    // Lade die Seite neu
    await page.reload();
    
    // Starte ein Spiel auf Level 1
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
    
    // Animation sollte hidden bleiben (da Score < Highscore)
    const animationContainer = page.locator('#highscore-animation');
    const isHidden = await animationContainer.evaluate(el => 
      el.classList.contains('hidden')
    );
    
    expect(isHidden).toBe(true);
  });

  test('Confetti-Partikel werden bei Highscore-Animation erstellt', async ({ page }) => {
    // Spiele ein Spiel
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');
    
    // Beantworte Fragen
    for (let i = 0; i < 3; i++) {
      const problemData = await page.evaluate(() => {
        if (window.gameState && window.gameState.currentProblem) {
          return { result: window.gameState.currentProblem.result };
        }
        return null;
      });
      
      if (problemData) {
        const answer = problemData.result.toString();
        for (const digit of answer) {
          await page.click(`.dial-btn[data-value="${digit}"]`);
        }
        await page.click('#submit-btn');
        await page.waitForTimeout(500);
      }
    }
    
    // Beende das Spiel
    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.endGame === 'function') {
        window.__TEST__.endGame();
      }
    });
    
    // Warte auf Result-Screen
    await page.waitForSelector('#result-screen:not(.hidden)');
    
    const score = await page.evaluate(() => window.gameState?.score || 0);
    
    if (score > 0) {
      // Warte kurz, damit Confetti gerendert wird
      await page.waitForTimeout(500);
      
      // Zähle Confetti-Elemente
      const confettiCount = await page.locator('.confetti-piece').count();
      
      // Es sollten Confetti-Partikel vorhanden sein
      expect(confettiCount).toBeGreaterThanOrEqual(10);
    }
  });

  test('Animation wird nach 5 Sekunden entfernt', async ({ page }) => {
    // Spiele ein Spiel
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');
    
    // Beantworte mindestens eine Frage
    const problemData = await page.evaluate(() => {
      if (window.gameState && window.gameState.currentProblem) {
        return { result: window.gameState.currentProblem.result };
      }
      return null;
    });
    
    if (problemData) {
      const answer = problemData.result.toString();
      for (const digit of answer) {
        await page.click(`.dial-btn[data-value="${digit}"]`);
      }
      await page.click('#submit-btn');
    }
    
    // Beende das Spiel
    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.endGame === 'function') {
        window.__TEST__.endGame();
      }
    });
    
    // Warte auf Result-Screen
    await page.waitForSelector('#result-screen:not(.hidden)');
    
    const animationContainer = page.locator('#highscore-animation');
    const score = await page.evaluate(() => window.gameState?.score || 0);
    
    if (score > 0) {
      // Animation sollte anfangs sichtbar sein
      let isHiddenInitial = await animationContainer.evaluate(el => 
        el.classList.contains('hidden')
      );
      expect(isHiddenInitial).toBe(false);
      
      // Warte 5.5 Sekunden
      await page.waitForTimeout(5500);
      
      // Animation sollte jetzt hidden sein
      let isHiddenFinal = await animationContainer.evaluate(el => 
        el.classList.contains('hidden')
      );
      expect(isHiddenFinal).toBe(true);
    }
  });
});
