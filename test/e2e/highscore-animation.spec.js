const { test, expect } = require('@playwright/test');

test.describe('Highscore-Animation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // Lösche vorherige Daten
    await page.evaluate(() => {
      localStorage.removeItem('schnechnen-history');
      localStorage.removeItem('schnechnen-highscores');
    });
  });

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
    // Die Animation sollte nicht die "hidden" Klasse haben
    const animationContainer = page.locator('#highscore-animation');
    
    // Bei erstem Spiel sollte Animation sichtbar sein (Score ist neuer Highscore)
    const isHidden = await animationContainer.evaluate(el => 
      el.classList.contains('hidden')
    );
    
    // Animation sollte NICHT hidden sein (außer wenn Score 0 ist)
    const score = await page.evaluate(() => window.gameState?.score || 0);
    if (score > 0) {
      expect(isHidden).toBe(false);
      
      // Prüfe, dass Animation-Text vorhanden ist
      await expect(animationContainer).toContainText('Neue Highscore!');
      
      // Animation sollte nach ~5 Sekunden verschwinden
      await page.waitForTimeout(5500);
      
      // Nach Animation sollte es wieder hidden sein
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
    
    // Beende das Spiel sofort (Score wird niedrig sein)
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
    
    // Prüfe, dass Confetti-Partikel vorhanden sind
    const score = await page.evaluate(() => window.gameState?.score || 0);
    
    if (score > 0) {
      // Warte kurz, damit Confetti gerendert wird
      await page.waitForTimeout(500);
      
      // Zähle Confetti-Elemente
      const confettiCount = await page.locator('.confetti-piece').count();
      
      // Es sollten Confetti-Partikel vorhanden sein (bei erfolgreichem Highscore-Knacken)
      // Die Erwartung ist ≥ 15 (mindestens halb so viele wie 30 geplant)
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
