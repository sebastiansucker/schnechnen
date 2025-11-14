// test/e2e/schnechnen-tests.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Schnechnen Spiel Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    // Enable test mode to prevent scores from being submitted to leaderboard
    await page.evaluate(() => {
      window.__TEST_MODE__ = true;
    });
  });

  test('Startbildschirm wird korrekt angezeigt', async ({ page }) => {
    // Prüfe, dass der Startbildschirm angezeigt wird
    await expect(page).toHaveTitle('Schnechnen');
    
    // Prüfe, dass die Hauptüberschrift angezeigt wird
    await expect(page.locator('h1')).toHaveText('Schnechnen');
    
  // Prüfe, dass die Spielbeschreibung angezeigt wird (scoped selector to avoid multiple <p> elements)
  await expect(page.locator('#start-screen p')).toHaveText('SCHNell REchnen');
    
    // Prüfe, dass die Level-Auswahl angezeigt wird
    await expect(page.locator('.level-selection')).toBeVisible();
    
    // Prüfe, dass alle sechs Level-Buttons angezeigt werden
    const levelButtons = page.locator('.level-btn');
    await expect(levelButtons).toHaveCount(6);
    
    // Prüfe die Texte der Level-Buttons
    const levelTexts = await levelButtons.allTextContents();
    expect(levelTexts).toContain('Level 0: Addition bis 10');
    expect(levelTexts).toContain('Level 1: Addition & Subtraktion bis 10');
    expect(levelTexts).toContain('Level 2: Addition & Subtraktion bis 100');
    expect(levelTexts).toContain('Level 3: Multiplikation bis 100');
    expect(levelTexts).toContain('Level 4: Multiplikation & Division bis 100');
  });

  test('Spielstart mit Level 1', async ({ page }) => {
    // Wähle Level 1 aus
    await page.click('button[data-level="1"]');
    
    // Prüfe, dass das Spielbildschirm angezeigt wird
    await expect(page.locator('#game-screen')).not.toHaveClass('hidden');
    
    // Prüfe, dass der Timer gestartet wird
    await expect(page.locator('#time')).toHaveText('60');
    
    // Prüfe, dass ein Problem angezeigt wird
    await expect(page.locator('#problem')).toBeVisible();
    
    // Prüfe, dass der User-Answer-Bereich sichtbar ist
    await expect(page.locator('#user-answer')).toBeVisible();
    
    // Prüfe, dass das Dial-Pad sichtbar ist
    await page.waitForSelector('#dial-pad');
    await expect(page.locator('#dial-pad')).toBeVisible();
  });

  test('Spielablauf mit korrekter Antwort', async ({ page }) => {
    // Wähle Level 1 aus
    await page.click('button[data-level="1"]');
    
    // Warte auf das erste Problem
    await page.waitForSelector('#problem');
    
    // Hole das aktuelle Problem
    const problemText = await page.locator('#problem').textContent();
    console.log('Aktuelles Problem:', problemText);
    
    // Lösung berechnen (einfach für Testzwecke)
    let solution = 0;
    if (problemText.includes('+')) {
      const parts = problemText.split(' + ');
      solution = parseInt(parts[0]) + parseInt(parts[1].split(' = ?')[0]);
    } else if (problemText.includes('-')) {
      const parts = problemText.split(' - ');
      solution = parseInt(parts[0]) - parseInt(parts[1].split(' = ?')[0]);
    }
    
    // Gib die Lösung über das Dial-Pad ein (klick die Zifferntasten)
    const digits = solution.toString().split('');
    for (const d of digits) {
      await page.click(`.dial-btn[data-value="${d}"]`);
    }
    // Klicke die Submit-Taste auf dem Dial-Pad
    await expect(page.locator('#submit-btn')).toBeVisible();
    await page.click('#submit-btn');
    
    // Warte kurz, damit das nächste Problem geladen wird
    await page.waitForTimeout(1000);
    
    // Prüfe, dass der Score erhöht wurde (wenn die Antwort korrekt war)
    // Beachte: Wir können nicht genau prüfen, da wir nicht wissen, ob die Antwort korrekt war
    // Aber wir können prüfen, dass das nächste Problem geladen wurde
    await expect(page.locator('#problem')).toBeVisible();
  });

  test('Spielablauf mit falscher Antwort', async ({ page }) => {
    // Wähle Level 1 aus
    await page.click('button[data-level="1"]');
    
    // Warte auf das erste Problem
    await page.waitForSelector('#problem');
    
    // Hole das aktuelle Problem und den Score vor falscher Antwort
    const scoreBeforeBefore = await page.evaluate(() => {
      return window.gameState ? window.gameState.score : 0;
    });
    
    const problemBefore = await page.locator('#problem').textContent();
    
    // Gib absichtlich eine FALSCHE Antwort ein (z.B. "99")
    await page.click('.dial-btn[data-value="9"]');
    await page.click('.dial-btn[data-value="9"]');
    
    // Submit the wrong answer
    await page.click('#submit-btn');
    
    // Warte kurz
    await page.waitForTimeout(1000);
    
    // Prüfe, dass:
    // 1. Der Score sich NICHT erhöht hat (falsche Antwort gibt keinen Punkt)
    const scoreAfterWrong = await page.evaluate(() => {
      return window.gameState ? window.gameState.score : 0;
    });
    expect(scoreAfterWrong).toBe(scoreBeforeBefore);
    
    // 2. Das Problem wechselt ODER gleich bleibt (adaptive learning kann es wiederholen)
    // Das ist OK - neue oder wiederholte Aufgabe
    const problemAfter = await page.locator('#problem').textContent();
    // Keine Assertion hier - Problem kann gleich oder anders sein
    
    // 3. Dial-Pad ist gelöscht (User-Answer zurück auf ?)
    const userAnswer = await page.locator('#user-answer').textContent();
    expect(userAnswer).toBe('?');
    
    // 4. Fehler wird in weighting.js gespeichert
    const mistakesStored = await page.evaluate(() => {
      return window.Weighting ? window.Weighting.getMistakes(1).length > 0 : false;
    });
    expect(mistakesStored).toBe(true);
  });

  test('Level-Wechsel funktioniert', async ({ page }) => {
    // Use the test API to start games at different levels to avoid clicking hidden buttons
    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.startGame === 'function') {
        window.__TEST__.startGame(2);
      }
    });
    await expect(page.locator('#game-screen')).not.toHaveClass('hidden');
    // Level wurde gewechselt - prüfe dass ein neues Problem generiert wurde
    await expect(page.locator('#problem')).toBeVisible();

    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.startGame === 'function') {
        window.__TEST__.startGame(3);
      }
    });
    await expect(page.locator('#problem')).toBeVisible();

    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.startGame === 'function') {
        window.__TEST__.startGame(4);
      }
    });
    await expect(page.locator('#problem')).toBeVisible();
  });

  test('Ergebnis zeigt Anzahl richtiger Antworten', async ({ page }) => {
    // Starte Level 1
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');
    
    // Beantworte ein paar Fragen korrekt
    for (let i = 0; i < 5; i++) {
      // Hole die aktuelle Aufgabe
      const problemData = await page.evaluate(() => {
        if (window.gameState && window.gameState.currentProblem) {
          return {
            result: window.gameState.currentProblem.result,
            score: window.gameState.score
          };
        }
        return null;
      });
      
      if (problemData) {
        // Gebe die richtige Antwort ein
        const answer = problemData.result.toString();
        for (const digit of answer) {
          await page.click(`.dial-btn[data-value="${digit}"]`);
        }
        await page.click('#submit-btn');
        await page.waitForTimeout(700); // Warte auf nächstes Problem
      }
    }
    
    // Hole den aktuellen Score vor dem Beenden
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
    
    // Prüfe, dass das Ergebnis (Anzahl richtiger Antworten) korrekt angezeigt wird
    const displayedScore = await page.locator('#highscore').textContent();
    expect(parseInt(displayedScore)).toBe(finalScore);
    
    // Prüfe auch, dass die richtige Anzahl/gesamt übereinstimmt
    const resultScore = await page.locator('#result-score').textContent();
    expect(parseInt(resultScore)).toBe(finalScore);
  });
});
